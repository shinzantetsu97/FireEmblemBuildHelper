import { useEffect, useMemo, useState, type ReactNode } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";
import {
  ROUTE_ORDER,
  resolveUnitBaseConfiguration,
  type ResolvedRecruitmentContext,
  type ResolvedStartingSkill,
  type ResolvedUnitBaseConfiguration,
  type RouteId,
  type UnitBaseConfigurationResolution,
} from "../../../baseConfiguration";
import { displayId, type StatBlock, type UnitRuntime } from "../../../data";
import { getClassSkillIconUrl, getPersonalSkillIconUrl } from "../../../skillAssets";
import { getWeaponTypeIconUrl } from "../../../weaponAssets";
import { STAT_KEYS, type AvatarGender, type AvatarSelection } from "./types";
import { formatSigned, shortStatLabel } from "./utils";

export default function ResolvedConfigurationPreview({
  unit,
  avatarSelection,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarSelection: AvatarSelection | null;
  avatarGender: AvatarGender;
  setAvatarGender: (gender: AvatarGender) => void;
}) {
  const [routeId, setRouteId] = useState<RouteId>(() => defaultRoute(unit));
  const [availabilityId, setAvailabilityId] = useState<string>();

  useEffect(() => {
    setRouteId(defaultRoute(unit));
    setAvailabilityId(undefined);
  }, [unit.identity.id]);

  const resolution = useMemo(() => resolveUnitBaseConfiguration(unit, {
    routeId,
    availabilityId,
    avatarGender,
    boon: avatarSelection?.boon,
    bane: avatarSelection?.bane,
    talentId: avatarSelection?.talentId,
  }), [unit, routeId, availabilityId, avatarGender, avatarSelection]);

  useEffect(() => {
    if (resolution.routeId !== routeId) setRouteId(resolution.routeId);
    if (resolution.selectedAvailabilityId !== availabilityId) {
      setAvailabilityId(resolution.selectedAvailabilityId);
    }
  }, [resolution, routeId, availabilityId]);

  const hasAvatarGenderCondition = unit.availability.some((scenario) => scenario.avatarGender);
  const genderControl = hasAvatarGenderCondition && !avatarSelection ? (
    <Form.Group>
      <Form.Label>Corrin gender</Form.Label>
      <ButtonGroup aria-label="Corrin gender condition">
        {(["male", "female"] as const).map((gender) => (
          <Button
            aria-pressed={avatarGender === gender}
            key={gender}
            onClick={() => {
              setAvatarGender(gender);
              setAvailabilityId(undefined);
            }}
            variant={avatarGender === gender ? "dark" : "outline-secondary"}
          >
            {gender === "male" ? "Male Corrin" : "Female Corrin"}
          </Button>
        ))}
      </ButtonGroup>
    </Form.Group>
  ) : null;

  return (
    <BaseConfigurationSurface
      extraControls={genderControl}
      onAvailabilityChange={setAvailabilityId}
      onRouteChange={(route) => {
        setRouteId(route);
        setAvailabilityId(undefined);
      }}
      resolution={resolution}
      unit={unit}
    />
  );
}

export function BaseConfigurationSurface({
  unit,
  resolution,
  onRouteChange,
  onAvailabilityChange,
  onOffspringStoryChapterChange,
  onOffspringPromotionClassChange,
  showRouteControl = true,
  extraControls,
}: {
  unit: UnitRuntime;
  resolution: UnitBaseConfigurationResolution;
  onRouteChange: (route: RouteId) => void;
  onAvailabilityChange?: (availabilityId: string) => void;
  onOffspringStoryChapterChange?: (chapter: number) => void;
  onOffspringPromotionClassChange?: (classId: string) => void;
  showRouteControl?: boolean;
  extraControls?: ReactNode;
}) {
  const [growthMode, setGrowthMode] = useState<"effective" | "individual">("effective");
  const [auditOpen, setAuditOpen] = useState(false);
  const config = resolution.configuration;
  const growthValues = growthMode === "effective" ? config.effectiveGrowths : config.individualGrowths;
  const warningNotes = config.notes.filter((note) => note.startsWith("Warning:"));
  const detailNotes = config.notes.filter((note) => !note.startsWith("Warning:"));

  useEffect(() => {
    setGrowthMode("effective");
    setAuditOpen(false);
  }, [unit.identity.id]);

  return (
    <div className="resolved-config-preview">
      <div className="resolved-config-heading">
        <div>
          <span>Route-driven profile</span>
          <h3>Base configuration</h3>
        </div>
        <span className={`resolved-state-kind is-${config.stateKind}`}>{displayId(config.stateKind)}</span>
      </div>

      {showRouteControl || extraControls ? (
        <div className="resolved-config-controls">
          {showRouteControl ? <RouteControl resolution={resolution} onChange={onRouteChange} /> : null}
          {extraControls}
        </div>
      ) : null}

      {warningNotes.length ? (
        <ul className="resolved-route-notes resolved-route-warnings">
          {warningNotes.map((note) => <li className="is-warning" key={note}>{note}</li>)}
        </ul>
      ) : null}

      {resolution.stateOptions.length > 1 ? (
        <div className="resolved-state-tabs" aria-label="Availability state" role="tablist">
          {resolution.stateOptions.map((state) => (
            <button
              aria-selected={state.availabilityId === resolution.selectedAvailabilityId}
              className={state.availabilityId === resolution.selectedAvailabilityId ? "is-selected" : undefined}
              key={state.availabilityId}
              onClick={() => onAvailabilityChange?.(state.availabilityId)}
              role="tab"
              type="button"
            >
              <span>{state.label}</span>
              <strong>{state.joinLabel}</strong>
            </button>
          ))}
        </div>
      ) : null}

      <dl className="resolved-context-grid">
        <div><dt>Route</dt><dd>{routeLabel(resolution.routeId)}</dd></div>
        <div><dt>Recruitment</dt><dd>{joinText(config.join)}</dd></div>
        <div><dt>Starting class</dt><dd>{config.classLabel}</dd></div>
        <div><dt>Level</dt><dd>{config.level}{config.levelContext ? <small>{config.levelContext}</small> : null}</dd></div>
      </dl>

      {config.offspringContext ? (
        <OffspringProgressionControls
          config={config}
          onPromotionClassChange={onOffspringPromotionClassChange}
          onStoryChapterChange={onOffspringStoryChapterChange}
        />
      ) : null}

      <StatMatrix
        baseGrowths={config.offspringContext?.childBaseGrowths}
        capModifiers={config.capModifiers}
        classLabel={config.classLabel}
        growthMode={growthMode}
        growthValues={growthValues}
        joiningStats={config.joiningStats}
        joiningStatsKind={config.joiningStatsKind}
        onGrowthModeChange={setGrowthMode}
      />

      <div className="resolved-config-columns">
        <StartingSkillsPanel config={config} />
        <InventoryPanel config={config} />
      </div>

      <WeaponLevels config={config} />

      <StanceChart attackStance={config.attackStance} guardStance={config.guardStance} />

      {config.storyProgression && !config.offspringContext ? (
        <div className="resolved-story-progression">
          <h4>Conditional story progression</h4>
          <div>{config.storyProgression.levelByStoryPosition.map((milestone) => (
            <span key={milestone.chapterStart}>Ch. {milestone.chapterStart}{milestone.chapterEnd && milestone.chapterEnd !== milestone.chapterStart ? `–${milestone.chapterEnd}` : ""}: Lv. {milestone.level}</span>
          ))}</div>
          <p>Offspring Seal becomes available from Chapter {config.storyProgression.offspringSealAvailableFromChapter}.</p>
          <dl className="resolved-seal-ranks">
            {config.storyProgression.weaponRankMilestones.map((milestone) => (
              <div key={milestone.chapterStart}>
                <dt>Ch. {milestone.chapterStart}{milestone.chapterEnd !== milestone.chapterStart ? `–${milestone.chapterEnd}` : ""}</dt>
                <dd>Primary {milestone.primaryRank} · secondary {milestone.secondaryRank}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {detailNotes.length ? (
        <ul className="resolved-route-notes">
          {detailNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      ) : null}

      <details className="resolved-object-audit" onToggle={(event) => setAuditOpen(event.currentTarget.open)}>
        <summary>Inspect resolved object</summary>
        {auditOpen ? <pre aria-label={`${unit.identity.displayName} resolved configuration JSON`}>{JSON.stringify(config, null, 2)}</pre> : null}
      </details>
    </div>
  );
}

function RouteControl({ resolution, onChange }: { resolution: UnitBaseConfigurationResolution; onChange: (route: RouteId) => void }) {
  return (
    <div>
      <span className="resolved-control-label">Route</span>
      {resolution.availableRoutes.length === 1 ? (
        <span className="resolved-single-route" aria-label="Only available route">{routeLabel(resolution.routeId)}</span>
      ) : (
        <ButtonGroup aria-label="Resolved route" role="tablist">
          {resolution.availableRoutes.map((route) => (
            <Button
              aria-selected={route === resolution.routeId}
              key={route}
              onClick={() => onChange(route)}
              role="tab"
              variant={route === resolution.routeId ? "dark" : "outline-secondary"}
            >
              {routeLabel(route)}
            </Button>
          ))}
        </ButtonGroup>
      )}
    </div>
  );
}

function OffspringProgressionControls({
  config,
  onStoryChapterChange,
  onPromotionClassChange,
}: {
  config: ResolvedUnitBaseConfiguration;
  onStoryChapterChange?: (chapter: number) => void;
  onPromotionClassChange?: (classId: string) => void;
}) {
  const context = config.offspringContext!;
  const selectedIndex = Math.max(
    0,
    context.storyOptions.findIndex((option) => option.chapter === context.selectedChapter),
  );
  const selectedOption = context.storyOptions[selectedIndex];
  return (
    <section className="resolved-offspring-progression" aria-labelledby="offspring-progression-heading">
      <div className="resolved-offspring-slider">
        <div className="resolved-offspring-control-heading">
          <div>
            <span>Recruitment timing</span>
            <h4 id="offspring-progression-heading">{selectedOption.label}</h4>
          </div>
          <strong>Earliest: Ch. {context.earliestChapter}</strong>
        </div>
        <Form.Range
          aria-label="Offspring recruitment story position"
          max={context.storyOptions.length - 1}
          min={0}
          onChange={(event) => onStoryChapterChange?.(context.storyOptions[Number(event.target.value)].chapter)}
          step={1}
          value={selectedIndex}
        />
        <div className="resolved-offspring-slider-labels">
          <span>{context.storyOptions[0].label}</span>
          <span>{context.storyOptions.at(-1)?.label}</span>
        </div>
        {selectedOption.promoted && context.promotionOptions.length ? (
          <Form.Group controlId={`${config.unitId}-offspring-seal-class`}>
            <Form.Label>Offspring Seal class</Form.Label>
            <Form.Select
              onChange={(event) => onPromotionClassChange?.(event.target.value)}
              value={context.selectedPromotionClassId}
            >
              {context.promotionOptions.map((option) => (
                <option key={option.classId} value={option.classId}>{option.displayName}</option>
              ))}
            </Form.Select>
          </Form.Group>
        ) : null}
        <dl className="resolved-offspring-unlock-sources">
          {context.unlockSources.map((source) => (
            <div key={source.unitId}>
              <dt>{source.name}</dt>
              <dd>{source.availableChapter === 0 ? "Prologue" : `Ch. ${source.availableChapter}`}<small>{source.note}</small></dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="resolved-parent-growth-context">
        <div>
          <span>Growth inheritance</span>
          <h4>{context.variableParentName} → {config.unitId === "kana" ? "Kana" : "child"}</h4>
          {context.nestedParentName ? <small>Nested parent: {context.nestedParentName}</small> : null}
        </div>
        <div className="resolved-parent-growth-grid" role="table" aria-label="Child and variable parent growth rates">
          <div role="row">
            <strong role="columnheader">Stat</strong>
            <strong role="columnheader">Child</strong>
            <strong role="columnheader">Parent</strong>
            <strong role="columnheader">Resolved</strong>
          </div>
          {STAT_KEYS.map((stat) => (
            <div key={stat} role="row">
              <span role="rowheader">{shortStatLabel(stat)}</span>
              <span role="cell">{context.childBaseGrowths[stat]}%</span>
              <span role="cell">{context.variableParentGrowths[stat]}%</span>
              <span role="cell">{config.individualGrowths[stat]}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatMatrix({
  baseGrowths,
  joiningStats,
  joiningStatsKind,
  growthValues,
  growthMode,
  classLabel,
  capModifiers,
  onGrowthModeChange,
}: {
  baseGrowths?: StatBlock;
  joiningStats: StatBlock | null;
  joiningStatsKind: ResolvedUnitBaseConfiguration["joiningStatsKind"];
  growthValues: StatBlock;
  growthMode: "effective" | "individual";
  classLabel: string;
  capModifiers: ResolvedUnitBaseConfiguration["capModifiers"];
  onGrowthModeChange: (mode: "effective" | "individual") => void;
}) {
  return (
    <section className="resolved-stat-matrix" aria-labelledby="resolved-stat-matrix-heading">
      <div className="resolved-stat-matrix-heading">
        <div>
          <h4 id="resolved-stat-matrix-heading">Stat profile</h4>
          <span>{growthMode === "effective" ? `Growth includes ${classLabel}` : "Personal growth only"}</span>
        </div>
        <ButtonGroup aria-label="Growth rate mode" role="tablist">
          {(["effective", "individual"] as const).map((mode) => (
            <Button
              aria-selected={growthMode === mode}
              key={mode}
              onClick={() => onGrowthModeChange(mode)}
              role="tab"
              size="sm"
              variant={growthMode === mode ? "dark" : "outline-secondary"}
            >
              {capitalize(mode)}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="resolved-stat-matrix-scroll">
        <div aria-label="Stat profile" className="resolved-stat-matrix-grid" role="table">
          <div className="resolved-stat-matrix-header" role="row">
            <span aria-hidden="true" />
            {STAT_KEYS.map((stat) => <span key={stat} role="columnheader">{shortStatLabel(stat)}</span>)}
            <span role="columnheader">Total</span>
          </div>
          <StatMatrixRow
            ariaLabel={joiningStats ? joiningStatsLabel(joiningStatsKind) : "Conditional joining stats"}
            label={joiningStatsKind === "minimum_before_parent_inheritance" ? "Minimum" : joiningStatsKind === "conditional" ? "Conditional" : "Joining"}
            total={joiningStats ? sumStats(joiningStats) : undefined}
            values={joiningStats}
          />
          {baseGrowths ? (
            <StatMatrixRow
              ariaLabel="Child growth rates before parent inheritance"
              label="Base growth"
              suffix="%"
              total={sumStats(baseGrowths)}
              values={baseGrowths}
            />
          ) : null}
          <StatMatrixRow
            ariaLabel={`${capitalize(growthMode)} growth rates`}
            label={`${capitalize(growthMode)} growth`}
            suffix="%"
            total={sumStats(growthValues)}
            values={growthValues}
          />
          <StatMatrixRow
            ariaLabel="Cap modifiers"
            formatter={(value) => value === undefined ? "—" : formatSigned(value)}
            label="Cap modifiers"
            values={capModifiers}
          />
        </div>
      </div>
    </section>
  );
}

function StatMatrixRow({
  ariaLabel,
  label,
  values,
  suffix = "",
  formatter,
  total,
}: {
  ariaLabel: string;
  label: string;
  values: Partial<Record<keyof StatBlock, number>> | null;
  suffix?: string;
  formatter?: (value: number | undefined) => string;
  total?: number;
}) {
  return (
    <dl className="resolved-stat-matrix-row" aria-label={ariaLabel} role="row">
      <dt role="rowheader">{label}</dt>
      {STAT_KEYS.map((stat) => {
        const value = values?.[stat];
        return (
          <dd key={stat} role="cell">
            {formatter ? formatter(value) : value === undefined ? "—" : `${value}${suffix}`}
          </dd>
        );
      })}
      <dd className="resolved-stat-total" role="cell">
        {total === undefined ? "—" : `${total}${suffix}`}
      </dd>
      </dl>
  );
}

function InventoryPanel({ config }: { config: ResolvedUnitBaseConfiguration }) {
  return (
    <section aria-labelledby="resolved-inventory-heading">
      <h4 id="resolved-inventory-heading">Inventory</h4>
      {config.inventory.byDifficulty ? (
        <dl className="resolved-compact-list">
          <div><dt>Normal</dt><dd>{itemList(config.inventory.byDifficulty.normal)}</dd></div>
          <div><dt>Hard</dt><dd>{itemList(config.inventory.byDifficulty.hard)}</dd></div>
          <div><dt>Lunatic</dt><dd>{itemList(config.inventory.byDifficulty.lunatic)}</dd></div>
        </dl>
      ) : <p>{itemList(config.inventory.items)}</p>}
    </section>
  );
}

function StartingSkillsPanel({ config }: { config: ResolvedUnitBaseConfiguration }) {
  const guaranteed = config.learnedSkills.filter((skill) => skill.guaranteed);
  const conditional = config.learnedSkills.filter((skill) => !skill.guaranteed);
  return (
    <section aria-labelledby="resolved-skills-heading">
      <h4 id="resolved-skills-heading">Starting skills</h4>
      <div className="resolved-skill-list">
        {guaranteed.length ? guaranteed.map((skill) => <ResolvedSkill key={skill.skillId} skill={skill} />) : <p>None</p>}
        {conditional.map((skill) => <ResolvedSkill key={`${skill.skillId}-${skill.condition}`} skill={skill} />)}
      </div>
      {config.unresolvedSkillIds.length ? <p className="resolved-empty">Unresolved scaling: {config.unresolvedSkillIds.map(displayId).join(", ")}</p> : null}
    </section>
  );
}

function ResolvedSkill({ skill }: { skill: ResolvedStartingSkill }) {
  const iconUrl = skill.kind === "personal"
    ? getPersonalSkillIconUrl(skill.iconAssetId)
    : getClassSkillIconUrl(skill.iconAssetId);
  const descriptor = skill.kind === "personal"
    ? "Personal skill"
    : `${skill.sourceClassName ?? "Unknown"} class`;
  const acquisition = skill.kind === "personal"
    ? "Innate"
    : skill.acquiredLevel === undefined ? "Level unknown" : `Level ${skill.acquiredLevel}`;
  return (
    <div className={`resolved-skill ${skill.guaranteed ? "" : "is-conditional"}`}>
      <div className="resolved-skill-provenance">
        <span>{descriptor}</span>
        <span>{acquisition}</span>
        {!skill.guaranteed ? <span>Conditional</span> : null}
      </div>
      <div className="resolved-skill-body">
        <img alt="" height="24" src={iconUrl} width="24" />
        <div>
          <strong>{skill.name}</strong>
          <p>{skill.description}</p>
          {skill.condition ? <small>{skill.condition}</small> : null}
        </div>
      </div>
    </div>
  );
}

function WeaponLevels({ config }: { config: ResolvedUnitBaseConfiguration }) {
  return (
    <section className="resolved-weapon-levels" aria-labelledby="resolved-weapons-heading">
      <h4 id="resolved-weapons-heading">Weapon levels</h4>
      <div>
        {config.weaponLevels.map((weapon) => (
          <div key={weapon.weaponTypeId}>
            <img alt="" height="24" src={getWeaponTypeIconUrl(weapon.iconAssetId)} width="24" />
            <div className="resolved-weapon-name"><strong>{weapon.label}</strong><span>Class cap {weapon.rankCap}</span></div>
            <div className="resolved-current-rank"><span>Current</span><strong>{weapon.currentRank ?? "Unknown"}</strong></div>
            {weapon.progress ? (
              <div className="resolved-rank-progress">
                <progress aria-label={`${weapon.label} progress toward ${weapon.progress.towardRank}`} max="1" value={weapon.progress.barFraction} />
                <small>{weapon.progress.precision === "approximate" ? "≈" : ""}{Math.round(weapon.progress.barFraction * 100)}% toward {weapon.progress.towardRank}</small>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function StanceChart({
  attackStance,
  guardStance,
}: {
  attackStance: ResolvedUnitBaseConfiguration["attackStance"];
  guardStance: ResolvedUnitBaseConfiguration["guardStance"];
}) {
  const ranks = ["No support", "C", "B", "A", "S"] as const;
  return (
    <section className="resolved-stance-chart" aria-labelledby="resolved-stance-heading">
      <div>
        <h4 id="resolved-stance-heading">Support stance bonuses</h4>
        <p>Bonus introduced at each support rank.</p>
      </div>
      <div className="resolved-stance-scroll">
        <div aria-label="Support stance bonuses" className="resolved-stance-grid" role="table">
          <div className="resolved-stance-header" role="row">
            <span aria-hidden="true" />
            {ranks.map((rank) => <span key={rank} role="columnheader">{rank}</span>)}
          </div>
          <StanceChartRow label="Attack Stance" stance={attackStance} />
          <StanceChartRow label="Guard Stance" stance={guardStance} />
        </div>
      </div>
    </section>
  );
}

function StanceChartRow({
  label,
  stance,
}: {
  label: string;
  stance: ResolvedUnitBaseConfiguration["attackStance"];
}) {
  return (
    <div className="resolved-stance-row" aria-label={label} role="row">
      <strong role="rowheader">{label}</strong>
      <span role="cell">{bonusValues(stance.baseBonus)}</span>
      {(["C", "B", "A", "S"] as const).map((rank) => (
        <span key={rank} role="cell">{bonusValues(stance.rankDeltas[rank] ?? {})}</span>
      ))}
    </div>
  );
}

function defaultRoute(unit: UnitRuntime): RouteId {
  return ROUTE_ORDER.find((route) =>
    unit.availability.some((scenario) => scenario.routeJoins.some((join) => join.route === route)),
  ) ?? "birthright";
}

function routeLabel(route: RouteId): string {
  return { birthright: "Birthright", conquest: "Conquest", revelation: "Revelation" }[route];
}

function joinText(join: ResolvedRecruitmentContext): string {
  if (join.kind === "paralogue") return `Paralogue ${join.paralogueNo}: ${join.trigger}`;
  if (join.chapter === 0) return "Prologue";
  return `Chapter ${join.chapter}, ${join.turn ? `turn ${join.turn}` : join.timing}`;
}

function joiningStatsLabel(kind: ResolvedUnitBaseConfiguration["joiningStatsKind"]): string {
  if (kind === "minimum_before_parent_inheritance") return "Minimum recruitment stats before parent inheritance";
  if (kind === "conditional") return "Conditional recruitment baseline";
  return "Joining stats";
}

function itemList(items: string[]): string {
  return items.length ? items.map(displayId).join(", ") : "None";
}

function bonusValues(values: Record<string, number>): string {
  const entries = Object.entries(values).filter(([, value]) => value !== 0);
  if (!entries.length) return "None";
  return entries.map(([stat, value]) => `${bonusLabel(stat)} ${formatSigned(value)}`).join(" · ");
}

function sumStats(values: StatBlock): number {
  return STAT_KEYS.reduce((total, stat) => total + values[stat], 0);
}

function bonusLabel(stat: string): string {
  if (STAT_KEYS.includes(stat as keyof StatBlock)) return shortStatLabel(stat as keyof StatBlock);
  if (stat === "criticalAvoid") return "Crit Avo";
  if (stat === "critical") return "Crit";
  if (stat === "avoid") return "Avo";
  return displayId(stat);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
