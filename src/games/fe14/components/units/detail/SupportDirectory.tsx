import { TriangleAlert } from "lucide-react";
import { displayId, fe14Data, type SealGrant, type UnitRuntime } from "../../../data";
import { ClassTreeLabel } from "./ClassTree";
import { avatarTalentClassIds } from "./AvatarConfiguration";
import type { AvatarSelection } from "./types";
import { corrinBorrowedClassId, formatRoute } from "./utils";

export default function SupportDirectory({ unit, avatarSelection }: { unit: UnitRuntime; avatarSelection: AvatarSelection | null }) {
  const grantsBySupport = new Map<string, SealGrant>(
    (unit.classAccess?.sealGrants ?? []).map((grant) => [grant.supportRelationshipId, grant]),
  );
  const visibleSupports = avatarSelection
    ? unit.supports.filter((support) => support.partnerGender === avatarSelection.gender)
    : unit.supports;
  const selectedTalentClasses = new Set(
    avatarSelection ? avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) : [],
  );
  if (unit.identity.id === "corrin") {
    for (const support of visibleSupports) {
      const classId = corrinBorrowedClassId(support.partnerUnitId);
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

  return (
    <div>
      {unit.identity.supportNotes?.map((note) => (
        <p className="support-availability-note" key={note}>
          <strong>Support availability:</strong> {note}
        </p>
      ))}
      <div className="support-groups">
        <div className="support-column support-column-friendship">
          <SupportGroup
            title={unit.identity.id === "corrin" ? "Friendship Seal (same-gender A)" : "Friendship Seal (A+)"}
            supports={friendship}
            grants={grantsBySupport}
          />
          <SupportGroup title="A support (no class grant)" supports={noClassGrant} grants={grantsBySupport} />
        </div>
        <div className="support-column support-column-partner">
          <SupportGroup title="Partner Seal (S)" supports={romantic} grants={grantsBySupport} />
        </div>
      </div>
      {alreadyOwnedVia.size > 0 ? (
        <p className="seal-owned-legend">
          <TriangleAlert aria-hidden="true" size={17} />
          <span>
            <strong>Caution:</strong> Marked classes are already available through this unit&apos;s{" "}
            {formatOwnedSources(alreadyOwnedVia)}. The listed seal does not add a new class tree.
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
}: {
  title: string;
  supports: UnitRuntime["supports"];
  grants: Map<string, SealGrant>;
}) {
  if (supports.length === 0) return null;
  return (
    <div className="support-group">
      <h3>{title}</h3>
      <div className="support-list">
        {supports.map((support) => {
          const partner = fe14Data.roster.find((unit) => unit.id === support.partnerUnitId);
          const grant = grants.get(support.id);
          return (
            <div className="support-row" key={support.id}>
              <span>{formatSupportPartnerName(support, partner?.displayName)}</span>
              <span>
                {support.routes.map(formatRoute).join(" / ")}
              </span>
              <div className="support-grant-result">
                <strong>
                  {grant ? <ClassTreeLabel classId={grant.grantedClassId} /> : "No class grant"}
                  {grant?.alreadyOwnedVia ? (
                    <TriangleAlert
                      aria-label={`Already available via ${grant.alreadyOwnedVia === "base" ? "Base class" : "Heart Seal"}`}
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

function formatSupportPartnerName(
  support: UnitRuntime["supports"][number],
  displayName?: string,
): string {
  if (support.partnerUnitId !== "corrin") return displayName ?? displayId(support.partnerUnitId);
  return `Corrin (${support.partnerGender === "male" ? "M" : "F"})`;
}

function formatOwnedSources(sources: Set<"base" | "heart_seal">): string {
  if (sources.has("base") && sources.has("heart_seal")) return "base class set or Heart Seal options";
  if (sources.has("base")) return "base class set";
  return "Heart Seal options";
}
