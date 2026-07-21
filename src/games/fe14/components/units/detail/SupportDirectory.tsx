import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { displayId, fe14Data, type SealGrant, type UnitRuntime } from "../../../data";
import { ClassTreeLabel } from "./ClassTree";
import { avatarTalentClassIds } from "./AvatarConfiguration";
import type { AvatarSelection } from "./types";
import { corrinBorrowedClassId, formatRoute } from "./utils";
import { useLocale } from "../../../../../i18n/LocaleContext";

type LocaleApi = ReturnType<typeof useLocale>;
type Translate = LocaleApi["t"];
type Resolver = LocaleApi["resolve"];

function partnerNameOf(
  support: UnitRuntime["supports"][number],
  partnerIdentity: UnitRuntime["identity"] | undefined,
  t: Translate,
  resolve: Resolver,
): string {
  if (support.partnerUnitId !== "corrin") {
    return partnerIdentity ? resolve(partnerIdentity.names, partnerIdentity.displayName) : displayId(support.partnerUnitId);
  }
  return t(support.partnerGender === "male" ? "support.corrinMale" : "support.corrinFemale");
}

export type SealPreviewKind = "friendship" | "partner";

export interface SealGrantPreview {
  supportId: string;
  seal: SealPreviewKind;
  partnerUnitId: string;
  partnerName: string;
  grantedClassId: string;
}

export type SealGrantPreviews = Partial<Record<SealPreviewKind, SealGrantPreview>>;

export default function SupportDirectory({
  unit,
  avatarSelection,
  selectedSealPreviews,
  onSealPreviewChange,
}: {
  unit: UnitRuntime;
  avatarSelection: AvatarSelection | null;
  selectedSealPreviews: SealGrantPreviews;
  onSealPreviewChange: (seal: SealPreviewKind, preview: SealGrantPreview | null) => void;
}) {
  const { t, resolve } = useLocale();
  const grantsBySupport = new Map<string, SealGrant>(
    (unit.classAccess?.sealGrants ?? []).map((grant) => [grant.supportRelationshipId, grant]),
  );
  const visibleSupports = avatarSelection
    ? unit.supports.filter((support) => support.partnerGender === avatarSelection.gender)
    : unit.supports;
  const selectedTalentClasses = new Set(
    avatarSelection ? avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) : [],
  );
  if (unit.identity.id === "corrin" && avatarSelection) {
    for (const support of visibleSupports) {
      const classId = corrinBorrowedClassId(support.partnerUnitId, avatarSelection.gender);
      if (!classId) continue;
      grantsBySupport.set(support.id, {
        supportRelationshipId: support.id,
        seal: support.kind === "romantic" ? "partner" : "friendship",
        borrowedClassId: classId,
        grantedClassId: classId,
        resolution: "direct",
        alreadyOwnedVia: selectedTalentClasses.has(classId) ? "heart_seal" : undefined,
      });
    }
  }
  const alreadyOwnedVia = new Set(
    Array.from(grantsBySupport.values())
      .map((grant) => grant.alreadyOwnedVia)
      .filter((value): value is NonNullable<SealGrant["alreadyOwnedVia"]> => value !== undefined),
  );
  const rosterById = new Map(fe14Data.roster.map((rosterUnit) => [rosterUnit.id, rosterUnit]));
  const bySupportRoutesThenPartnerUnitNo = (
    left: UnitRuntime["supports"][number],
    right: UnitRuntime["supports"][number],
  ) => {
    const leftPartner = rosterById.get(left.partnerUnitId);
    const rightPartner = rosterById.get(right.partnerUnitId);
    return right.routes.length - left.routes.length ||
      (leftPartner?.unitNo ?? Number.MAX_SAFE_INTEGER) - (rightPartner?.unitNo ?? Number.MAX_SAFE_INTEGER) ||
      left.id.localeCompare(right.id);
  };
  const nonRomantic = visibleSupports.filter((support) => support.kind !== "romantic");
  const friendship = nonRomantic
    .filter((support) => unit.identity.id === "corrin" || grantsBySupport.has(support.id))
    .sort(bySupportRoutesThenPartnerUnitNo);
  const noClassGrant = nonRomantic
    .filter((support) => unit.identity.id !== "corrin" && !grantsBySupport.has(support.id))
    .sort(bySupportRoutesThenPartnerUnitNo);
  const romantic = visibleSupports
    .filter((support) => support.kind === "romantic")
    .sort(bySupportRoutesThenPartnerUnitNo);
  const previewOptions = {
    friendship: unit.identity.id === "corrin"
      ? []
      : buildPreviewOptions(friendship, grantsBySupport, rosterById, "friendship", t, resolve),
    partner: buildPreviewOptions(romantic, grantsBySupport, rosterById, "partner", t, resolve),
  };
  const friendshipOptionSignature = previewOptions.friendship
    .map((option) => `${option.supportId}:${option.grantedClassId}`)
    .join("|");
  const partnerOptionSignature = previewOptions.partner
    .map((option) => `${option.supportId}:${option.grantedClassId}`)
    .join("|");

  useEffect(() => {
    (["friendship", "partner"] as const).forEach((seal) => {
      const selected = selectedSealPreviews[seal];
      if (!selected) return;
      const current = previewOptions[seal].find((option) => option.supportId === selected.supportId);
      if (!current) {
        onSealPreviewChange(seal, null);
      } else if (
        current.grantedClassId !== selected.grantedClassId
        || current.partnerName !== selected.partnerName
      ) {
        onSealPreviewChange(seal, current);
      }
    });
  }, [
    friendshipOptionSignature,
    onSealPreviewChange,
    partnerOptionSignature,
    selectedSealPreviews.friendship,
    selectedSealPreviews.partner,
  ]);

  return (
    <div>
      {unit.identity.supportNotes?.map((note, index) => (
        <p className="support-availability-note" key={note}>
          <strong>{t("support.availability")}</strong> {resolve({ en: note, zhHans: unit.identity.supportNotesZhHans?.[index] })}
        </p>
      ))}
      {unit.identity.id === "corrin" ? (
        <p className="support-availability-note">
          <strong>{t("support.friendshipAccessTitle")}</strong> {t("support.friendshipAccessBody")}
        </p>
      ) : null}
      <div className="support-groups">
        <div className="support-column support-column-friendship">
          <SupportGroup
            title={unit.identity.id === "corrin" ? t("support.group.friendshipCorrin") : t("support.group.friendship")}
            supports={friendship}
            grants={grantsBySupport}
            groupName={unit.identity.id === "corrin" ? undefined : `${unit.identity.id}-friendship-seal-preview`}
            seal={unit.identity.id === "corrin" ? undefined : "friendship"}
            selectedPreview={unit.identity.id === "corrin" ? undefined : selectedSealPreviews.friendship}
            onPreviewChange={unit.identity.id === "corrin" ? undefined : onSealPreviewChange}
          />
          <SupportGroup title={t("support.group.noGrant")} supports={noClassGrant} grants={grantsBySupport} />
        </div>
        <div className="support-column support-column-partner">
          <SupportGroup
            title={t("support.group.partner")}
            supports={romantic}
            grants={grantsBySupport}
            groupName={`${unit.identity.id}-partner-seal-preview`}
            seal="partner"
            selectedPreview={selectedSealPreviews.partner}
            onPreviewChange={onSealPreviewChange}
          />
        </div>
      </div>
      {alreadyOwnedVia.size > 0 ? (
        <p className="seal-owned-legend">
          <TriangleAlert aria-hidden="true" size={17} />
          <span>
            <strong>{t("support.caution")}</strong>{" "}
            {t("support.ownedBody", { sources: formatOwnedSources(alreadyOwnedVia, t) })}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function SupportGroup({
  title,
  supports,
  grants,
  groupName,
  seal,
  selectedPreview,
  onPreviewChange,
}: {
  title: string;
  supports: UnitRuntime["supports"];
  grants: Map<string, SealGrant>;
  groupName?: string;
  seal?: SealPreviewKind;
  selectedPreview?: SealGrantPreview;
  onPreviewChange?: (seal: SealPreviewKind, preview: SealGrantPreview | null) => void;
}) {
  const { t, resolve, locale } = useLocale();
  if (supports.length === 0) return null;
  const rosterById = new Map(fe14Data.roster.map((unit) => [unit.id, unit]));
  const previewBySupportId = new Map(
    seal ? buildPreviewOptions(supports, grants, rosterById, seal, t, resolve).map((preview) => [preview.supportId, preview]) : [],
  );
  return (
    <div className="support-group">
      <h3>{title}</h3>
      <div className="support-list" role={seal ? "radiogroup" : undefined} aria-label={seal ? t("support.previewAria", { title }) : undefined}>
        {seal && groupName && previewBySupportId.size > 0 ? (
          <label className="support-preview-none">
            <input
              type="radio"
              name={groupName}
              checked={!selectedPreview}
              onChange={() => onPreviewChange?.(seal, null)}
            />
            <span>{t("support.previewNone")}</span>
          </label>
        ) : null}
        {supports.map((support) => {
          const partner = fe14Data.roster.find((unit) => unit.id === support.partnerUnitId);
          const grant = grants.get(support.id);
          const preview = previewBySupportId.get(support.id);
          return (
            <div className={`support-row${selectedPreview?.supportId === support.id ? " is-preview-selected" : ""}`} key={support.id}>
              <span className="support-preview-choice">
                {seal && groupName && preview ? (
                  <input
                    type="radio"
                    name={groupName}
                    checked={selectedPreview?.supportId === support.id}
                    aria-label={t("support.previewItemAria", { name: preview.partnerName, seal: t(seal === "friendship" ? "support.seal.friendship" : "support.seal.partner") })}
                    onChange={() => onPreviewChange?.(seal, preview)}
                  />
                ) : null}
              </span>
              <span>{partnerNameOf(support, partner, t, resolve)}</span>
              <span>
                {support.routes.map((route) => formatRoute(route, locale)).join(" / ")}
              </span>
              <div className="support-grant-result">
                <strong>
                  {grant ? <ClassTreeLabel classId={grant.grantedClassId} /> : t("support.noClassGrant")}
                  {grant?.alreadyOwnedVia ? (
                    <TriangleAlert
                      aria-label={t("support.alreadyVia", { source: t(grant.alreadyOwnedVia === "base" ? "support.via.base" : "support.via.heartSeal") })}
                      className="seal-owned-marker"
                      size={16}
                    />
                  ) : null}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildPreviewOptions(
  supports: UnitRuntime["supports"],
  grants: Map<string, SealGrant>,
  rosterById: Map<string, UnitRuntime["identity"]>,
  seal: SealPreviewKind,
  t: Translate,
  resolve: Resolver,
): SealGrantPreview[] {
  return supports.flatMap((support) => {
    const grant = grants.get(support.id);
    const hasKnownClassTree = grant
      && grant.grantedClassId !== "avatar_talent"
      && fe14Data.classDirectory.some((tree) => tree.id === grant.grantedClassId);
    if (!grant || grant.seal !== seal || !hasKnownClassTree) return [];
    const partner = rosterById.get(support.partnerUnitId);
    return [{
      supportId: support.id,
      seal,
      partnerUnitId: support.partnerUnitId,
      partnerName: partnerNameOf(support, partner, t, resolve),
      grantedClassId: grant.grantedClassId,
    }];
  });
}

function formatOwnedSources(sources: Set<"base" | "heart_seal">, t: Translate): string {
  if (sources.has("base") && sources.has("heart_seal")) return t("support.owned.both");
  if (sources.has("base")) return t("support.owned.base");
  return t("support.owned.heartSeal");
}
