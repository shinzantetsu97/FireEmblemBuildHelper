import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { classNames, displayId, fe14Data, type AvatarChoice, type SealGrant, type StatBlock, type UnitRuntime } from "../../../data";
import { ROUTE_ORDER, resolveUnitBaseConfiguration, type RouteId } from "../../../baseConfiguration";
import { calculateOffspringRecruitmentStat, resolveOffspringScenario, roundHalfUp } from "../../../offspring";
import UnitClassSkills from "../../skills/UnitClassSkills";
import { ClassTreeLabel } from "./ClassTree";
import { BaseConfigurationSurface } from "./ResolvedConfigurationPreview";
import SectionHeading from "./SectionHeading";
import SupportDirectory, { type SealGrantPreview, type SealGrantPreviews, type SealPreviewKind } from "./SupportDirectory";
import { STAT_KEYS, type AvatarGender } from "./types";
import UnitReferences from "./UnitReferences";
import { shortStatLabel } from "./utils";
import { useLocale } from "../../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../../i18n/messages/en";

export default function OffspringOverview({
  unit,
  childGender,
  setChildGender,
}: {
  unit: UnitRuntime;
  childGender: AvatarGender;
  setChildGender: (gender: AvatarGender) => void;
}) {
  const { t, resolve, locale } = useLocale();
  const parentage = unit.offspring?.parentage;
  const recruitment = unit.offspring?.recruitment;
  const isAvatarChild = parentage?.scenarioKind === "avatar_child";
  const parentOptions = useMemo(() => parentage?.variableParentOptions.filter((option) => (
    !isAvatarChild || option.childGender === childGender
  )) ?? [], [parentage, isAvatarChild, childGender]);
  const offspringRoutes = useMemo(() => ROUTE_ORDER.filter((route) => (
    parentOptions.some((option) => option.routes.includes(route))
  )), [parentOptions]);
  const [parentId, setParentId] = useState(parentOptions.find((option) => option.unitId === "corrin")?.unitId ?? parentOptions[0]?.unitId ?? "");
  const [routeId, setRouteId] = useState<RouteId>(() => firstParentRoute(parentOptions.find((option) => option.unitId === "corrin") ?? parentOptions[0]));
  const corrin = fe14Data.units.find((candidate) => candidate.identity.id === "corrin");
  const config = corrin?.avatarConfiguration;
  const [boonId, setBoonId] = useState("robust");
  const [baneId, setBaneId] = useState("weak");
  const [talentId, setTalentId] = useState(config?.talents[0]?.id ?? "cavalier");
  const [nestedParentId, setNestedParentId] = useState("");
  const [storyChapter, setStoryChapter] = useState(8);
  const [promotionClassId, setPromotionClassId] = useState("");
  const [selectedSealPreviews, setSelectedSealPreviews] = useState<SealGrantPreviews>({});
  const boon = config?.boons.find((choice) => choice.id === boonId) ?? config?.boons[0];
  const bane = config?.banes.find((choice) => choice.id === baneId) ?? config?.banes[1];

  useEffect(() => {
    if (!parentOptions.some((option) => option.unitId === parentId)) {
      setParentId(parentOptions.find((option) => option.unitId === "corrin")?.unitId ?? parentOptions[0]?.unitId ?? "");
    }
  }, [parentOptions, parentId]);
  useEffect(() => setNestedParentId(""), [parentId]);

  const baseResolution = useMemo(() => resolveUnitBaseConfiguration(unit, {
    routeId,
    avatarGender: childGender,
    boon,
    bane,
    talentId,
    variableParentUnitId: parentId,
    nestedVariableParentUnitId: nestedParentId,
    offspringStoryChapter: storyChapter,
    offspringPromotionClassId: promotionClassId,
  }), [unit, routeId, childGender, boon, bane, talentId, parentId, nestedParentId, storyChapter, promotionClassId]);
  const resolvedParentId = baseResolution.selectedParentUnitId ?? parentId;
  const resolvedNestedParentId = baseResolution.configuration.scenarioConditions.nestedVariableParentUnitId;
  const resolvedStoryChapter = baseResolution.configuration.offspringContext?.selectedChapter;
  const resolvedPromotionClassId = baseResolution.configuration.offspringContext?.selectedPromotionClassId;
  useEffect(() => {
    if (baseResolution.routeId !== routeId) setRouteId(baseResolution.routeId);
    if (resolvedParentId !== parentId) setParentId(resolvedParentId);
    if (resolvedNestedParentId && resolvedNestedParentId !== nestedParentId) setNestedParentId(resolvedNestedParentId);
    if (resolvedStoryChapter !== undefined && resolvedStoryChapter !== storyChapter) setStoryChapter(resolvedStoryChapter);
    if (resolvedPromotionClassId && resolvedPromotionClassId !== promotionClassId) setPromotionClassId(resolvedPromotionClassId);
  }, [baseResolution.routeId, resolvedParentId, resolvedNestedParentId, resolvedStoryChapter, resolvedPromotionClassId, routeId, parentId, nestedParentId, storyChapter, promotionClassId]);
  const scenario = useMemo(
    () => resolveOffspringScenario(unit, resolvedParentId, boon, bane, { corrinTalentId: talentId, nestedVariableParentId: resolvedNestedParentId }),
    [unit, resolvedParentId, boon, bane, talentId, resolvedNestedParentId],
  );
  const handleSealPreviewChange = useCallback((seal: SealPreviewKind, preview: SealGrantPreview | null) => {
    setSelectedSealPreviews((current) => {
      const next = { ...current };
      if (preview) next[seal] = preview;
      else delete next[seal];
      return next;
    });
  }, []);

  if (!parentage || !recruitment || !scenario) return null;
  const selectedOption = parentage.variableParentOptions.find((option) => option.unitId === resolvedParentId)!;
  const unitName = resolve({ en: unit.identity.displayName, zhHans: unit.identity.names?.zhHans });
  const corrinGender = scenario.childGender === "male" ? "female" : "male";
  const fixedParentName = isAvatarChild ? corrinGenderName(corrinGender, resolve) : parentDisplayName(scenario.fixedParent, resolve);
  const variableParentLabel = t(`offspring.role.${parentage.variableParentRole}` as MessageKey);
  const variableParentLabelLower = t(`offspring.roleLower.${parentage.variableParentRole}` as MessageKey);
  const siblingRoster = scenario.siblingUnitId
    ? fe14Data.roster.find((candidate) => candidate.id === scenario.siblingUnitId)
    : undefined;
  const siblingName = scenario.siblingUnitId
    ? (siblingRoster ? resolve({ en: siblingRoster.displayName, zhHans: siblingRoster.names?.zhHans }) : displayId(scenario.siblingUnitId))
    : undefined;

  return (
    <div className="unit-overview offspring-overview">
      {isAvatarChild ? (
        <Alert className="kana-data-warning" variant="danger">
          <div className="kana-data-warning-heading">
            <TriangleAlert aria-hidden="true" size={22} />
            <Alert.Heading as="h2">{t("offspring.kana.heading")}</Alert.Heading>
          </div>
          <p>{t("offspring.kana.intro")}</p>
          <ul>
            <li>{t("offspring.kana.li1")}</li>
            <li>{t("offspring.kana.li2")}</li>
            <li>{t("offspring.kana.li3")}</li>
            <li>{t("offspring.kana.li4")}</li>
            <li>{t("offspring.kana.li5")}</li>
          </ul>
          <p>{t("offspring.kana.body")}</p>
          <p className="kana-data-warning-signoff"><strong>{t("offspring.kana.signoffLabel")}</strong>{t("offspring.kana.signoff")}</p>
        </Alert>
      ) : null}
      <Alert className="review-alert" variant="warning">
        <TriangleAlert aria-hidden="true" size={19} />
        <span>{t("offspring.reviewAlert", { name: unitName, fixedParent: fixedParentName, role: variableParentLabelLower })}</span>
      </Alert>

      <section className="offspring-route-section" aria-labelledby="offspring-route-heading">
        <div>
          <span>{t("offspring.route.eyebrow")}</span>
          <h2 id="offspring-route-heading">{t("offspring.route.title")}</h2>
          <p>{t("offspring.route.desc")}</p>
        </div>
        <ButtonGroup aria-label={t("offspring.route.aria")} role="tablist">
          {offspringRoutes.map((route) => (
            <Button
              aria-selected={route === baseResolution.routeId}
              key={route}
              onClick={() => {
                setRouteId(route);
                setStoryChapter(8);
              }}
              role="tab"
              variant={route === baseResolution.routeId ? "dark" : "outline-secondary"}
            >
              {t(`filter.route.${route}` as MessageKey)}
            </Button>
          ))}
        </ButtonGroup>
      </section>

      <section className="data-section offspring-parent-section" aria-labelledby="parent-heading">
        <SectionHeading eyebrow={t("offspring.parent.eyebrow")} title={t("offspring.parent.title", { name: unitName, role: variableParentLabelLower })} id="parent-heading" />
        <div className="offspring-parent-controls">
          {isAvatarChild ? (
            <Form.Group controlId={`${unit.identity.id}-gender`}>
              <Form.Label>{t("offspring.kanaGender")}</Form.Label>
              <Form.Select value={childGender} onChange={(event) => {
                setChildGender(event.target.value as AvatarGender);
                setStoryChapter(8);
              }}>
                <option value="female">{t("offspring.kanaFemale")}</option>
                <option value="male">{t("offspring.kanaMale")}</option>
              </Form.Select>
            </Form.Group>
          ) : null}
          <Form.Group controlId={`${unit.identity.id}-${variableParentLabelLower}`}>
            <Form.Label>{variableParentLabel}</Form.Label>
            <Form.Select value={parentId} onChange={(event) => {
              setParentId(event.target.value);
              setStoryChapter(8);
            }}>
              {baseResolution.parentOptions?.map((option) => {
                const parent = fe14Data.roster.find((candidate) => candidate.id === option.unitId);
                return <option key={option.unitId} value={option.unitId}>{resolve({ en: parent?.displayName ?? displayId(option.unitId), zhHans: parent?.names?.zhHans })} ({formatRoutes(option.routes, locale)})</option>;
              })}
            </Form.Select>
          </Form.Group>
          {(resolvedParentId === "corrin" || isAvatarChild) && config && boon && bane ? (
            <CorrinParentControls config={config} boon={boon} bane={bane} boonId={boonId} baneId={baneId} talentId={talentId} showTalent={isAvatarChild} gender={childGender} setBoonId={setBoonId} setBaneId={setBaneId} setTalentId={setTalentId} />
          ) : null}
          {scenario.nestedVariableParentOptions.length ? (
            <Form.Group className="offspring-nested-parent" controlId={`${unit.identity.id}-nested-parent`}>
              <Form.Label>{t("offspring.nestedLabel", { parent: parentDisplayName(scenario.variableParent, resolve), role: t(`offspring.roleLower.${scenario.variableParent.offspring?.parentage.variableParentRole ?? "parent"}` as MessageKey) })}</Form.Label>
              <Form.Select value={scenario.nestedVariableParentId ?? ""} onChange={(event) => {
                setNestedParentId(event.target.value);
                setStoryChapter(8);
              }}>
                {scenario.nestedVariableParentOptions.filter((option) => option.routes.includes(routeId)).map((option) => {
                  const parent = fe14Data.roster.find((candidate) => candidate.id === option.unitId);
                  return <option key={option.unitId} value={option.unitId}>{resolve({ en: parent?.displayName ?? displayId(option.unitId), zhHans: parent?.names?.zhHans })} ({formatRoutes(option.routes.filter((route) => selectedOption.routes.includes(route)), locale)})</option>;
                })}
              </Form.Select>
              <Form.Text>{t("offspring.nestedHelp")}</Form.Text>
            </Form.Group>
          ) : null}
          <div className="offspring-parent-summary">
            <span>{t("offspring.summary.fixedParent")}</span><strong>{fixedParentName}</strong>
            <span>{t("offspring.summary.inheritedTree")}</span><strong><ResolvedClassLabel classId={scenario.inheritedClassId} /></strong>
            {isAvatarChild ? <><span>{t("offspring.summary.corrinTalent")}</span><strong><ResolvedClassLabel classId={scenario.fixedInheritedClassId} /></strong><span>{t("offspring.summary.capBonus")}</span><strong>{selectedOption.parentGeneration === "second" ? t("offspring.summary.capBonusSecond") : t("offspring.summary.capBonusFirst")}</strong></> : null}
            <span>{t("offspring.summary.dragonVein")}</span><strong>{unit.identity.dragonVein || scenario.father.identity.dragonVein || scenario.mother.identity.dragonVein ? t("common.yes") : t("common.no")}</strong>
            <span>{t("offspring.summary.unitTraits")}</span><strong>{scenario.unitTags.length ? scenario.unitTags.map((tag) => t(`unit.tag.${tag}` as MessageKey)).join(", ") : t("common.none")}</strong>
            {siblingName ? <><span>{t("offspring.summary.sibling")}</span><strong>{siblingName}</strong></> : null}
          </div>
        </div>
        {isAvatarChild ? (
          <>
            <p className="offspring-rule-note"><strong>{t("offspring.note.inheritanceOrderLabel")}</strong>{t("offspring.note.inheritanceOrder")}</p>
            <p className="offspring-rule-note offspring-special-note"><strong>{t("offspring.note.noParallelLabel")}</strong>{t("offspring.note.noParallel")}</p>
          </>
        ) : resolvedParentId === "corrin" ? (
          <p className="offspring-rule-note"><strong>{t("offspring.note.corrinLabel")}</strong>{t("offspring.note.corrin", { name: unitName })}</p>
        ) : selectedOption.inheritedClassReason !== "direct" ? (
          <p className="offspring-rule-note">{t("offspring.note.fallbackTree", { role: variableParentLabelLower, name: unitName, reason: t(`offspring.reason.${selectedOption.inheritedClassReason}` as MessageKey) })}</p>
        ) : null}
        {parentage.notes?.map((note, index) => <p className="offspring-rule-note offspring-special-note" key={note}>{resolve({ en: note, zhHans: parentage.notesZhHans?.[index] })}</p>)}
      </section>

      <section className="data-section" aria-labelledby="offspring-base-heading">
        <SectionHeading title={t("section.base.title")} id="offspring-base-heading" />
        <BaseConfigurationSurface
          onOffspringPromotionClassChange={setPromotionClassId}
          onOffspringStoryChapterChange={setStoryChapter}
          onRouteChange={(route) => {
            setRouteId(route);
            setStoryChapter(8);
          }}
          resolution={baseResolution}
          showRouteControl={false}
          unit={unit}
        />
        <p className="offspring-rule-note">
          <strong>{t("offspring.stanceLabel")}</strong>{t("offspring.stanceInheritance", { mother: parentDisplayName(scenario.mother, resolve), father: parentDisplayName(scenario.father, resolve) })}
        </p>
      </section>

      <details className="offspring-calculator-details">
        <summary>{t("offspring.calc.summary")}</summary>
        <RecruitmentStatWalkthrough
          chapterStart={resolvedStoryChapter ?? 8}
          promotionClassId={resolvedPromotionClassId}
          unit={unit}
          scenario={scenario}
        />
      </details>

      <UnitClassSkills
        gender={scenario.childGender}
        sources={[
          { label: t("offspring.skills.ownClass"), classIds: [parentage.childBaseClassId] },
          { label: t("offspring.skills.fromParent", { name: fixedParentName }), classIds: [scenario.fixedInheritedClassId] },
          { label: t("offspring.skills.fromParent", { name: parentDisplayName(scenario.variableParent, resolve) }), classIds: [scenario.inheritedClassId] },
        ]}
        selectedSealPreviews={selectedSealPreviews}
      />

      <OffspringSupports
        unit={unit}
        scenario={scenario}
        selectedSealPreviews={selectedSealPreviews}
        onSealPreviewChange={handleSealPreviewChange}
      />
      <UnitReferences unit={unit} />
    </div>
  );
}

function CorrinParentControls({
  config, boon, bane, boonId, baneId, talentId, showTalent, gender, setBoonId, setBaneId, setTalentId,
}: {
  config: NonNullable<UnitRuntime["avatarConfiguration"]>;
  boon: AvatarChoice;
  bane: AvatarChoice;
  boonId: string;
  baneId: string;
  talentId: string;
  showTalent: boolean;
  gender: AvatarGender;
  setBoonId: (id: string) => void;
  setBaneId: (id: string) => void;
  setTalentId: (id: string) => void;
}) {
  const { t, resolve, locale } = useLocale();
  const talentLabel = (talent: NonNullable<UnitRuntime["avatarConfiguration"]>["talents"][number]) => {
    const classId = talent.classId ?? talent.classIdByGender?.[gender];
    return resolve({ en: talent.label, zhHans: classId ? classNames(classId)?.zhHans : undefined });
  };
  return (
    <div className="offspring-corrin-controls">
      <Form.Group controlId="offspring-corrin-boon"><Form.Label>{t("offspring.corrinBoon")}</Form.Label><Form.Select value={boonId} onChange={(event) => setBoonId(event.target.value)}>{config.boons.map((choice) => <option key={choice.id} value={choice.id} disabled={choice.stat === bane.stat}>{resolve({ en: choice.label, zhHans: choice.labelZhHans })} ({shortStatLabel(choice.stat, locale)})</option>)}</Form.Select></Form.Group>
      <Form.Group controlId="offspring-corrin-bane"><Form.Label>{t("offspring.corrinBane")}</Form.Label><Form.Select value={baneId} onChange={(event) => setBaneId(event.target.value)}>{config.banes.map((choice) => <option key={choice.id} value={choice.id} disabled={choice.stat === boon.stat}>{resolve({ en: choice.label, zhHans: choice.labelZhHans })} ({shortStatLabel(choice.stat, locale)})</option>)}</Form.Select></Form.Group>
      {showTalent ? <Form.Group controlId="offspring-corrin-talent"><Form.Label>{t("offspring.corrinTalent")}</Form.Label><Form.Select value={talentId} onChange={(event) => setTalentId(event.target.value)}>{config.talents.map((talent) => <option key={talent.id} value={talent.id}>{talentLabel(talent)}</option>)}</Form.Select></Form.Group> : null}
    </div>
  );
}

function RecruitmentStatWalkthrough({
  unit,
  scenario,
  chapterStart,
  promotionClassId,
}: {
  unit: UnitRuntime;
  scenario: NonNullable<ReturnType<typeof resolveOffspringScenario>>;
  chapterStart: number;
  promotionClassId?: string;
}) {
  const { t, locale, resolve } = useLocale();
  const data = unit.offspring!.recruitment;
  const unitName = resolve({ en: unit.identity.displayName, zhHans: unit.identity.names?.zhHans });
  const fatherName = parentDisplayName(scenario.father, resolve);
  const motherName = parentDisplayName(scenario.mother, resolve);
  const enPlural = (n: number) => (locale === "en" && n !== 1 ? "s" : "");
  const [stat, setStat] = useState<keyof StatBlock>("strength");
  const milestone = data.levelByStoryPosition.find((entry, index, milestones) => {
    const chapterEnd = entry.chapterEnd ?? (milestones[index + 1]?.chapterStart ?? 28) - 1;
    return chapterStart >= entry.chapterStart && chapterStart <= chapterEnd;
  }) ?? data.levelByStoryPosition[0];
  const promotedLevel = data.offspringSeal.promotedLevelsByChapter[String(chapterStart)];
  const promotion = promotedLevel
    ? data.offspringSeal.promotionOptions.find((option) => option.classId === promotionClassId) ?? data.offspringSeal.promotionOptions[0]
    : undefined;
  const startingClassGrowthRates = classGrowthRatesFor(data.startingClassId);
  const promotedClassGrowthRates = promotion ? classGrowthRatesFor(promotion.classId) : undefined;
  const effectiveLevel = promotedLevel ? 20 + promotedLevel : milestone.level;
  const automaticLevels = effectiveLevel - 10;
  const promotedGrowthLevels = promotedLevel ? promotedLevel - 1 : 0;
  const childAptitudes = statBlockFrom((key) => (
    data.level10PersonalBases[key]
    + Math.floor(automaticLevels * (scenario.personalGrowth[key] + startingClassGrowthRates[key]) / 100)
  ));
  const promotedClassAptitudes = statBlockFrom((key) => (
    promotedClassGrowthRates ? roundHalfUp(promotedGrowthLevels * promotedClassGrowthRates[key] / 100) : 0
  ));
  const inheritanceBenchmarks = statBlockFrom((key) => childAptitudes[key] + promotedClassAptitudes[key]);
  const [fatherCurrentStats, setFatherCurrentStats] = useState<StatBlock>(() => statBlockFrom((key) => inheritanceBenchmarks[key] + 4));
  const [motherCurrentStats, setMotherCurrentStats] = useState<StatBlock>(() => statBlockFrom((key) => inheritanceBenchmarks[key] + 2));

  useEffect(() => {
    setFatherCurrentStats(statBlockFrom((key) => inheritanceBenchmarks[key] + 4));
    setMotherCurrentStats(statBlockFrom((key) => inheritanceBenchmarks[key] + 2));
  }, [chapterStart, promotionClassId, scenario.variableParent.identity.id, scenario.personalGrowth]);

  const currentClassBases = promotion?.classBaseStats ?? statBlockFrom((key) => (
    data.level10MinimumStatsBeforeInheritance[key] - data.level10PersonalBases[key]
  ));
  const calculations = Object.fromEntries(STAT_KEYS.map((key) => [key, calculateOffspringRecruitmentStat({
    childAptitude: childAptitudes[key],
    promotedClassAptitude: promotedClassAptitudes[key],
    fatherCurrentStat: fatherCurrentStats[key],
    motherCurrentStat: motherCurrentStats[key],
    currentClassBase: currentClassBases[key],
  })])) as Record<keyof StatBlock, ReturnType<typeof calculateOffspringRecruitmentStat>>;
  const finalStats = statBlockFrom((key) => calculations[key].finalStat);

  const personalBase = data.level10PersonalBases[stat];
  const classBase = currentClassBases[stat];
  const fullGrowth = scenario.personalGrowth[stat] + startingClassGrowthRates[stat];
  const automaticGrowth = childAptitudes[stat] - personalBase;
  const childAptitude = childAptitudes[stat];
  const promotedClassAptitude = promotedClassAptitudes[stat];
  const inheritanceBenchmark = inheritanceBenchmarks[stat];
  const { fatherSurplus, motherSurplus, quarteredSurplus, inheritanceCap, inheritanceBonus } = calculations[stat];
  const finalStat = finalStats[stat];

  function updateParentStat(parent: "father" | "mother", key: keyof StatBlock, value: number) {
    const update = (current: StatBlock) => ({ ...current, [key]: value });
    if (parent === "father") setFatherCurrentStats(update);
    else setMotherCurrentStats(update);
  }

  return (
    <div className="recruitment-walkthrough">
      <div className="recruitment-walkthrough-heading">
        <div>
          <span>{t("offspring.walk.eyebrow")}</span>
          <h3>{t("offspring.walk.title")}</h3>
          <p>{t("offspring.walk.using", { chapter: chapterStart, context: promotion ? `${promotion.displayName} Lv. ${promotedLevel}` : `Lv. ${milestone.level}` })}</p>
        </div>
        <div className="recruitment-walkthrough-controls">
          <Form.Group controlId="offspring-formula-stat">
            <Form.Label>{t("config.offspring.colStat")}</Form.Label>
            <Form.Select value={stat} onChange={(event) => setStat(event.target.value as keyof StatBlock)}>
              {STAT_KEYS.map((key) => <option key={key} value={key}>{shortStatLabel(key, locale)}</option>)}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="parent-stat-snapshots">
        <div>
          <span>{t("offspring.walk.inputsEyebrow")}</span>
          <h4>{t("offspring.walk.inputsTitle")}</h4>
          <p>{t("offspring.walk.inputsDesc")}</p>
        </div>
        <Table responsive>
          <thead>
            <tr><th>{t("offspring.walk.unit")}</th>{STAT_KEYS.map((key) => <th className={key === stat ? "is-selected" : undefined} key={key}>{shortStatLabel(key, locale)}</th>)}</tr>
          </thead>
          <tbody>
            <ParentStatInputRow
              label={fatherName}
              parent="father"
              selectedStat={stat}
              stats={fatherCurrentStats}
              onChange={updateParentStat}
            />
            <ParentStatInputRow
              label={motherName}
              parent="mother"
              selectedStat={stat}
              stats={motherCurrentStats}
              onChange={updateParentStat}
            />
            <tr className="parent-stat-result">
              <th scope="row">{t("offspring.walk.result", { name: unitName })}</th>
              {STAT_KEYS.map((key) => <td className={key === stat ? "is-selected" : undefined} key={key}>{finalStats[key]}</td>)}
            </tr>
          </tbody>
        </Table>
      </div>

      <div className="recruitment-recipe" aria-label={t("offspring.walk.recipeAria", { stat: shortStatLabel(stat, locale) })}>
        <RecipeStep number="1" title={t("offspring.walk.step1Title", { name: unitName })}>
          <p><strong>{personalBase}</strong> {t("offspring.walk.fixedBase")}</p>
          <p>+ <strong>{automaticGrowth}</strong> {t("offspring.walk.autoGrowth")}</p>
          {promotion ? <p>+ <strong>{promotedClassAptitude}</strong> {t("offspring.walk.aptitude", { class: promotion.displayName })}</p> : null}
          <output>= {inheritanceBenchmark} {t("offspring.walk.benchmarkAt", { context: promotion ? `${promotion.displayName} Lv. ${promotedLevel}` : `Lv. ${milestone.level}` })}</output>
        </RecipeStep>
        <ArrowRight aria-hidden="true" size={20} />
        <RecipeStep number="2" title={t("offspring.walk.step2Title")}>
          <p>{t("offspring.walk.parentCurrent", { name: fatherName, stat: shortStatLabel(stat, locale) })} <strong>{fatherCurrentStats[stat]}</strong></p>
          <p>{t("offspring.walk.parentCurrent", { name: motherName, stat: shortStatLabel(stat, locale) })} <strong>{motherCurrentStats[stat]}</strong></p>
          <p>{t("offspring.walk.subtractBenchmark", { name: unitName })} <strong>{inheritanceBenchmark}</strong></p>
          <output>{fatherSurplus} + {motherSurplus} = {fatherSurplus + motherSurplus} {t("offspring.walk.surplusUnit")}</output>
        </RecipeStep>
        <ArrowRight aria-hidden="true" size={20} />
        <RecipeStep number="3" title={t("offspring.walk.step3Title")}>
          <p>{t("offspring.walk.quarter")} <strong>{quarteredSurplus}</strong></p>
          <p>{t("offspring.walk.maxAllowed")} <strong>{inheritanceCap}</strong></p>
          <output>= {inheritanceBonus} {t("offspring.walk.inheritedPoint")}{enPlural(inheritanceBonus)}</output>
        </RecipeStep>
        <ArrowRight aria-hidden="true" size={20} />
        <RecipeStep number="4" title={t("offspring.walk.step4Title")}>
          <p><strong>{classBase}</strong> {t("offspring.walk.classBase", { class: promotion?.displayName ?? displayId(data.startingClassId) })}</p>
          <p>+ <strong>{childAptitude}</strong> {t("offspring.walk.childAptitude", { name: unitName })}</p>
          {promotion ? <p>+ <strong>{promotedClassAptitude}</strong> {t("offspring.walk.promotedAptitude")}</p> : null}
          <p>+ <strong>{inheritanceBonus}</strong> {t("offspring.walk.parentInheritance")}</p>
          <output>= {finalStat} {shortStatLabel(stat, locale)}</output>
        </RecipeStep>
      </div>

      <details className="recruitment-glossary">
        <summary>{t("offspring.walk.glossarySummary")}</summary>
        <div>
          <p><strong>{t("offspring.walk.gloss.autoLabel")}</strong>{t("offspring.walk.gloss.auto", { class: displayId(data.startingClassId), levels: automaticLevels, growth: fullGrowth, points: automaticGrowth })}{enPlural(automaticGrowth)}{t("offspring.walk.gloss.autoTail")}</p>
          {promotion && promotedClassGrowthRates ? <p><strong>{t("offspring.walk.gloss.promotedLabel")}</strong>{t("offspring.walk.gloss.promoted", { class: promotion.displayName, stat: shortStatLabel(stat, locale), rate: promotedClassGrowthRates[stat], level: promotedLevel ?? 0, value: promotedClassAptitude })}</p> : null}
          <p><strong>{t("offspring.walk.gloss.parentLabel")}</strong>{t("offspring.walk.gloss.parent", { name: unitName })}</p>
          <p><strong>{t("offspring.walk.gloss.surplusLabel")}</strong>{t("offspring.walk.gloss.surplus", { name: unitName })}</p>
        </div>
      </details>
    </div>
  );
}

function classGrowthRatesFor(classId: string): StatBlock {
  const profile = fe14Data.classStats.find((entry) => entry.classId === classId);
  if (!profile) throw new Error(`Missing FE14 class growth rates: ${classId}`);
  return profile.growthRates;
}

function ParentStatInputRow({
  label,
  parent,
  selectedStat,
  stats,
  onChange,
}: {
  label: string;
  parent: "father" | "mother";
  selectedStat: keyof StatBlock;
  stats: StatBlock;
  onChange: (parent: "father" | "mother", stat: keyof StatBlock, value: number) => void;
}) {
  const { t, locale } = useLocale();
  return (
    <tr>
      <th scope="row">{label}</th>
      {STAT_KEYS.map((key) => (
        <td className={key === selectedStat ? "is-selected" : undefined} key={key}>
          <input
            aria-label={t("offspring.walk.parentCurrentAria", { name: label, stat: shortStatLabel(key, locale) })}
            min="0"
            type="number"
            value={stats[key]}
            onChange={(event) => onChange(parent, key, Number(event.target.value))}
          />
        </td>
      ))}
    </tr>
  );
}

function statBlockFrom(resolve: (stat: keyof StatBlock) => number): StatBlock {
  return Object.fromEntries(STAT_KEYS.map((stat) => [stat, resolve(stat)])) as unknown as StatBlock;
}

function RecipeStep({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="recruitment-recipe-step">
      <header><span>{number}</span><h4>{title}</h4></header>
      <div>{children}</div>
    </div>
  );
}

function OffspringSupports({
  unit,
  scenario,
  selectedSealPreviews,
  onSealPreviewChange,
}: {
  unit: UnitRuntime;
  scenario: NonNullable<ReturnType<typeof resolveOffspringScenario>>;
  selectedSealPreviews: SealGrantPreviews;
  onSealPreviewChange: (seal: SealPreviewKind, preview: SealGrantPreview | null) => void;
}) {
  const { t, resolve } = useLocale();
  const parentage = unit.offspring!.parentage;
  const nativeClasses = new Set([parentage.childBaseClassId, scenario.fixedInheritedClassId, scenario.inheritedClassId].filter((classId): classId is string => Boolean(classId)));
  const azuraClausePartnerId = unit.identity.id === "kana"
    ? scenario.nestedVariableParentScenario?.siblingUnitId
    : undefined;
  const sourceSupports = parentage.supports.filter((support) =>
    support.kind !== "family"
    && (!support.unitGender || support.unitGender === scenario.childGender)
    && support.partnerUnitId !== scenario.variableParent.identity.id
    && support.partnerUnitId !== scenario.siblingUnitId
    && support.partnerUnitId !== azuraClausePartnerId
  );
  const supports = sourceSupports.map((support, index) => ({
    id: `${unit.identity.id}__${support.partnerUnitId}__${support.kind}__${index}`,
    unitId: unit.identity.id,
    partnerUnitId: support.partnerUnitId,
    partnerGender: support.partnerGender,
    kind: support.kind,
    ranks: support.ranks,
    routes: support.routes,
  })) as UnitRuntime["supports"];
  const sealGrants = sourceSupports.flatMap((support, index) => {
    if (!support.sealGrant) return [];
    const relationshipId = `${unit.identity.id}__${support.partnerUnitId}__${support.kind}__${index}`;
    const resolvedGrant = support.sealGrant.classCandidates && scenario.childGender
      ? resolveSupportGrant(support.sealGrant.classCandidates, nativeClasses, scenario.childGender)
      : { classId: support.sealGrant.grantedClassId, resolution: support.sealGrant.resolution };
    const alreadyOwned = resolvedGrant.classId !== "avatar_talent" && nativeClasses.has(resolvedGrant.classId);
    return [{
      supportRelationshipId: relationshipId,
      seal: support.sealGrant.seal,
      borrowedClassId: support.sealGrant.borrowedClassId,
      grantedClassId: resolvedGrant.classId,
      resolution: alreadyOwned ? "already_owned" : resolvedGrant.resolution,
      resolutionSteps: alreadyOwned ? [resolvedGrant.resolution, "already_owned"] : undefined,
      alreadyOwnedVia: alreadyOwned ? "base" : undefined,
    } satisfies SealGrant];
  });
  const supportUnit: UnitRuntime = {
    ...unit,
    supports,
    classAccess: unit.classAccess ? { ...unit.classAccess, sealGrants } : null,
  };
  const siblingRoster = fe14Data.roster.find((candidate) => candidate.id === scenario.siblingUnitId);
  const siblingName = siblingRoster ? resolve({ en: siblingRoster.displayName, zhHans: siblingRoster.names?.zhHans }) : (scenario.siblingUnitId ? displayId(scenario.siblingUnitId) : undefined);
  const azuraRoster = fe14Data.roster.find((candidate) => candidate.id === azuraClausePartnerId);
  const azuraClausePartnerName = azuraRoster ? resolve({ en: azuraRoster.displayName, zhHans: azuraRoster.names?.zhHans }) : undefined;
  return (
    <section className="data-section" aria-labelledby="supports-heading">
      <SectionHeading title={t("section.supports.title")} id="supports-heading" />
      <div className="offspring-family-strip">
        <span><strong>{t("offspring.family.father")}</strong> {parentName(scenario.father, resolve, scenario.childGender === "female" ? "male" : undefined)} (C-A)</span>
        <span><strong>{t("offspring.family.mother")}</strong> {parentName(scenario.mother, resolve, scenario.childGender === "male" ? "female" : undefined)} (C-A)</span>
        {siblingName ? <span><strong>{t("offspring.family.sibling")}</strong> {siblingName} (C-A)</span> : null}
      </div>
      <SupportDirectory
        unit={supportUnit}
        avatarSelection={null}
        selectedSealPreviews={selectedSealPreviews}
        onSealPreviewChange={onSealPreviewChange}
      />
      {azuraClausePartnerName ? (
        <p className="offspring-rule-note offspring-special-note">
          <strong>{t("offspring.azuraLabel")}</strong>{t("offspring.azuraClause", { name: azuraClausePartnerName })}
        </p>
      ) : null}
    </section>
  );
}

function ResolvedClassLabel({ classId }: { classId: string | null }) {
  const { t } = useLocale();
  return classId ? <ClassTreeLabel classId={classId} /> : <span>{t("offspring.summary.noTree")}</span>;
}

function parentDisplayName(unit: UnitRuntime, resolve: ReturnType<typeof useLocale>["resolve"]): string {
  return resolve({ en: unit.identity.displayName, zhHans: unit.identity.names?.zhHans });
}

function firstParentRoute(option?: { routes: string[] }): RouteId {
  return ROUTE_ORDER.find((route) => option?.routes.includes(route)) ?? "birthright";
}

function parentName(unit: UnitRuntime, resolve: ReturnType<typeof useLocale>["resolve"], corrinGender?: "female" | "male") {
  if (unit.identity.id !== "corrin" || !corrinGender) return parentDisplayName(unit, resolve);
  return corrinGenderName(corrinGender, resolve);
}

function corrinGenderName(gender: "female" | "male", resolve: ReturnType<typeof useLocale>["resolve"]): string {
  return resolve({ en: `Corrin (${gender === "male" ? "M" : "F"})`, zhHans: gender === "male" ? "神威（男）" : "神威（女）" });
}

function resolveSupportGrant(
  candidates: { primaryClassId: string; secondaryClassId?: string },
  owned: Set<string>,
  gender: "female" | "male",
) {
  const restricted = new Set(["songstress", "kitsune", "wolfskin", "villager", "nohr_prince"]);
  const parallel: Record<string, string> = {
    cavalier: "ninja", knight: "spear_fighter", fighter: "oni_savage", mercenary: "samurai",
    outlaw: "archer", samurai: "mercenary", oni_savage: "fighter", spear_fighter: "knight",
    diviner: "dark_mage", sky_knight: "wyvern_rider", archer: "outlaw", wyvern_rider: "sky_knight",
    ninja: "cavalier", dark_mage: "diviner", wolfskin: "outlaw", kitsune: "apothecary",
    songstress: "troubadour", villager: "apothecary",
  };
  const genderClass = (classId: string) => classId === "shrine_maiden" && gender === "male"
    ? "monk"
    : classId === "monk" && gender === "female" ? "shrine_maiden" : classId;
  const primary = genderClass(candidates.primaryClassId);
  const secondary = candidates.secondaryClassId ? genderClass(candidates.secondaryClassId) : undefined;
  if (!restricted.has(candidates.primaryClassId) && !owned.has(primary)) return { classId: primary, resolution: primary === candidates.primaryClassId ? "direct" : "gender_parallel" };
  const fallbackReason = restricted.has(candidates.primaryClassId) ? "restricted_primary_fallback" : "duplicate_primary_fallback";
  if (secondary && !owned.has(secondary)) return { classId: secondary, resolution: secondary === candidates.secondaryClassId ? fallbackReason : "gender_parallel" };
  const parallelClass = parallel[primary];
  return { classId: parallelClass ? genderClass(parallelClass) : primary, resolution: parallelClass ? "parallel_class_fallback" : "variable" };
}

function formatRoutes(routes: string[], locale: string): string {
  if (routes.length === 3) return locale === "zhHans" ? "全部路线" : "ALL";
  const labels: Record<string, string> = locale === "zhHans"
    ? { birthright: "白夜", conquest: "暗夜", revelation: "透魔" }
    : { birthright: "BR", conquest: "CQ", revelation: "RV" };
  return routes.map((route) => labels[route] ?? route).join(" / ");
}
