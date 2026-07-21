import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { classNames, displayId, fe14Data, type StatBlock, type UnitRuntime } from "../../../data";
import { ClassTreeList } from "./ClassTree";
import SectionHeading from "./SectionHeading";
import {
  STAT_KEYS,
  type AvatarGender,
  type AvatarSelection,
  type AvatarTalent,
} from "./types";
import {
  corrinBorrowedClassId,
  formatAvatarMatrixCell,
  shortStatLabel,
} from "./utils";
import { useLocale } from "../../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../../i18n/messages/en";

const AVATAR_ROUTE_KEYS: Record<string, MessageKey> = {
  birthright: "filter.route.birthright",
  conquest: "filter.route.conquest",
  revelation: "filter.route.revelation",
};

export function AvatarConfigurationSection({ unit, selection }: { unit: UnitRuntime; selection: AvatarSelection }) {
  const { config } = selection;
  const { t, resolve } = useLocale();
  const routeLabel = (route: string) => (AVATAR_ROUTE_KEYS[route] ? t(AVATAR_ROUTE_KEYS[route]) : displayId(route));
  const talentLabel = (talent: AvatarTalent) => {
    const classId = avatarTalentClassId(talent, selection.gender);
    return resolve({ en: talent.label, zhHans: classId ? classNames(classId)?.zhHans : undefined });
  };

  return (
    <section className="data-section avatar-configuration" aria-labelledby="avatar-configuration-heading">
      <SectionHeading eyebrow={t("avatar.eyebrow")} title={t("config.corrinConfiguration")} id="avatar-configuration-heading" />
      <p className="avatar-config-intro">{t("avatar.intro")}</p>

      <details className="avatar-modifier-matrices">
        <summary>
          <span>{t("avatar.matricesSummary")}</span>
          <ChevronDown aria-hidden="true" size={18} />
        </summary>
        <div className="avatar-modifier-matrix-content">
          <p>{t("avatar.matricesHint")}</p>
          <AvatarBaseModifierArray config={config} />
          <AvatarModifierMatrix title={t("avatar.growthModifiers")} config={config} field="growthDeltas" percentage />
          <AvatarModifierMatrix title={t("avatar.capModifiers")} config={config} field="capDeltas" />
        </div>
      </details>

      <div className="avatar-class-grid">
        <div>
          <div className="avatar-talent-heading">
            <h3>{t("avatar.talentTrees")}</h3>
            <Form.Group className="avatar-talent-selector" controlId="corrin-talent">
              <Form.Label>{t("avatar.selectedTalent")}</Form.Label>
              <Form.Select
                value={selection.talentId}
                onChange={(event) => selection.setTalentId(event.target.value)}
                aria-label={t("avatar.corrinTalentAria")}
              >
                {config.talents.map((talent) => <option key={talent.id} value={talent.id}>{talentLabel(talent)}</option>)}
              </Form.Select>
            </Form.Group>
          </div>
          <dl className="avatar-talent-list">
            {config.talents.map((talent) => (
              <div
                className={talent.id === selection.talentId ? "is-selected" : "is-dimmed"}
                key={talent.id}
                aria-current={talent.id === selection.talentId ? "true" : undefined}
              >
                <dt>{talentLabel(talent)}</dt>
                <dd>{formatAvatarTalentTree(talent, selection.gender, resolve)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3>{t("avatar.noblePromotion")}</h3>
          <dl className="avatar-route-promotions">
            {Object.entries(config.routePromotions).map(([route, classIds]) => (
              <div key={route}>
                <dt>{routeLabel(route)}</dt>
                <dd>{classIds.map((id) => resolve({ en: displayId(id), zhHans: classNames(id)?.zhHans })).join(" / ")}</dd>
              </div>
            ))}
          </dl>
          <p className="avatar-pairup-note">{resolve({ en: config.pairupRule.note, zhHans: config.pairupRule.noteZhHans })}</p>
        </div>
      </div>

      <Alert className="avatar-class-warning" variant="warning">
        <TriangleAlert aria-hidden="true" size={22} />
        <div>
          <strong>{t("avatar.missableTitle")}</strong>
          <p>{resolve({ en: config.friendshipSealRule.note, zhHans: config.friendshipSealRule.noteZhHans })}</p>
        </div>
      </Alert>

      <FriendshipCoverageTable unit={unit} selection={selection} />
    </section>
  );
}

export function AvatarConfigurationControls({ selection, context }: { selection: AvatarSelection; context: string }) {
  const { config, boon, bane, boonId, baneId, setBoonId, setBaneId } = selection;
  const { t, resolve, locale } = useLocale();
  return (
    <div className="avatar-config-controls" aria-label={t("avatar.boonBaneAria", { context })}>
      <Form.Group controlId={`${context.toLowerCase().replaceAll(" ", "-")}-boon`}>
        <Form.Label>{t("avatar.boon")}</Form.Label>
        <Form.Select value={boonId} onChange={(event) => setBoonId(event.target.value)} aria-label={t("avatar.boonAria", { context })}>
          {config.boons.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.stat === bane.stat}>{resolve({ en: choice.label, zhHans: choice.labelZhHans })} ({shortStatLabel(choice.stat, locale)})</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group controlId={`${context.toLowerCase().replaceAll(" ", "-")}-bane`}>
        <Form.Label>{t("avatar.bane")}</Form.Label>
        <Form.Select value={baneId} onChange={(event) => setBaneId(event.target.value)} aria-label={t("avatar.baneAria", { context })}>
          {config.banes.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.stat === boon.stat}>{resolve({ en: choice.label, zhHans: choice.labelZhHans })} ({shortStatLabel(choice.stat, locale)})</option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

function AvatarBaseModifierArray({ config }: { config: NonNullable<UnitRuntime["avatarConfiguration"]> }) {
  const { t, locale } = useLocale();
  return (
    <div className="avatar-matrix-table avatar-base-modifier-array">
      <h4>{t("avatar.startingBaseModifiers")}</h4>
      <Table bordered responsive>
        <thead>
          <tr><th>{t("avatar.boonBane")}</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat, locale)}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t("avatar.adjustment")}</th>
            {STAT_KEYS.map((stat) => {
              const boon = config.boons.find((choice) => choice.stat === stat);
              const bane = config.banes.find((choice) => choice.stat === stat);
              return <td key={stat}>{formatAvatarMatrixCell(boon?.baseDeltas[stat], bane?.baseDeltas[stat], false)}</td>;
            })}
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

function AvatarModifierMatrix({
  config,
  field,
  percentage = false,
  title,
}: {
  config: NonNullable<UnitRuntime["avatarConfiguration"]>;
  field: "baseDeltas" | "growthDeltas" | "capDeltas";
  percentage?: boolean;
  title: string;
}) {
  const { t, resolve, locale } = useLocale();
  return (
    <div className="avatar-matrix-table">
      <h4>{title}</h4>
      <Table bordered responsive>
        <thead>
          <tr><th>{t("avatar.boonBane")}</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat, locale)}</th>)}</tr>
        </thead>
        <tbody>
          {config.boons.map((boon) => {
            const bane = config.banes.find((choice) => choice.stat === boon.stat);
            const boonValues = boon[field] as Partial<StatBlock>;
            const baneValues = bane?.[field] as Partial<StatBlock> | undefined;
            return (
              <tr key={boon.id}>
                <th scope="row"><strong>{resolve({ en: boon.label, zhHans: boon.labelZhHans })}</strong><span>{bane ? resolve({ en: bane.label, zhHans: bane.labelZhHans }) : null}</span></th>
                {STAT_KEYS.map((stat) => (
                  <td key={stat}>{formatAvatarMatrixCell(boonValues[stat], baneValues?.[stat], percentage)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

function FriendshipCoverageTable({ unit, selection }: { unit: UnitRuntime; selection: AvatarSelection }) {
  const config = unit.avatarConfiguration;
  const { t } = useLocale();
  const routeLabel = (route: string) => (AVATAR_ROUTE_KEYS[route] ? t(AVATAR_ROUTE_KEYS[route]) : displayId(route));
  const genderLabel = (gender: "male" | "female") => t(gender === "male" ? "common.male" : "common.female");
  if (!config) return null;
  const routes = ["birthright", "conquest", "revelation"] as const;

  return (
    <div className="friendship-coverage">
      <h3>{t("avatar.friendshipCoverage")}</h3>
      <Table responsive aria-label={t("avatar.missingClassAria")}>
        <thead><tr><th>{t("avatar.coverageCorrin")}</th><th>{t("config.route")}</th><th>{t("avatar.coverageMissing")}</th></tr></thead>
        <tbody>
          {routes.map((route) => {
            const gender = selection.gender;
            const available = new Set(
              unit.supports
                .filter((support) => support.kind !== "romantic" && support.partnerGender === gender && support.routes.includes(route))
                .map((support) => corrinBorrowedClassId(support.partnerUnitId, gender))
                .filter((classId): classId is string => Boolean(classId)),
            );
            const talentClasses = config.talents.map((talent) => talent.classId ?? talent.classIdByGender?.[gender]).filter((classId): classId is string => Boolean(classId));
            const selectedTalentClass = avatarTalentClassId(selection.talent, gender);
            const gaps = talentClasses.filter((classId) => classId !== selectedTalentClass && !available.has(classId));
            return (
              <tr key={`${route}-${gender}`}>
                <th scope="row">{genderLabel(gender)}</th>
                <td>{routeLabel(route)}</td>
                <td>{gaps.length > 0 ? <ClassTreeList classIds={gaps} /> : t("avatar.coverageNoneData")}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <p>{t("avatar.coverageNote")}</p>
    </div>
  );
}

function avatarTalentClassId(talent: AvatarTalent, gender: "male" | "female"): string | undefined {
  return talent.classId ?? talent.classIdByGender?.[gender];
}

export function avatarTalentClassIds(talent: AvatarTalent, gender: AvatarGender): string[] {
  if (talent.classId) return [talent.classId];
  const classId = talent.classIdByGender?.[gender];
  return classId ? [classId] : [];
}

function formatAvatarTalentTree(
  talent: AvatarTalent,
  gender: AvatarGender,
  resolve: ReturnType<typeof useLocale>["resolve"],
): string {
  const classId = avatarTalentClassId(talent, gender);
  if (!classId) return resolve({ en: "No class tree", zhHans: "无职业树" });
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const promotions = classTree?.promotions
    .map((promotion) => avatarPromotionLabel(promotion.id, promotion.label, gender, resolve))
    .join(" / ") ?? resolve({ en: "No standard promotions", zhHans: "无标准进阶职业" });
  const base = resolve({ en: displayId(classId), zhHans: classNames(classId)?.zhHans });
  return `${base} → ${promotions}`;
}

function avatarPromotionLabel(
  id: string,
  label: string,
  gender: AvatarGender,
  resolve: ReturnType<typeof useLocale>["resolve"],
): string {
  if (id === "attendant") return resolve({ en: gender === "female" ? "Maid" : "Butler", zhHans: gender === "female" ? "女仆" : "管家" });
  return resolve({ en: label, zhHans: classNames(id)?.zhHans });
}
