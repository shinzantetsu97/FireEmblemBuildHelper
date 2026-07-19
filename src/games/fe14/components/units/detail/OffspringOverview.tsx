import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { displayId, fe14Data, type AvatarChoice, type SealGrant, type StatBlock, type UnitRuntime } from "../../../data";
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

export default function OffspringOverview({
  unit,
  childGender,
  setChildGender,
}: {
  unit: UnitRuntime;
  childGender: AvatarGender;
  setChildGender: (gender: AvatarGender) => void;
}) {
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
  const unitName = unit.identity.displayName;
  const corrinGender = scenario.childGender === "male" ? "female" : "male";
  const fixedParentName = isAvatarChild ? `Corrin (${corrinGender === "male" ? "M" : "F"})` : scenario.fixedParent.identity.displayName;
  const variableParentLabel = parentage.variableParentRole === "parent" ? "Parent" : parentage.variableParentRole === "father" ? "Father" : "Mother";
  const variableParentLabelLower = variableParentLabel.toLowerCase();
  const siblingName = scenario.siblingUnitId
    ? fe14Data.roster.find((candidate) => candidate.id === scenario.siblingUnitId)?.displayName ?? displayId(scenario.siblingUnitId)
    : undefined;

  return (
    <div className="unit-overview offspring-overview">
      {isAvatarChild ? (
        <Alert className="kana-data-warning" variant="danger">
          <div className="kana-data-warning-heading">
            <TriangleAlert aria-hidden="true" size={22} />
            <Alert.Heading as="h2">Caution: Kana's profile has unusually high bug risk</Alert.Heading>
          </div>
          <p>Please scrutinize these results and treat observed in-game behavior as authoritative. Calculating one deterministic Kana profile requires the planner to:</p>
          <ul>
            <li>Resolve one of Corrin's 67 available partners, including that unit's stats, primary class, and secondary class.</li>
            <li>If the partner is an offspring unit, first resolve that unit's other parent and inherited profile.</li>
            <li>For Female Corrin, handle male Kana's class inheritance failure: when the other parent's original class collides and has no parallel fallback, Kana receives no additional inherited tree.</li>
            <li>If Corrin marries one of Azura's offspring, remove Azura's other offspring from Kana's support list entirely.</li>
            <li>Combine Corrin's boon, bane, and Talent with both parents' actual stat lines at paralogue entry.</li>
          </ul>
          <p>Kana is not even an especially strong unit because of those poor bases. Somehow this one small dragon requires roughly six configuration choices, recursive parent resolution, live class-fallback logic, conditional support deletion, and both parents' stats just to describe one concrete profile.</p>
          <p className="kana-data-warning-signoff"><strong>Well done, Intelligent Systems.</strong> You somehow managed to pack incest, eugenics, a reclassing nightmare, class-inheritance edge-case failures, A-tier kawaii, and D-tier combat prowess into one smol dragon package. I have not checked Awakening’s Morgan yet, but I would have thought you’d learned your lesson by now.</p>
        </Alert>
      ) : null}
      <Alert className="review-alert" variant="warning">
        <TriangleAlert aria-hidden="true" size={19} />
        <span>{unitName}'s variable data is resolved from {fixedParentName} and the selected {variableParentLabelLower}. Recruitment bases still require both parents' actual gained-stat snapshots at paralogue entry.</span>
      </Alert>

      <section className="offspring-route-section" aria-labelledby="offspring-route-heading">
        <div>
          <span>Planning route</span>
          <h2 id="offspring-route-heading">Choose Route</h2>
          <p>The route determines which parents are available and when this paralogue can first unlock.</p>
        </div>
        <ButtonGroup aria-label="Choose offspring route" role="tablist">
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
              {route === "birthright" ? "Birthright" : route === "conquest" ? "Conquest" : "Revelation"}
            </Button>
          ))}
        </ButtonGroup>
      </section>

      <section className="data-section offspring-parent-section" aria-labelledby="parent-heading">
        <SectionHeading eyebrow="Parent scenario" title={`Choose ${unitName}'s ${variableParentLabelLower}`} id="parent-heading" />
        <div className="offspring-parent-controls">
          {isAvatarChild ? (
            <Form.Group controlId={`${unit.identity.id}-gender`}>
              <Form.Label>Kana gender</Form.Label>
              <Form.Select value={childGender} onChange={(event) => {
                setChildGender(event.target.value as AvatarGender);
                setStoryChapter(8);
              }}>
                <option value="female">Female Kana / Corrin (M)</option>
                <option value="male">Male Kana / Corrin (F)</option>
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
                return <option key={option.unitId} value={option.unitId}>{parent?.displayName ?? displayId(option.unitId)} ({formatRoutes(option.routes)})</option>;
              })}
            </Form.Select>
          </Form.Group>
          {(resolvedParentId === "corrin" || isAvatarChild) && config && boon && bane ? (
            <CorrinParentControls config={config} boon={boon} bane={bane} boonId={boonId} baneId={baneId} talentId={talentId} showTalent={isAvatarChild} setBoonId={setBoonId} setBaneId={setBaneId} setTalentId={setTalentId} />
          ) : null}
          {scenario.nestedVariableParentOptions.length ? (
            <Form.Group className="offspring-nested-parent" controlId={`${unit.identity.id}-nested-parent`}>
              <Form.Label>{scenario.variableParent.identity.displayName}'s {nestedRoleLabel(scenario.variableParent).toLowerCase()}</Form.Label>
              <Form.Select value={scenario.nestedVariableParentId ?? ""} onChange={(event) => {
                setNestedParentId(event.target.value);
                setStoryChapter(8);
              }}>
                {scenario.nestedVariableParentOptions.filter((option) => option.routes.includes(routeId)).map((option) => {
                  const parent = fe14Data.roster.find((candidate) => candidate.id === option.unitId);
                  return <option key={option.unitId} value={option.unitId}>{parent?.displayName ?? displayId(option.unitId)} ({formatRoutes(option.routes.filter((route) => selectedOption.routes.includes(route)))})</option>;
                })}
              </Form.Select>
              <Form.Text>This resolves the selected offspring parent's own inherited profile before Kana is calculated.</Form.Text>
            </Form.Group>
          ) : null}
          <div className="offspring-parent-summary">
            <span>Fixed parent</span><strong>{fixedParentName}</strong>
            <span>Inherited tree</span><strong><ResolvedClassLabel classId={scenario.inheritedClassId} /></strong>
            {isAvatarChild ? <><span>Corrin Talent</span><strong><ResolvedClassLabel classId={scenario.fixedInheritedClassId} /></strong><span>Cap inheritance bonus</span><strong>{selectedOption.parentGeneration === "second" ? "+0 (offspring parent)" : "+1"}</strong></> : null}
            <span>Dragon Vein</span><strong>{unit.identity.dragonVein || scenario.father.identity.dragonVein || scenario.mother.identity.dragonVein ? "Yes" : "No"}</strong>
            <span>Unit traits</span><strong>{scenario.unitTags.length ? scenario.unitTags.map((tag) => `${displayId(tag)} unit`).join(", ") : "None"}</strong>
            {siblingName ? <><span>Sibling</span><strong>{siblingName}</strong></> : null}
          </div>
        </div>
        {isAvatarChild ? (
          <>
            <p className="offspring-rule-note"><strong>Inheritance order:</strong> child, father, then mother. Female Kana resolves Corrin's Talent before her mother's tree; male Kana resolves his father's tree before Corrin's Talent. A duplicate Talent uses that tree's parallel-class fallback rather than reconsidering the father's secondary class.</p>
            <p className="offspring-rule-note offspring-special-note"><strong>No parallel fallback among Corrin Talents:</strong> Apothecary, Troubadour, and Monk / Shrine Maiden. If male Kana's father already supplied the selected tree, Kana receives no additional Corrin tree.</p>
          </>
        ) : resolvedParentId === "corrin" ? (
          <p className="offspring-rule-note"><strong>Corrin inheritance:</strong> {unitName} receives Nohr Prince and the Dragon unit trait, not Corrin's Talent. The line promotes to Hoshido Noble in Birthright, Nohr Noble in Conquest, and either Noble class in Revelation. Kana reaches the Talent only because Kana already owns the Noble base class.</p>
        ) : selectedOption.inheritedClassReason !== "direct" ? (
          <p className="offspring-rule-note">The selected {variableParentLabelLower}'s primary class cannot be inherited here, so {unitName} receives the resolved fallback tree through {displayId(selectedOption.inheritedClassReason)}.</p>
        ) : null}
        {parentage.notes?.map((note) => <p className="offspring-rule-note offspring-special-note" key={note}>{note}</p>)}
      </section>

      <section className="data-section" aria-labelledby="offspring-base-heading">
        <SectionHeading eyebrow="Resolved starting state" title="Base configuration" id="offspring-base-heading" />
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
          <strong>Stance inheritance:</strong> Attack Stance alternates {scenario.mother.identity.displayName} at C, {scenario.father.identity.displayName} at B, {scenario.mother.identity.displayName} at A, and {scenario.father.identity.displayName} at S. Guard Stance uses {scenario.father.identity.displayName}, {scenario.mother.identity.displayName}, {scenario.father.identity.displayName}, then {scenario.mother.identity.displayName}.
        </p>
      </section>

      <details className="offspring-calculator-details">
        <summary>Open recruitment inheritance calculator and formula walkthrough</summary>
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
          { label: "Own class", classIds: [parentage.childBaseClassId] },
          { label: `From ${fixedParentName}`, classIds: [scenario.fixedInheritedClassId] },
          { label: `From ${scenario.variableParent.identity.displayName}`, classIds: [scenario.inheritedClassId] },
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
  config, boon, bane, boonId, baneId, talentId, showTalent, setBoonId, setBaneId, setTalentId,
}: {
  config: NonNullable<UnitRuntime["avatarConfiguration"]>;
  boon: AvatarChoice;
  bane: AvatarChoice;
  boonId: string;
  baneId: string;
  talentId: string;
  showTalent: boolean;
  setBoonId: (id: string) => void;
  setBaneId: (id: string) => void;
  setTalentId: (id: string) => void;
}) {
  return (
    <div className="offspring-corrin-controls">
      <Form.Group controlId="offspring-corrin-boon"><Form.Label>Corrin boon</Form.Label><Form.Select value={boonId} onChange={(event) => setBoonId(event.target.value)}>{config.boons.map((choice) => <option key={choice.id} value={choice.id} disabled={choice.stat === bane.stat}>{choice.label} ({shortStatLabel(choice.stat)})</option>)}</Form.Select></Form.Group>
      <Form.Group controlId="offspring-corrin-bane"><Form.Label>Corrin bane</Form.Label><Form.Select value={baneId} onChange={(event) => setBaneId(event.target.value)}>{config.banes.map((choice) => <option key={choice.id} value={choice.id} disabled={choice.stat === boon.stat}>{choice.label} ({shortStatLabel(choice.stat)})</option>)}</Form.Select></Form.Group>
      {showTalent ? <Form.Group controlId="offspring-corrin-talent"><Form.Label>Corrin Talent</Form.Label><Form.Select value={talentId} onChange={(event) => setTalentId(event.target.value)}>{config.talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.label}</option>)}</Form.Select></Form.Group> : null}
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
  const data = unit.offspring!.recruitment;
  const unitName = unit.identity.displayName;
  const fatherName = scenario.father.identity.displayName;
  const motherName = scenario.mother.identity.displayName;
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
          <span>Live inheritance calculation</span>
          <h3>Parent-stat recruitment calculator</h3>
          <p>Using Chapter {chapterStart} · {promotion ? `${promotion.displayName} Lv. ${promotedLevel}` : `Lv. ${milestone.level}`}. Change recruitment timing or class above.</p>
        </div>
        <div className="recruitment-walkthrough-controls">
          <Form.Group controlId="offspring-formula-stat">
            <Form.Label>Stat</Form.Label>
            <Form.Select value={stat} onChange={(event) => setStat(event.target.value as keyof StatBlock)}>
              {STAT_KEYS.map((key) => <option key={key} value={key}>{shortStatLabel(key)}</option>)}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="parent-stat-snapshots">
        <div>
          <span>Calculator inputs</span>
          <h4>Both parents' complete inheritance stat lines</h4>
          <p>Enter each parent's class-independent personal stats: fixed personal base plus level-up gains. Exclude class bases, stat boosters, Pair Up, equipment, meals, tonics, and statues.</p>
        </div>
        <Table responsive>
          <thead>
            <tr><th>Unit</th>{STAT_KEYS.map((key) => <th className={key === stat ? "is-selected" : undefined} key={key}>{shortStatLabel(key)}</th>)}</tr>
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
              <th scope="row">{unitName} result</th>
              {STAT_KEYS.map((key) => <td className={key === stat ? "is-selected" : undefined} key={key}>{finalStats[key]}</td>)}
            </tr>
          </tbody>
        </Table>
      </div>

      <div className="recruitment-recipe" aria-label={`${shortStatLabel(stat)} recruitment stat calculation`}>
        <RecipeStep number="1" title={`${unitName}'s own stat`}>
          <p><strong>{personalBase}</strong> fixed personal base</p>
          <p>+ <strong>{automaticGrowth}</strong> base-line automatic growth</p>
          {promotion ? <p>+ <strong>{promotedClassAptitude}</strong> {promotion.displayName} aptitude</p> : null}
          <output>= {inheritanceBenchmark} inheritance benchmark at {promotion ? `${promotion.displayName} Lv. ${promotedLevel}` : `Lv. ${milestone.level}`}</output>
        </RecipeStep>
        <ArrowRight aria-hidden="true" size={20} />
        <RecipeStep number="2" title="Parents' usable surplus">
          <p>{fatherName}'s current {shortStatLabel(stat)}: <strong>{fatherCurrentStats[stat]}</strong></p>
          <p>{motherName}'s current {shortStatLabel(stat)}: <strong>{motherCurrentStats[stat]}</strong></p>
          <p>Subtract {unitName}'s benchmark: <strong>{inheritanceBenchmark}</strong></p>
          <output>{fatherSurplus} + {motherSurplus} = {fatherSurplus + motherSurplus} surplus</output>
        </RecipeStep>
        <ArrowRight aria-hidden="true" size={20} />
        <RecipeStep number="3" title="Quarter it, then cap it">
          <p>One quarter, floored: <strong>{quarteredSurplus}</strong></p>
          <p>Maximum allowed here: <strong>{inheritanceCap}</strong></p>
          <output>= {inheritanceBonus} inherited point{inheritanceBonus === 1 ? "" : "s"}</output>
        </RecipeStep>
        <ArrowRight aria-hidden="true" size={20} />
        <RecipeStep number="4" title="Final recruitment stat">
          <p><strong>{classBase}</strong> {promotion?.displayName ?? displayId(data.startingClassId)} class base</p>
          <p>+ <strong>{childAptitude}</strong> {unitName}'s child aptitude</p>
          {promotion ? <p>+ <strong>{promotedClassAptitude}</strong> promoted-class aptitude</p> : null}
          <p>+ <strong>{inheritanceBonus}</strong> parent inheritance</p>
          <output>= {finalStat} {shortStatLabel(stat)}</output>
        </RecipeStep>
      </div>

      <details className="recruitment-glossary">
        <summary>Formula definitions</summary>
        <div>
          <p><strong>Automatic-growth gain</strong> is deterministic story catch-up. Because this unit joins above level 10, the game awards the average stat points they would have gained across those missing levels using resolved personal growth plus {displayId(data.startingClassId)} growth: {automaticLevels} levels x {fullGrowth}% = {automaticGrowth} point{automaticGrowth === 1 ? "" : "s"}, after flooring.</p>
          {promotion && promotedClassGrowthRates ? <p><strong>Promoted-class aptitude</strong> is calculated separately: {promotion.displayName}'s {shortStatLabel(stat)} class growth ({promotedClassGrowthRates[stat]}%) x ({promotedLevel} promoted levels - 1) = {promotedClassAptitude}, rounded to the nearest integer with exact halves rounded up. The promotion itself is not a promoted-class growth level.</p> : null}
          <p><strong>Parent current stats</strong> are entered as complete eight-stat snapshots so every {unitName} result updates together. These are the class-independent values used for inheritance: each parent's fixed personal value plus points actually earned through level-ups. Class bases and temporary or external bonuses are not inherited.</p>
          <p><strong>Only surplus counts.</strong> A parent at or below {unitName}'s inheritance benchmark contributes zero. The editable parent values above are illustrative until the planner has parent level-up snapshots.</p>
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
  return (
    <tr>
      <th scope="row">{label}</th>
      {STAT_KEYS.map((key) => (
        <td className={key === selectedStat ? "is-selected" : undefined} key={key}>
          <input
            aria-label={`${label} current ${shortStatLabel(key)}`}
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
  const siblingName = fe14Data.roster.find((candidate) => candidate.id === scenario.siblingUnitId)?.displayName ?? (scenario.siblingUnitId ? displayId(scenario.siblingUnitId) : undefined);
  const azuraClausePartnerName = fe14Data.roster.find((candidate) => candidate.id === azuraClausePartnerId)?.displayName;
  return (
    <section className="data-section" aria-labelledby="supports-heading">
      <SectionHeading eyebrow="Relationships" title="Supports and seal grants" id="supports-heading" />
      <div className="offspring-family-strip">
        <span><strong>Father</strong> {parentName(scenario.father, scenario.childGender === "female" ? "male" : undefined)} (C-A)</span>
        <span><strong>Mother</strong> {parentName(scenario.mother, scenario.childGender === "male" ? "female" : undefined)} (C-A)</span>
        {siblingName ? <span><strong>Sibling</strong> {siblingName} (C-A)</span> : null}
      </div>
      <SupportDirectory
        unit={supportUnit}
        avatarSelection={null}
        selectedSealPreviews={selectedSealPreviews}
        onSealPreviewChange={onSealPreviewChange}
      />
      {azuraClausePartnerName ? (
        <p className="offspring-rule-note offspring-special-note">
          <strong>Azura clause:</strong> {azuraClausePartnerName} is unavailable because Corrin married Azura's other offspring, making {azuraClausePartnerName} Kana's aunt or uncle. Apparently the double-spoiler family tree is where Fates finally draws a line: incest, unfortunately, is not wincest here. The support is removed entirely, so there is no C-A chain, S rank, or seal grant.
        </p>
      ) : null}
    </section>
  );
}

function ResolvedClassLabel({ classId }: { classId: string | null }) {
  return classId ? <ClassTreeLabel classId={classId} /> : <span>No additional tree</span>;
}

function nestedRoleLabel(unit: UnitRuntime) {
  const role = unit.offspring?.parentage.variableParentRole;
  if (role === "father") return "Father";
  if (role === "mother") return "Mother";
  return "Parent";
}

function firstParentRoute(option?: { routes: string[] }): RouteId {
  return ROUTE_ORDER.find((route) => option?.routes.includes(route)) ?? "birthright";
}

function parentName(unit: UnitRuntime, corrinGender?: "female" | "male") {
  if (unit.identity.id !== "corrin" || !corrinGender) return unit.identity.displayName;
  return `Corrin (${corrinGender === "male" ? "M" : "F"})`;
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

function formatRoutes(routes: string[]): string {
  if (routes.length === 3) return "ALL";
  return routes.map((route) => ({ birthright: "BR", conquest: "CQ", revelation: "RV" })[route] ?? route).join(" / ");
}
