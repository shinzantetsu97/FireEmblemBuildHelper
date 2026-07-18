import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { ArrowRight, Baby, GitBranch, TriangleAlert } from "lucide-react";
import { displayId, fe14Data, type AvatarChoice, type SealGrant, type StatBlock, type UnitRuntime } from "../../../data";
import { calculateOffspringRecruitmentStat, resolveOffspringScenario, roundHalfUp } from "../../../offspring";
import PersonalSkill from "../../skills/PersonalSkill";
import UnitClassSkills from "../../skills/UnitClassSkills";
import { ClassTreeLabel } from "./ClassTree";
import GrowthBar from "./GrowthBar";
import PairupTable from "./PairupTable";
import SectionHeading from "./SectionHeading";
import SupportDirectory, { type SealGrantPreview, type SealGrantPreviews, type SealPreviewKind } from "./SupportDirectory";
import { STAT_KEYS, type AvatarGender } from "./types";
import { corrinNobleBaseLabel } from "./UnitHeader";
import UnitReferences from "./UnitReferences";
import { formatSigned, shortStatLabel } from "./utils";

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
  const [parentId, setParentId] = useState(parentOptions[0]?.unitId ?? "");
  const corrin = fe14Data.units.find((candidate) => candidate.identity.id === "corrin");
  const config = corrin?.avatarConfiguration;
  const [boonId, setBoonId] = useState("robust");
  const [baneId, setBaneId] = useState("weak");
  const [talentId, setTalentId] = useState(config?.talents[0]?.id ?? "cavalier");
  const [nestedParentId, setNestedParentId] = useState("");
  const [selectedSealPreviews, setSelectedSealPreviews] = useState<SealGrantPreviews>({});
  const boon = config?.boons.find((choice) => choice.id === boonId) ?? config?.boons[0];
  const bane = config?.banes.find((choice) => choice.id === baneId) ?? config?.banes[1];

  useEffect(() => {
    if (!parentOptions.some((option) => option.unitId === parentId)) setParentId(parentOptions[0]?.unitId ?? "");
  }, [parentOptions, parentId]);
  useEffect(() => setNestedParentId(""), [parentId]);

  const scenario = useMemo(
    () => resolveOffspringScenario(unit, parentId, boon, bane, { corrinTalentId: talentId, nestedVariableParentId: nestedParentId }),
    [unit, parentId, boon, bane, talentId, nestedParentId],
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
  const selectedOption = parentage.variableParentOptions.find((option) => option.unitId === parentId)!;
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

      <section className="data-section offspring-parent-section" aria-labelledby="parent-heading">
        <SectionHeading eyebrow="Parent scenario" title={`Choose ${unitName}'s ${variableParentLabelLower}`} id="parent-heading" />
        <div className="offspring-parent-controls">
          {isAvatarChild ? (
            <Form.Group controlId={`${unit.identity.id}-gender`}>
              <Form.Label>Kana gender</Form.Label>
              <Form.Select value={childGender} onChange={(event) => setChildGender(event.target.value as AvatarGender)}>
                <option value="female">Female Kana / Corrin (M)</option>
                <option value="male">Male Kana / Corrin (F)</option>
              </Form.Select>
            </Form.Group>
          ) : null}
          <Form.Group controlId={`${unit.identity.id}-${variableParentLabelLower}`}>
            <Form.Label>{variableParentLabel}</Form.Label>
            <Form.Select value={parentId} onChange={(event) => setParentId(event.target.value)}>
              {parentOptions.map((option) => {
                const parent = fe14Data.roster.find((candidate) => candidate.id === option.unitId);
                return <option key={option.unitId} value={option.unitId}>{parent?.displayName ?? displayId(option.unitId)} ({formatRoutes(option.routes)})</option>;
              })}
            </Form.Select>
          </Form.Group>
          {(parentId === "corrin" || isAvatarChild) && config && boon && bane ? (
            <CorrinParentControls config={config} boon={boon} bane={bane} boonId={boonId} baneId={baneId} talentId={talentId} showTalent={isAvatarChild} setBoonId={setBoonId} setBaneId={setBaneId} setTalentId={setTalentId} />
          ) : null}
          {scenario.nestedVariableParentOptions.length ? (
            <Form.Group className="offspring-nested-parent" controlId={`${unit.identity.id}-nested-parent`}>
              <Form.Label>{scenario.variableParent.identity.displayName}'s {nestedRoleLabel(scenario.variableParent).toLowerCase()}</Form.Label>
              <Form.Select value={scenario.nestedVariableParentId ?? ""} onChange={(event) => setNestedParentId(event.target.value)}>
                {scenario.nestedVariableParentOptions.map((option) => {
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
        ) : parentId === "corrin" ? (
          <p className="offspring-rule-note"><strong>Corrin inheritance:</strong> {unitName} receives Nohr Prince and the Dragon unit trait, not Corrin's Talent. The line promotes to Hoshido Noble in Birthright, Nohr Noble in Conquest, and either Noble class in Revelation. Kana reaches the Talent only because Kana already owns the Noble base class.</p>
        ) : selectedOption.inheritedClassReason !== "direct" ? (
          <p className="offspring-rule-note">The selected {variableParentLabelLower}'s primary class cannot be inherited here, so {unitName} receives the resolved fallback tree through {displayId(selectedOption.inheritedClassReason)}.</p>
        ) : null}
        {parentage.notes?.map((note) => <p className="offspring-rule-note offspring-special-note" key={note}>{note}</p>)}
      </section>

      <RecruitmentPanel unit={unit} scenario={scenario} />

      <UnitClassSkills
        gender={scenario.childGender}
        sources={[
          { label: "Own class", classIds: [parentage.childBaseClassId] },
          { label: `From ${fixedParentName}`, classIds: [scenario.fixedInheritedClassId] },
          { label: `From ${scenario.variableParent.identity.displayName}`, classIds: [scenario.inheritedClassId] },
        ]}
        selectedSealPreviews={selectedSealPreviews}
      />

      <section className="data-section" aria-labelledby="offspring-stats-heading">
        <SectionHeading eyebrow="Resolved numbers" title="Personal growth and cap modifiers" id="offspring-stats-heading" />
        <div className="offspring-stat-layout">
          <ResolvedStats scenario={scenario} />
          <ParentGrowthPanel name={scenario.variableParent.identity.displayName} growth={scenario.variableParentGrowth} nestedParentName={scenario.nestedVariableParentScenario?.variableParent.identity.displayName} />
        </div>
      </section>

      <section className="data-section two-column-data" aria-label="Skill and class access">
        <div>
          <SectionHeading eyebrow="Identity" title="Personal skill" id="skill-heading" />
          {unit.personalSkill ? <PersonalSkill skill={unit.personalSkill} labelledBy="skill-heading" /> : null}
        </div>
        <div>
          <SectionHeading eyebrow="Inheritance" title="Resolved class access" id="class-heading" />
          <dl className="class-access-list" aria-labelledby="class-heading">
            <div><dt>Own class</dt><dd><ClassTreeLabel classId={parentage.childBaseClassId} labelOverride={isAvatarChild ? corrinNobleBaseLabel(childGender) : undefined} /></dd></div>
            <div><dt>From {fixedParentName}</dt><dd><ResolvedClassLabel classId={scenario.fixedInheritedClassId} /></dd></div>
            <div><dt>From {scenario.variableParent.identity.displayName}</dt><dd><ResolvedClassLabel classId={scenario.inheritedClassId} /></dd></div>
          </dl>
        </div>
      </section>

      <section className="data-section" aria-labelledby="pairup-heading">
        <SectionHeading eyebrow="Resolved support bonuses" title="Attack and Guard Stance" id="pairup-heading" />
        <PairupTable bonuses={scenario.bonuses} />
        <p className="offspring-rule-note">Ranks alternate parent contributions: Attack Stance uses {scenario.mother.identity.displayName} C, {scenario.father.identity.displayName} B, {scenario.mother.identity.displayName} A, {scenario.father.identity.displayName} S; Guard Stance uses {scenario.father.identity.displayName} C, {scenario.mother.identity.displayName} B, {scenario.father.identity.displayName} A, {scenario.mother.identity.displayName} S.</p>
      </section>

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

function RecruitmentPanel({
  unit,
  scenario,
}: {
  unit: UnitRuntime;
  scenario: NonNullable<ReturnType<typeof resolveOffspringScenario>>;
}) {
  const data = unit.offspring!.recruitment;
  const unitName = unit.identity.displayName;
  const startingClassName = unit.identity.id === "kana" ? corrinNobleBaseLabel(scenario.childGender ?? "female") : displayId(data.startingClassId);
  return (
    <section className="data-section" aria-labelledby="recruitment-heading">
      <SectionHeading eyebrow={`Paralogue ${data.paralogueNo}`} title={data.paralogueTitle} id="recruitment-heading" />
      <div className="offspring-recruitment-grid">
        <div className="offspring-recruitment-summary">
          <Baby aria-hidden="true" size={22} />
          <dl>
            <div><dt>Recruit</dt><dd>{data.recruitment.description}</dd></div>
            <div><dt>Starts as</dt><dd>{initialFactionLabel(data.initialFaction)}</dd></div>
            <div><dt>Starting class</dt><dd><ClassTreeLabel classId={data.startingClassId} labelOverride={unit.identity.id === "kana" ? corrinNobleBaseLabel(scenario.childGender ?? "female") : undefined} /></dd></div>
            <div><dt>Weapon rank</dt><dd>{Object.entries(data.weaponRanks).map(([weapon, rank]) => `${displayId(weapon)} ${rank}`).join(", ")}</dd></div>
            <div><dt>Inventory</dt><dd>{data.inventory.map(displayId).join(", ")}</dd></div>
          </dl>
        </div>
        <div className="offspring-scaling">
          <h3>Story-position level</h3>
          <div>{data.levelByStoryPosition.map((milestone) => <span key={milestone.chapterStart}>Ch. {milestone.chapterStart}{milestone.chapterEnd && milestone.chapterEnd !== milestone.chapterStart ? `-${milestone.chapterEnd}` : ""}: Lv. {milestone.level}</span>)}</div>
          <p>Child recruitment levels rise with story progress. From Chapter 19 onward, an Offspring Seal supplies the appropriate promoted level and learned class skills.</p>
          <p><strong>Research credit:</strong> FE14 scaling details were identified and explained by modder ltranc@.</p>
        </div>
      </div>
      {data.recruitmentNotes?.map((note) => <p className="offspring-rule-note" key={note}>{note}</p>)}
      {data.recruitment.deathBeforeRecruitmentIsPermanent ? <Alert className="offspring-death-warning" variant="danger"><TriangleAlert aria-hidden="true" size={18} /><span>If {unitName} falls before recruitment, {unitName} is permanently lost even in Casual or Phoenix mode.</span></Alert> : null}
      <Table className="offspring-base-table" responsive>
        <thead><tr><th>Level-10 baseline</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat)}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Minimum before inheritance</th>{STAT_KEYS.map((stat) => <td key={stat}>{data.level10MinimumStatsBeforeInheritance[stat]}</td>)}</tr>
          <tr><th scope="row">Fixed personal base</th>{STAT_KEYS.map((stat) => <td key={stat}>{data.level10PersonalBases[stat]}</td>)}</tr>
        </tbody>
      </Table>
      <p className="offspring-rule-note">The fixed personal base is {unitName}'s class-independent level-10 input. The minimum row adds {startingClassName} class bases but no parent inheritance bonus; the game then adds a capped contribution calculated from both parents' personal stats.</p>
      <RecruitmentStatWalkthrough unit={unit} scenario={scenario} />
    </section>
  );
}

function RecruitmentStatWalkthrough({
  unit,
  scenario,
}: {
  unit: UnitRuntime;
  scenario: NonNullable<ReturnType<typeof resolveOffspringScenario>>;
}) {
  const data = unit.offspring!.recruitment;
  const unitName = unit.identity.displayName;
  const fatherName = scenario.father.identity.displayName;
  const motherName = scenario.mother.identity.displayName;
  const [stat, setStat] = useState<keyof StatBlock>("strength");
  const [chapterStart, setChapterStart] = useState(data.levelByStoryPosition[0].chapterStart);
  const [promotionClassId, setPromotionClassId] = useState(data.offspringSeal.promotionOptions[0].classId);
  const milestone = data.levelByStoryPosition.find((entry) => entry.chapterStart === chapterStart) ?? data.levelByStoryPosition[0];
  const promotedLevel = data.offspringSeal.promotedLevelsByChapter[String(chapterStart)];
  const promotion = promotedLevel
    ? data.offspringSeal.promotionOptions.find((option) => option.classId === promotionClassId) ?? data.offspringSeal.promotionOptions[0]
    : undefined;
  const effectiveLevel = promotedLevel ? 20 + promotedLevel : milestone.level;
  const automaticLevels = effectiveLevel - 10;
  const promotedGrowthLevels = promotedLevel ? promotedLevel - 1 : 0;
  const childAptitudes = statBlockFrom((key) => (
    data.level10PersonalBases[key]
    + Math.floor(automaticLevels * (scenario.personalGrowth[key] + data.startingClassGrowthRates[key]) / 100)
  ));
  const promotedClassAptitudes = statBlockFrom((key) => (
    promotion ? roundHalfUp(promotedGrowthLevels * promotion.classGrowthRates[key] / 100) : 0
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
  const fullGrowth = scenario.personalGrowth[stat] + data.startingClassGrowthRates[stat];
  const automaticGrowth = childAptitudes[stat] - personalBase;
  const childAptitude = childAptitudes[stat];
  const promotedClassAptitude = promotedClassAptitudes[stat];
  const inheritanceBenchmark = inheritanceBenchmarks[stat];
  const { fatherSurplus, motherSurplus, quarteredSurplus, inheritanceCap, inheritanceBonus } = calculations[stat];
  const finalStat = finalStats[stat];
  const weaponRankMilestone = promotedLevel
    ? data.offspringSeal.weaponRankMilestones.find((entry) => chapterStart >= entry.chapterStart && chapterStart <= entry.chapterEnd)
    : undefined;
  const learnedPromotedSkills = promotion?.learnedSkills.filter((skill) => skill.level <= promotedLevel) ?? [];
  const classStatProfile = promotion
    ? fe14Data.classStats.find((profile) => profile.classId === promotion.classId)
    : fe14Data.classStats.find((profile) => profile.classId === data.startingClassId);
  const resolvedMaximumStats = classStatProfile ? statBlockFrom((key) => (
    classStatProfile.maximumStats[key] + (key === "hp" ? 0 : scenario.capModifiers[key])
  )) : null;

  function updateParentStat(parent: "father" | "mother", key: keyof StatBlock, value: number) {
    const update = (current: StatBlock) => ({ ...current, [key]: value });
    if (parent === "father") setFatherCurrentStats(update);
    else setMotherCurrentStats(update);
  }

  return (
    <div className="recruitment-walkthrough">
      <div className="recruitment-walkthrough-heading">
        <div>
          <span>Worked example</span>
          <h3>How one recruitment stat is assembled</h3>
        </div>
        <div className="recruitment-walkthrough-controls">
          <Form.Group controlId="offspring-formula-stat">
            <Form.Label>Stat</Form.Label>
            <Form.Select value={stat} onChange={(event) => setStat(event.target.value as keyof StatBlock)}>
              {STAT_KEYS.map((key) => <option key={key} value={key}>{shortStatLabel(key)}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="offspring-formula-chapter">
            <Form.Label>Story position</Form.Label>
            <Form.Select value={chapterStart} onChange={(event) => setChapterStart(Number(event.target.value))}>
              {data.levelByStoryPosition.filter((entry) => entry.chapterStart < data.offspringSeal.availableFromChapter).map((entry) => (
                <option key={entry.chapterStart} value={entry.chapterStart}>
                  Ch. {entry.chapterStart}{entry.chapterEnd && entry.chapterEnd < data.offspringSeal.availableFromChapter && entry.chapterEnd !== entry.chapterStart ? `-${entry.chapterEnd}` : ""} (Lv. {entry.level})
                </option>
              ))}
              {Object.entries(data.offspringSeal.promotedLevelsByChapter).map(([chapter, level]) => (
                <option key={chapter} value={chapter}>Ch. {chapter} (Offspring Seal Lv. {level})</option>
              ))}
            </Form.Select>
          </Form.Group>
          {promotedLevel ? (
            <Form.Group controlId="offspring-formula-promotion">
              <Form.Label>Offspring Seal class</Form.Label>
              <Form.Select value={promotionClassId} onChange={(event) => setPromotionClassId(event.target.value)}>
                {data.offspringSeal.promotionOptions.map((option) => <option key={option.classId} value={option.classId}>{option.displayName}{option.routes ? ` (${formatRoutes(option.routes)})` : ""}</option>)}
              </Form.Select>
            </Form.Group>
          ) : null}
        </div>
      </div>

      {promotion && weaponRankMilestone ? (
        <div className="offspring-seal-result">
          <div><span>Offspring Seal result</span><strong>{promotion.displayName} Lv. {promotedLevel}</strong></div>
          <div><span>Weapon ranks</span><strong>{displayId(promotion.primaryWeaponId)} {weaponRankMilestone.primaryRank}{promotion.secondaryWeaponIds.length ? ` / ${promotion.secondaryWeaponIds.map((weapon) => `${displayId(weapon)} ${weaponRankMilestone.secondaryRank}`).join(" / ")}` : ""}</strong></div>
          <div><span>Promoted skills learned</span><strong>{learnedPromotedSkills.length ? learnedPromotedSkills.map((skill) => skill.displayName).join(", ") : "None yet"}</strong></div>
        </div>
      ) : null}

      {classStatProfile && resolvedMaximumStats ? (
        <div className="offspring-class-cap-profile">
          <div>
            <span>Selected class ceiling</span>
            <h4>{promotion?.displayName ?? classStatProfile.displayName} maximum stats</h4>
            <p>Weapon caps: {Object.entries(classStatProfile.weaponRankCaps).map(([weapon, rank]) => `${displayId(weapon)} ${rank}`).join(" / ")}</p>
          </div>
          <Table responsive>
            <thead><tr><th>Profile</th>{STAT_KEYS.map((key) => <th key={key}>{shortStatLabel(key)}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">Class maximum</th>{STAT_KEYS.map((key) => <td key={key}>{classStatProfile.maximumStats[key]}</td>)}</tr>
              <tr><th scope="row">{unitName} maximum</th>{STAT_KEYS.map((key) => <td key={key}>{resolvedMaximumStats[key]}</td>)}</tr>
            </tbody>
          </Table>
        </div>
      ) : null}

      <div className="parent-stat-snapshots">
        <div>
          <span>Calculator inputs</span>
          <h4>Both parents' complete inheritance stat lines</h4>
          <p><strong>Before stat boosters:</strong> use personal base + level-up gains only. Subtract class bases; exclude permanent stat-booster items, Pair Up, equipment, meals, tonics, and statues. Don't remember how much you feed the parents? SOL. You likely did not miss much: <code>floor(2 + C / 10)</code> clamps the inherited bonus pretty hard.</p>
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

      <div className="recruitment-glossary">
        <p><strong>Automatic-growth gain</strong> is deterministic story catch-up. Because this unit joins above level 10, the game awards the average stat points they would have gained across those missing levels using resolved personal growth plus {displayId(data.startingClassId)} growth: {automaticLevels} levels x {fullGrowth}% = {automaticGrowth} point{automaticGrowth === 1 ? "" : "s"}, after flooring.</p>
        {promotion ? <p><strong>Promoted-class aptitude</strong> is calculated separately: {promotion.displayName}'s {shortStatLabel(stat)} class growth ({promotion.classGrowthRates[stat]}%) x ({promotedLevel} promoted levels - 1) = {promotedClassAptitude}, rounded to the nearest integer with exact halves rounded up. The promotion itself is not a promoted-class growth level.</p> : null}
        <p><strong>Parent current stats</strong> are entered as complete eight-stat snapshots so every {unitName} result updates together. These are the class-independent values used for inheritance: each parent's fixed personal value plus points actually earned through level-ups. Class bases and temporary or external bonuses are not inherited.</p>
        <p><strong>Only surplus counts.</strong> A parent at or below {unitName}'s inheritance benchmark contributes zero. The editable parent values above are illustrative until the planner has parent level-up snapshots.</p>
      </div>
    </div>
  );
}

function initialFactionLabel(faction: "player" | "npc" | "enemy" | "not_deployed") {
  if (faction === "player") return "Playable Character";
  if (faction === "npc") return "NPC";
  if (faction === "not_deployed") return "Not deployed";
  return "Enemy";
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

function ResolvedStats({ scenario }: { scenario: NonNullable<ReturnType<typeof resolveOffspringScenario>> }) {
  return (
    <Table className="stat-table offspring-resolved-table" responsive>
      <thead><tr><th>Stat</th><th>Resolved growth</th><th>Resolved cap</th></tr></thead>
      <tbody>{STAT_KEYS.map((stat) => <tr key={stat}><th scope="row">{shortStatLabel(stat)}</th><td><GrowthBar value={scenario.personalGrowth[stat]} /></td><td>{stat === "hp" ? "-" : formatSigned(scenario.capModifiers[stat])}</td></tr>)}</tbody>
      <tfoot><tr><th>Total</th><td>{Object.values(scenario.personalGrowth).reduce((sum, value) => sum + value, 0)}%</td><td>-</td></tr></tfoot>
    </Table>
  );
}

function ParentGrowthPanel({ name, growth, nestedParentName }: { name: string; growth: StatBlock; nestedParentName?: string }) {
  return (
    <aside className="parent-growth-panel" aria-label={`${name} personal growth rates`}>
      <div><GitBranch aria-hidden="true" size={19} /><span>Other parent</span></div>
      <h3>{name}'s personal growths</h3>
      <dl>{STAT_KEYS.map((stat) => <div key={stat}><dt>{shortStatLabel(stat)}</dt><dd><GrowthBar value={growth[stat]} /></dd></div>)}</dl>
      <p>{nestedParentName ? `${name}'s rates are first resolved with ${nestedParentName}. ` : ""}The displayed offspring rate is the floored average of this value and the unit's child-base rate.</p>
    </aside>
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
