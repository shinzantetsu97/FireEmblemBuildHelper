import { useEffect, useMemo, useState, type ReactNode } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";
import {
  ROUTE_ORDER,
  resolveUnitBaseConfiguration,
  type AvailabilityStateKind,
  type ResolvedRecruitmentContext,
  type ResolvedStartingSkill,
  type ResolvedUnitBaseConfiguration,
  type RouteId,
  type UnitBaseConfigurationResolution,
} from "../../../baseConfiguration";
import { classNames, displayId, type StatBlock, type UnitRuntime } from "../../../data";
import { getClassSkillIconUrl, getPersonalSkillIconUrl } from "../../../skillAssets";
import { getWeaponTypeIconUrl } from "../../../weaponAssets";
import { STAT_KEYS, type AvatarGender, type AvatarSelection } from "./types";
import { formatSigned, shortStatLabel } from "./utils";
import { useLocale } from "../../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../../i18n/messages/en";

const ROUTE_LABEL_KEYS: Record<RouteId, MessageKey> = {
  birthright: "filter.route.birthright",
  conquest: "filter.route.conquest",
  revelation: "filter.route.revelation",
};

const STATE_KIND_KEYS: Record<AvailabilityStateKind, MessageKey> = {
  join: "config.state.join",
  appearance: "config.state.appearance",
  rejoin: "config.state.rejoin",
  conditional: "config.state.conditional",
};

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
  const { t } = useLocale();
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
      <Form.Label>{t("config.corrinGender")}</Form.Label>
      <ButtonGroup aria-label={t("config.corrinGenderAria")}>
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
            {gender === "male" ? t("config.corrinMale") : t("config.corrinFemale")}
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
  const { t, resolve, locale } = useLocale();
  const [growthMode, setGrowthMode] = useState<"effective" | "individual">("effective");
  const [auditOpen, setAuditOpen] = useState(false);
  const config = resolution.configuration;
  const growthValues = growthMode === "effective" ? config.effectiveGrowths : config.individualGrowths;
  const notePairs = config.notes.map((en, index) => ({ en, zhHans: config.notesZhHans[index] }));
  const warningNotes = notePairs.filter((note) => note.en.startsWith("Warning:"));
  const detailNotes = uniqueNotePairs([
    ...notePairs.filter((note) => !note.en.startsWith("Warning:")),
  ]);

  useEffect(() => {
    setGrowthMode("effective");
    setAuditOpen(false);
  }, [unit.identity.id]);

  return (
    <div className="resolved-config-preview">
      <div className="resolved-config-controls">
        {showRouteControl ? <RouteControl resolution={resolution} onChange={onRouteChange} /> : null}
        {extraControls}
        <span className={`resolved-state-kind is-${config.stateKind}`}>
          {t(STATE_KIND_KEYS[config.stateKind])}
        </span>
      </div>

      {warningNotes.length ? (
        <ul className="resolved-route-notes resolved-route-warnings">
          {warningNotes.map((note) => <li className="is-warning" key={note.en}>{resolve(note)}</li>)}
        </ul>
      ) : null}

      {resolution.stateOptions.length > 1 ? (
        <div className="resolved-state-tabs" aria-label={t("config.availabilityAria")} role="tablist">
          {resolution.stateOptions.map((state) => (
            <button
              aria-selected={state.availabilityId === resolution.selectedAvailabilityId}
              className={state.availabilityId === resolution.selectedAvailabilityId ? "is-selected" : undefined}
              key={state.availabilityId}
              onClick={() => onAvailabilityChange?.(state.availabilityId)}
              role="tab"
              type="button"
            >
              <span>{resolve({ en: state.label, zhHans: state.labelZhHans })}</span>
              <strong>{resolve({ en: state.joinLabel, zhHans: state.joinLabelZhHans })}</strong>
            </button>
          ))}
        </div>
      ) : null}

      <dl className="resolved-context-grid">
        <div><dt>{t("config.route")}</dt><dd>{t(ROUTE_LABEL_KEYS[resolution.routeId])}</dd></div>
        <div><dt>{t("config.recruitment")}</dt><dd>{joinText(config.join, locale)}</dd></div>
        <div><dt>{t("config.startingClass")}</dt><dd>{resolve({ en: config.classLabel, zhHans: config.classLabelZhHans })}</dd></div>
        <div><dt>{t("config.level")}</dt><dd>{config.level}{config.levelContext ? <small>{resolve({ en: config.levelContext, zhHans: config.levelContextZhHans })}</small> : null}</dd></div>
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
        classLabel={resolve({ en: config.classLabel, zhHans: config.classLabelZhHans })}
        growthMode={growthMode}
        growthValues={growthValues}
        joiningStats={config.joiningStats}
        joiningStatsKind={config.joiningStatsKind}
        onGrowthModeChange={setGrowthMode}
      />

      {detailNotes.length ? (
        <ul className="resolved-route-notes">
          {detailNotes.map((note) => <li key={note.en}>{resolve(note)}</li>)}
        </ul>
      ) : null}

      <div className="resolved-config-columns">
        <StartingSkillsPanel config={config} />
        <InventoryPanel config={config} />
      </div>

      <WeaponLevels config={config} />

      <StanceChart attackStance={config.attackStance} guardStance={config.guardStance} />

      {config.storyProgression && !config.offspringContext ? (
        <div className="resolved-story-progression">
          <h4>{t("config.storyProgression.title")}</h4>
          <div>{config.storyProgression.levelByStoryPosition.map((milestone) => (
            <span key={milestone.chapterStart}>{t("config.chapterShort", { chapter: `${milestone.chapterStart}${milestone.chapterEnd && milestone.chapterEnd !== milestone.chapterStart ? `–${milestone.chapterEnd}` : ""}` })}: Lv. {milestone.level}</span>
          ))}</div>
          <p>{t("config.storyProgression.sealAvailable", { chapter: config.storyProgression.offspringSealAvailableFromChapter })}</p>
          <dl className="resolved-seal-ranks">
            {config.storyProgression.weaponRankMilestones.map((milestone) => (
              <div key={milestone.chapterStart}>
                <dt>{t("config.chapterShort", { chapter: `${milestone.chapterStart}${milestone.chapterEnd !== milestone.chapterStart ? `–${milestone.chapterEnd}` : ""}` })}</dt>
                <dd>{t("config.storyProgression.primarySecondary", { primary: milestone.primaryRank, secondary: milestone.secondaryRank })}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <details className="resolved-object-audit" onToggle={(event) => setAuditOpen(event.currentTarget.open)}>
        <summary>{t("config.inspectObject")}</summary>
        {auditOpen ? <pre aria-label={`${unit.identity.displayName} resolved configuration JSON`}>{JSON.stringify(config, null, 2)}</pre> : null}
      </details>
    </div>
  );
}

function uniqueNotePairs(notes: Array<{ en: string; zhHans?: string }>): Array<{ en: string; zhHans?: string }> {
  return notes.filter((note, index) => notes.findIndex((candidate) => candidate.en === note.en) === index);
}

function RouteControl({ resolution, onChange }: { resolution: UnitBaseConfigurationResolution; onChange: (route: RouteId) => void }) {
  const { t } = useLocale();
  return (
    <div>
      <span className="resolved-control-label">{t("config.route")}</span>
      {resolution.availableRoutes.length === 1 ? (
        <span className="resolved-single-route" aria-label={t("config.singleRouteAria")}>{t(ROUTE_LABEL_KEYS[resolution.routeId])}</span>
      ) : (
        <ButtonGroup aria-label={t("config.resolvedRouteAria")} role="tablist">
          {resolution.availableRoutes.map((route) => (
            <Button
              aria-selected={route === resolution.routeId}
              key={route}
              onClick={() => onChange(route)}
              role="tab"
              variant={route === resolution.routeId ? "dark" : "outline-secondary"}
            >
              {t(ROUTE_LABEL_KEYS[route])}
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
  const { t, resolve, locale } = useLocale();
  const context = config.offspringContext!;
  const selectedIndex = Math.max(
    0,
    context.storyOptions.findIndex((option) => option.chapter === context.selectedChapter),
  );
  const selectedOption = context.storyOptions[selectedIndex];
  const childName = config.unitId === "kana" ? (locale === "zhHans" ? "神流" : "Kana") : t("config.offspring.child");
  return (
    <section className="resolved-offspring-progression" aria-labelledby="offspring-progression-heading">
      <div className="resolved-offspring-slider">
        <div className="resolved-offspring-control-heading">
          <div>
            <span>{t("config.offspring.recruitmentTiming")}</span>
            <h4 id="offspring-progression-heading">{resolve({ en: selectedOption.label, zhHans: selectedOption.labelZhHans })}</h4>
          </div>
          <strong>{t("config.offspring.earliest", { chapter: context.earliestChapter })}</strong>
        </div>
        <Form.Range
          aria-label={t("config.offspring.sliderAria")}
          max={context.storyOptions.length - 1}
          min={0}
          onChange={(event) => onStoryChapterChange?.(context.storyOptions[Number(event.target.value)].chapter)}
          step={1}
          value={selectedIndex}
        />
        <div className="resolved-offspring-slider-labels">
          <span>{resolve({ en: context.storyOptions[0].label, zhHans: context.storyOptions[0].labelZhHans })}</span>
          <span>{resolve({ en: context.storyOptions.at(-1)?.label ?? "", zhHans: context.storyOptions.at(-1)?.labelZhHans })}</span>
        </div>
        {selectedOption.promoted && context.promotionOptions.length ? (
          <Form.Group controlId={`${config.unitId}-offspring-seal-class`}>
            <Form.Label>{t("config.offspring.sealClass")}</Form.Label>
            <Form.Select
              onChange={(event) => onPromotionClassChange?.(event.target.value)}
              value={context.selectedPromotionClassId}
            >
              {context.promotionOptions.map((option) => (
                <option key={option.classId} value={option.classId}>{resolve({ en: option.displayName, zhHans: option.displayNameZhHans })}</option>
              ))}
            </Form.Select>
          </Form.Group>
        ) : null}
        <dl className="resolved-offspring-unlock-sources">
          {context.unlockSources.map((source) => (
            <div key={source.unitId}>
              <dt>{resolve({ en: source.name, zhHans: source.nameZhHans })}</dt>
              <dd>{source.availableChapter === 0 ? t("config.prologue") : t("config.chapterShort", { chapter: source.availableChapter })}<small>{resolve({ en: source.note, zhHans: source.noteZhHans })}</small></dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="resolved-parent-growth-context">
        <div>
          <span>{t("config.offspring.growthInheritance")}</span>
          <h4>{resolve({ en: context.variableParentName, zhHans: context.variableParentNameZhHans })} → {childName}</h4>
          {context.nestedParentName ? <small>{t("config.offspring.nestedParent", { name: resolve({ en: context.nestedParentName, zhHans: context.nestedParentNameZhHans }) })}</small> : null}
        </div>
        <div className="resolved-parent-growth-grid" role="table" aria-label={t("config.offspring.growthTableAria")}>
          <div role="row">
            <strong role="columnheader">{t("config.offspring.colStat")}</strong>
            <strong role="columnheader">{t("config.offspring.colChild")}</strong>
            <strong role="columnheader">{t("config.offspring.colParent")}</strong>
            <strong role="columnheader">{t("config.offspring.colResolved")}</strong>
          </div>
          {STAT_KEYS.map((stat) => (
            <div key={stat} role="row">
              <span role="rowheader">{shortStatLabel(stat, locale)}</span>
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
  const { t, locale } = useLocale();
  return (
    <section className="resolved-stat-matrix" aria-labelledby="resolved-stat-matrix-heading">
      <div className="resolved-stat-matrix-heading">
        <div>
          <h4 id="resolved-stat-matrix-heading">{t("config.statProfile")}</h4>
          <span>{growthMode === "effective" ? t("config.growthIncludes", { class: classLabel }) : t("config.growthPersonalOnly")}</span>
        </div>
        <ButtonGroup aria-label={t("config.growthModeAria")} role="tablist">
          {(["effective", "individual"] as const).map((mode) => (
            <Button
              aria-selected={growthMode === mode}
              key={mode}
              onClick={() => onGrowthModeChange(mode)}
              role="tab"
              size="sm"
              variant={growthMode === mode ? "dark" : "outline-secondary"}
            >
              {mode === "effective" ? t("config.growthMode.effective") : t("config.growthMode.individual")}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="resolved-stat-matrix-scroll">
        <div aria-label={t("config.statProfile")} className="resolved-stat-matrix-grid" role="table">
          <div className="resolved-stat-matrix-header" role="row">
            <span aria-hidden="true" />
            {STAT_KEYS.map((stat) => <span key={stat} role="columnheader">{shortStatLabel(stat, locale)}</span>)}
            <span role="columnheader">{t("config.total")}</span>
          </div>
          <StatMatrixRow
            ariaLabel={joiningStats ? joiningStatsLabel(joiningStatsKind, t) : t("config.stats.conditionalJoiningAria")}
            label={joiningStatsKind === "minimum_before_parent_inheritance" ? t("config.stats.minimum") : joiningStatsKind === "conditional" ? t("config.stats.conditional") : t("config.stats.joining")}
            total={joiningStats ? sumStats(joiningStats) : undefined}
            values={joiningStats}
          />
          {baseGrowths ? (
            <StatMatrixRow
              ariaLabel={t("config.stats.baseGrowthAria")}
              label={t("config.stats.baseGrowth")}
              suffix="%"
              total={sumStats(baseGrowths)}
              values={baseGrowths}
            />
          ) : null}
          <StatMatrixRow
            ariaLabel={growthMode === "effective" ? t("config.stats.effectiveGrowthAria") : t("config.stats.individualGrowthAria")}
            label={growthMode === "effective" ? t("config.stats.effectiveGrowth") : t("config.stats.individualGrowth")}
            suffix="%"
            total={sumStats(growthValues)}
            values={growthValues}
          />
          <StatMatrixRow
            ariaLabel={t("config.stats.capModifiersAria")}
            formatter={(value) => value === undefined ? "—" : formatSigned(value)}
            label={t("config.stats.capModifiers")}
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
  const { t } = useLocale();
  return (
    <section aria-labelledby="resolved-inventory-heading">
      <h4 id="resolved-inventory-heading">{t("config.inventory")}</h4>
      {config.inventory.byDifficulty ? (
        <dl className="resolved-compact-list">
          <div><dt>{t("config.difficulty.normal")}</dt><dd>{itemList(config.inventory.byDifficulty.normal, t)}</dd></div>
          <div><dt>{t("config.difficulty.hard")}</dt><dd>{itemList(config.inventory.byDifficulty.hard, t)}</dd></div>
          <div><dt>{t("config.difficulty.lunatic")}</dt><dd>{itemList(config.inventory.byDifficulty.lunatic, t)}</dd></div>
        </dl>
      ) : <p>{itemList(config.inventory.items, t)}</p>}
    </section>
  );
}

function StartingSkillsPanel({ config }: { config: ResolvedUnitBaseConfiguration }) {
  const { t } = useLocale();
  const guaranteed = config.learnedSkills.filter((skill) => skill.guaranteed);
  const conditional = config.learnedSkills.filter((skill) => !skill.guaranteed);
  return (
    <section aria-labelledby="resolved-skills-heading">
      <h4 id="resolved-skills-heading">{t("config.startingSkills")}</h4>
      <div className="resolved-skill-list">
        {guaranteed.length ? guaranteed.map((skill) => <ResolvedSkill key={skill.skillId} skill={skill} />) : <p>{t("common.none")}</p>}
        {conditional.map((skill) => <ResolvedSkill key={`${skill.skillId}-${skill.condition}`} skill={skill} />)}
      </div>
      {config.unresolvedSkillIds.length ? <p className="resolved-empty">{t("config.unresolvedScaling", { ids: config.unresolvedSkillIds.map(displayId).join(", ") })}</p> : null}
    </section>
  );
}

function ResolvedSkill({ skill }: { skill: ResolvedStartingSkill }) {
  const { t, resolve } = useLocale();
  const iconUrl = skill.kind === "personal"
    ? getPersonalSkillIconUrl(skill.iconAssetId)
    : getClassSkillIconUrl(skill.iconAssetId);
  const className = skill.sourceClassId
    ? resolve(classNames(skill.sourceClassId), skill.sourceClassName ?? t("config.skill.unknownClass"))
    : skill.sourceClassName ?? t("config.skill.unknownClass");
  const descriptor = skill.kind === "personal"
    ? t("config.skill.personal")
    : t("config.skill.classSuffix", { class: className });
  const acquisition = skill.kind === "personal"
    ? t("config.skill.innate")
    : skill.acquiredLevel === undefined ? t("config.skill.levelUnknown") : t("config.skill.level", { level: skill.acquiredLevel });
  return (
    <div className={`resolved-skill ${skill.guaranteed ? "" : "is-conditional"}`}>
      <div className="resolved-skill-provenance">
        <span>{descriptor}</span>
        <span>{acquisition}</span>
        {!skill.guaranteed ? <span>{t("config.skill.conditional")}</span> : null}
      </div>
      <div className="resolved-skill-body">
        <img alt="" height="24" src={iconUrl} width="24" />
        <div>
          <strong>{resolve({ en: skill.name, zhHans: skill.nameZhHans })}</strong>
          <p>{resolve({ en: skill.description, zhHans: skill.descriptionZhHans })}</p>
          {skill.condition ? <small>{resolve({ en: skill.condition, zhHans: skill.conditionZhHans })}</small> : null}
        </div>
      </div>
    </div>
  );
}

function WeaponLevels({ config }: { config: ResolvedUnitBaseConfiguration }) {
  const { t, resolve } = useLocale();
  return (
    <section className="resolved-weapon-levels" aria-labelledby="resolved-weapons-heading">
      <h4 id="resolved-weapons-heading">{t("config.weaponLevels")}</h4>
      <div>
        {config.weaponLevels.map((weapon) => (
          <div key={weapon.weaponTypeId}>
            <img alt="" height="24" src={getWeaponTypeIconUrl(weapon.iconAssetId)} width="24" />
            <div className="resolved-weapon-name"><strong>{resolve({ en: weapon.label, zhHans: weapon.labelZhHans })}</strong><span>{t("config.weapon.classCap", { rank: weapon.rankCap })}</span></div>
            <div className="resolved-current-rank"><span>{t("config.current")}</span><strong>{weapon.currentRank ?? t("config.weapon.unknown")}</strong></div>
            {weapon.progress ? (
              <div className="resolved-rank-progress">
                <progress aria-label={t("config.weapon.progressAria", { weapon: resolve({ en: weapon.label, zhHans: weapon.labelZhHans }), rank: weapon.progress.towardRank })} max="1" value={weapon.progress.barFraction} />
                <small>{weapon.progress.precision === "approximate" ? "≈" : ""}{t("config.weapon.towardRank", { percent: Math.round(weapon.progress.barFraction * 100), rank: weapon.progress.towardRank })}</small>
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
  const { t } = useLocale();
  const ranks = [t("config.noSupport"), "C", "B", "A", "S"];
  return (
    <section className="resolved-stance-chart" aria-labelledby="resolved-stance-heading">
      <div>
        <h4 id="resolved-stance-heading">{t("config.stanceBonuses")}</h4>
        <p>{t("config.stanceBonusesNote")}</p>
      </div>
      <div className="resolved-stance-scroll">
        <div aria-label={t("config.stanceBonuses")} className="resolved-stance-grid" role="table">
          <div className="resolved-stance-header" role="row">
            <span aria-hidden="true" />
            {ranks.map((rank) => <span key={rank} role="columnheader">{rank}</span>)}
          </div>
          <StanceChartRow label={t("config.attackStance")} stance={attackStance} />
          <StanceChartRow label={t("config.guardStance")} stance={guardStance} />
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
  const { t, locale } = useLocale();
  return (
    <div className="resolved-stance-row" aria-label={label} role="row">
      <strong role="rowheader">{label}</strong>
      <span role="cell">{bonusValues(stance.baseBonus, t, locale)}</span>
      {(["C", "B", "A", "S"] as const).map((rank) => (
        <span key={rank} role="cell">{bonusValues(stance.rankDeltas[rank] ?? {}, t, locale)}</span>
      ))}
    </div>
  );
}

function defaultRoute(unit: UnitRuntime): RouteId {
  return ROUTE_ORDER.find((route) =>
    unit.availability.some((scenario) => scenario.routeJoins.some((join) => join.route === route)),
  ) ?? "birthright";
}


const TIMING_ZH: Record<string, string> = {
  start: "开始",
  during: "进行中",
  end: "结束",
  conditional: "条件性",
};

function joinText(join: ResolvedRecruitmentContext, locale: string): string {
  if (locale === "zhHans") {
    if (join.kind === "paralogue") return `外传${join.paralogueNo}：${join.triggerZhHans ?? join.trigger}`;
    if (join.chapter === 0) return "序章";
    if (join.condition) return `第${join.chapter}章：${join.conditionZhHans ?? join.condition}`;
    return `第${join.chapter}章，${join.turn ? `第${join.turn}回合` : (TIMING_ZH[join.timing] ?? join.timing)}`;
  }
  if (join.kind === "paralogue") return `Paralogue ${join.paralogueNo}: ${join.trigger}`;
  if (join.chapter === 0) return "Prologue";
  if (join.condition) return `Chapter ${join.chapter}: ${join.condition}`;
  return `Chapter ${join.chapter}, ${join.turn ? `turn ${join.turn}` : join.timing}`;
}

function joiningStatsLabel(
  kind: ResolvedUnitBaseConfiguration["joiningStatsKind"],
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (kind === "minimum_before_parent_inheritance") return t("config.stats.minimumAria");
  if (kind === "conditional") return t("config.stats.conditionalAria");
  return t("config.stats.joiningAria");
}

function itemList(items: string[], t: ReturnType<typeof useLocale>["t"]): string {
  return items.length ? items.map(displayId).join(", ") : t("config.none");
}

function bonusValues(values: Record<string, number>, t: ReturnType<typeof useLocale>["t"], locale: string): string {
  const entries = Object.entries(values).filter(([, value]) => value !== 0);
  if (!entries.length) return t("config.none");
  return entries.map(([stat, value]) => `${bonusLabel(stat, t, locale)} ${formatSigned(value)}`).join(" · ");
}

function sumStats(values: StatBlock): number {
  return STAT_KEYS.reduce((total, stat) => total + values[stat], 0);
}

function bonusLabel(stat: string, t: ReturnType<typeof useLocale>["t"], locale: string): string {
  if (STAT_KEYS.includes(stat as keyof StatBlock)) return shortStatLabel(stat as keyof StatBlock, locale);
  if (stat === "criticalAvoid") return t("config.crit.avoid");
  if (stat === "critical") return t("config.crit.critical");
  if (stat === "avoid") return t("config.crit.avo");
  if (stat === "hit") return t("config.crit.hit");
  return displayId(stat);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
