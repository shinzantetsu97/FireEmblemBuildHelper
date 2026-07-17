import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { TriangleAlert } from "lucide-react";
import { displayId, fe14Data, type StatBlock, type UnitRuntime } from "../../../data";
import { ClassTreeList } from "./ClassTree";
import GrowthBar from "./GrowthBar";
import PairupTable from "./PairupTable";
import SectionHeading from "./SectionHeading";
import {
  STAT_KEYS,
  type AvatarGender,
  type AvatarSelection,
  type AvatarTalent,
  type PairupTableBonuses,
} from "./types";
import {
  applyAvatarDeltas,
  corrinBorrowedClassId,
  formatAvatarMatrixCell,
  formatSigned,
  shortStatLabel,
} from "./utils";

export function AvatarConfigurationSection({ unit, selection }: { unit: UnitRuntime; selection: AvatarSelection }) {
  const { config, boon, bane } = selection;
  const neutralGrowths = unit.growths[0]?.rates;
  const neutralCaps = unit.capModifiers?.modifiers;
  if (!neutralGrowths || !neutralCaps) return null;
  const growths = applyAvatarDeltas(neutralGrowths, boon.growthDeltas, bane.growthDeltas);
  const caps = applyAvatarDeltas(
    { hp: 0, ...neutralCaps },
    boon.capDeltas,
    bane.capDeltas,
  );

  return (
    <section className="data-section avatar-configuration" aria-labelledby="avatar-configuration-heading">
      <SectionHeading eyebrow="Avatar rules" title="Corrin configuration" id="avatar-configuration-heading" />
      <p className="avatar-config-intro">
        Boon and bane deltas are added to Corrin's neutral starting stats, personal growths, and zero neutral cap modifiers.
      </p>

      <div className="avatar-current-stats">
        <div className="avatar-current-stats-heading">
          <h3>Personal growth and cap modifiers</h3>
          <AvatarConfigurationControls selection={selection} context="Growth and caps" />
        </div>
        <Table className="stat-table" responsive>
          <thead><tr><th>Stat</th><th>Personal growth</th><th>Cap modifier</th></tr></thead>
          <tbody>
            {STAT_KEYS.map((stat) => (
              <tr key={stat}>
                <th scope="row">{stat === "hp" ? "HP" : displayId(stat)}</th>
                <td><GrowthBar value={growths[stat]} /></td>
                <td>{stat === "hp" ? "—" : formatSigned(caps[stat])}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><th scope="row">Total</th><td>{Object.values(growths).reduce((sum, value) => sum + value, 0)}%</td><td>—</td></tr></tfoot>
        </Table>
      </div>

      <div className="avatar-modifier-matrices">
        <h3>Boon and bane modifier matrices</h3>
        <p>Each populated cell shows the boon delta first and the corresponding bane delta second.</p>
        <AvatarBaseModifierArray config={config} />
        <AvatarModifierMatrix title="Personal growth modifiers" config={config} field="growthDeltas" percentage />
        <AvatarModifierMatrix title="Cap modifiers" config={config} field="capDeltas" />
      </div>

      <div className="avatar-class-grid">
        <div>
          <div className="avatar-talent-heading">
            <h3>Talent class trees</h3>
            <Form.Group className="avatar-talent-selector" controlId="corrin-talent">
              <Form.Label>Selected Talent</Form.Label>
              <Form.Select
                value={selection.talentId}
                onChange={(event) => selection.setTalentId(event.target.value)}
                aria-label="Corrin Talent"
              >
                {config.talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.label}</option>)}
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
                <dt>{talent.label}</dt>
                <dd>{formatAvatarTalentTree(talent, selection.gender)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3>Noble promotion access</h3>
          <dl className="avatar-route-promotions">
            {Object.entries(config.routePromotions).map(([route, classIds]) => (
              <div key={route}>
                <dt>{displayId(route)}</dt>
                <dd>{classIds.map(displayId).join(" / ")}</dd>
              </div>
            ))}
          </dl>
          <p className="avatar-pairup-note">{config.pairupRule.note}</p>
        </div>
      </div>

      <Alert className="avatar-class-warning" variant="warning">
        <TriangleAlert aria-hidden="true" size={22} />
        <div>
          <strong>Missable-class bottleneck</strong>
          <p>{config.friendshipSealRule.note}</p>
        </div>
      </Alert>

      <FriendshipCoverageTable unit={unit} selection={selection} />
    </section>
  );
}

export function AvatarPairupSection({ selection }: { selection: AvatarSelection }) {
  const { pairupRule } = selection.config;
  const attackVariant = pairupRule.attackStance.variants.find(
    (variant) => variant.boonIds.includes(selection.boonId) && variant.baneIds.includes(selection.baneId),
  );
  const guardVariant = pairupRule.guardStance.variants.find(
    (variant) => variant.boonId === selection.boonId && variant.baneId === selection.baneId,
  );
  if (!attackVariant || !guardVariant) return null;

  const bonuses: PairupTableBonuses = {
    attackStance: { baseBonus: pairupRule.attackStance.baseBonus, rankDeltas: attackVariant.rankDeltas },
    guardStance: { baseBonus: pairupRule.guardStance.baseBonus, rankDeltas: guardVariant.rankDeltas },
  };

  return (
    <section className="data-section avatar-pairup-section" aria-labelledby="pairup-heading">
      <SectionHeading eyebrow="Support bonuses" title="Attack and Guard Stance" id="pairup-heading" />
      <div className="avatar-pairup-controls">
        <p>{selection.boon.label} boon with {selection.bane.label} bane</p>
        <AvatarConfigurationControls selection={selection} context="Stance bonuses" />
      </div>
      <PairupTable bonuses={bonuses} />
      <div className="avatar-pairup-notes">
        <p><strong>Attack Stance:</strong> {pairupRule.attackStance.semantics}</p>
        <p><strong>Guard Stance:</strong> {pairupRule.guardStance.semantics}</p>
      </div>
    </section>
  );
}

export function AvatarConfigurationControls({ selection, context }: { selection: AvatarSelection; context: string }) {
  const { config, boon, bane, boonId, baneId, setBoonId, setBaneId } = selection;
  return (
    <div className="avatar-config-controls" aria-label={`${context} boon and bane`}>
      <Form.Group controlId={`${context.toLowerCase().replaceAll(" ", "-")}-boon`}>
        <Form.Label>Boon</Form.Label>
        <Form.Select value={boonId} onChange={(event) => setBoonId(event.target.value)} aria-label={`${context} boon`}>
          {config.boons.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.stat === bane.stat}>{choice.label} ({choice.stat === "hp" ? "HP" : displayId(choice.stat)})</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group controlId={`${context.toLowerCase().replaceAll(" ", "-")}-bane`}>
        <Form.Label>Bane</Form.Label>
        <Form.Select value={baneId} onChange={(event) => setBaneId(event.target.value)} aria-label={`${context} bane`}>
          {config.banes.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.stat === boon.stat}>{choice.label} ({choice.stat === "hp" ? "HP" : displayId(choice.stat)})</option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

function AvatarBaseModifierArray({ config }: { config: NonNullable<UnitRuntime["avatarConfiguration"]> }) {
  return (
    <div className="avatar-matrix-table avatar-base-modifier-array">
      <h4>Starting base modifiers</h4>
      <Table bordered responsive>
        <thead>
          <tr><th>Boon / Bane</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat)}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Adjustment</th>
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
  return (
    <div className="avatar-matrix-table">
      <h4>{title}</h4>
      <Table bordered responsive>
        <thead>
          <tr><th>Boon / Bane</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat)}</th>)}</tr>
        </thead>
        <tbody>
          {config.boons.map((boon) => {
            const bane = config.banes.find((choice) => choice.stat === boon.stat);
            const boonValues = boon[field] as Partial<StatBlock>;
            const baneValues = bane?.[field] as Partial<StatBlock> | undefined;
            return (
              <tr key={boon.id}>
                <th scope="row"><strong>{boon.label}</strong><span>{bane?.label}</span></th>
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
  if (!config) return null;
  const routes = ["birthright", "conquest", "revelation"] as const;

  return (
    <div className="friendship-coverage">
      <h3>First-generation Friendship class coverage</h3>
      <Table responsive aria-label="Corrin missing class access">
        <thead><tr><th>Corrin</th><th>Route</th><th>Class trees still missing after Friendship and Talent access</th></tr></thead>
        <tbody>
          {routes.map((route) => {
            const gender = selection.gender;
            const available = new Set(
              unit.supports
                .filter((support) => support.kind !== "romantic" && support.partnerGender === gender && support.routes.includes(route))
                .map((support) => corrinBorrowedClassId(support.partnerUnitId))
                .filter((classId): classId is string => Boolean(classId)),
            );
            const talentClasses = config.talents.map((talent) => talent.classId ?? talent.classIdByGender?.[gender]).filter((classId): classId is string => Boolean(classId));
            const selectedTalentClass = avatarTalentClassId(selection.talent, gender);
            const gaps = talentClasses.filter((classId) => classId !== selectedTalentClass && !available.has(classId));
            return (
              <tr key={`${route}-${gender}`}>
                <th scope="row">{displayId(gender)}</th>
                <td>{displayId(route)}</td>
                <td>{gaps.length > 0 ? <ClassTreeList classIds={gaps} /> : "None in the current first-generation data"}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <p>Coverage includes Corrin's selected Talent and eligible first-generation Friendship Seals; it excludes Partner Seals, child units, DLC, and unrecruited units.</p>
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

function formatAvatarTalentTree(talent: AvatarTalent, gender: AvatarGender): string {
  const classId = avatarTalentClassId(talent, gender);
  if (!classId) return "No class tree";
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const promotions = classTree?.promotions
    .map((promotion) => avatarPromotionLabel(promotion.id, promotion.label, gender))
    .join(" / ") ?? "No standard promotions";
  return `${displayId(classId)} → ${promotions}`;
}

function avatarPromotionLabel(id: string, label: string, gender: AvatarGender): string {
  if (id === "attendant") return gender === "female" ? "Maid" : "Butler";
  return label;
}
