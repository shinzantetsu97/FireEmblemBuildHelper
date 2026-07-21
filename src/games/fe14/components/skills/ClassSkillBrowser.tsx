import { useEffect, useId, useMemo, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { CheckCheck, ChevronDown, ChevronRight, Search, Square } from "lucide-react";
import {
  classNames,
  type ClassAffiliation,
  type ClassSkill,
  type ClassSkillAcquisition,
  type ClassSkillIndexEntry,
  type EnrichedClassTree,
} from "../../data";
import { getClassSkillIconUrl } from "../../skillAssets";
import { useLocale } from "../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../i18n/messages/en";
import SkillEffectText from "./SkillEffectText";

type FactionFilter = "all" | "hoshidan" | "nohrian" | "special";

export interface ClassSkillBrowserProps {
  availableClassIds: ReadonlySet<string>;
  classTrees: EnrichedClassTree[];
  classSkills: ClassSkill[];
  skillsByClass: Record<string, ClassSkillIndexEntry[]>;
  scope: "directory" | "unit-profile";
  // Per-class display-label overrides (e.g. merging gendered duplicates on the
  // directory) that do not affect the shared class-name data.
  labelOverrides?: Record<string, { en: string; zhHans?: string }>;
}

const FACTION_OPTIONS: Array<{ id: FactionFilter; labelKey: MessageKey }> = [
  { id: "all", labelKey: "class.affiliation.all" },
  { id: "hoshidan", labelKey: "class.affiliation.hoshidan" },
  { id: "nohrian", labelKey: "class.affiliation.nohrian" },
  { id: "special", labelKey: "class.affiliation.special" },
];

const AFFILIATION_BADGE_KEYS: Record<ClassAffiliation, MessageKey> = {
  hoshidan: "class.affiliationBadge.hoshidan",
  nohrian: "class.affiliationBadge.nohrian",
  special: "class.affiliationBadge.special",
};

export default function ClassSkillBrowser({
  availableClassIds,
  classTrees,
  classSkills,
  skillsByClass,
  scope,
  labelOverrides,
}: ClassSkillBrowserProps) {
  const instanceId = useId();
  const { resolve, t } = useLocale();
  const labelBag = (classId: string, en: string, zh?: string) =>
    labelOverrides?.[classId] ?? classNames(classId) ?? { en, zhHans: zh };
  const classLabel = (classId: string, en: string, zh?: string) => resolve(labelBag(classId, en, zh), en);
  const observedClassIds = useRef(new Set(availableClassIds));
  const [faction, setFaction] = useState<FactionFilter>("all");
  const [skillSearch, setSkillSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [checkedClassIds, setCheckedClassIds] = useState(() => new Set(availableClassIds));
  const [expandedTreeIds, setExpandedTreeIds] = useState(() => new Set(
    classTrees.filter((tree) => tree.promotions.length > 0).map((tree) => tree.id),
  ));

  useEffect(() => {
    const newlyAvailable = [...availableClassIds].filter((classId) => !observedClassIds.current.has(classId));
    newlyAvailable.forEach((classId) => observedClassIds.current.add(classId));
    if (newlyAvailable.length > 0) {
      setCheckedClassIds((current) => new Set([...current, ...newlyAvailable]));
    }
  }, [availableClassIds]);

  const classLabels = useMemo(() => new Map(
    classTrees.flatMap((tree) => [
      [tree.id, classLabel(tree.id, tree.label, tree.labelZhHans)] as const,
      ...tree.promotions.map((promotion) => [promotion.id, classLabel(promotion.id, promotion.label, promotion.labelZhHans)] as const),
    ]),
  ), [classTrees, resolve, labelOverrides]);
  const skillLookup = useMemo(() => new Map(classSkills.map((skill) => [skill.id, skill])), [classSkills]);
  const visibleTrees = useMemo(() => classTrees.flatMap((tree) => {
    const specialTree = tree.categories?.includes("special") ?? false;
    const rootSelectable = availableClassIds.has(tree.id) && matchesClassFilter(tree.affiliation, faction, specialTree);
    const promotions = tree.promotions.filter((promotion) => (
      availableClassIds.has(promotion.id) && matchesClassFilter(promotion.affiliation, faction, specialTree)
    ));
    const searchableClasses = [
      ...(rootSelectable ? [{ id: tree.id, ...toEnZh(labelBag(tree.id, tree.label, tree.labelZhHans)) }] : []),
      ...promotions.map((promotion) => ({ id: promotion.id, ...toEnZh(labelBag(promotion.id, promotion.label, promotion.labelZhHans)) })),
    ];
    const matchesClassSearch = !classSearch.trim()
      || searchableClasses.some((classNode) => matchesLocalizedName(classNode.en, classNode.zh, classSearch));
    const matchesSkillSearch = !skillSearch.trim()
      || searchableClasses.some((classNode) => (skillsByClass[classNode.id] ?? []).some((edge) => {
        const skill = skillLookup.get(edge.skillId);
        return skill ? matchesLocalizedName(skill.names.en, skill.names.zhHans, skillSearch) : false;
      }));

    return searchableClasses.length > 0 && matchesClassSearch && matchesSkillSearch
      ? [{ tree, rootSelectable, promotions }]
      : [];
  }), [availableClassIds, classSearch, classTrees, faction, skillLookup, skillSearch, skillsByClass]);

  const visibleClassIds = [...new Set(visibleTrees.flatMap(({ tree, rootSelectable, promotions }) => [
    ...(rootSelectable ? [tree.id] : []),
    ...promotions.map((promotion) => promotion.id),
  ]))];
  const selectedClassIds = visibleClassIds.filter((classId) => checkedClassIds.has(classId));
  const allVisibleSelected = visibleClassIds.length > 0
    && visibleClassIds.every((classId) => checkedClassIds.has(classId));
  const visibleSkills = collectVisibleSkills(selectedClassIds, skillsByClass, skillLookup);

  function toggleClass(classId: string) {
    setCheckedClassIds((current) => {
      const next = new Set(current);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  function toggleTree(treeId: string) {
    setExpandedTreeIds((current) => {
      const next = new Set(current);
      if (next.has(treeId)) next.delete(treeId);
      else next.add(treeId);
      return next;
    });
  }

  function setClassesSelected(classIds: string[], selected: boolean) {
    setCheckedClassIds((current) => {
      const next = new Set(current);
      classIds.forEach((classId) => {
        if (selected) next.add(classId);
        else next.delete(classId);
      });
      return next;
    });
  }

  return (
    <section
      className={`class-skill-browser class-skill-browser-${scope}`}
      aria-label={scope === "directory" ? t("class.browser.ariaDirectory") : t("class.browser.ariaUnitProfile")}
    >
      <div className="class-skill-browser-toolbar">
        <div className="class-skill-browser-filters">
          <ButtonGroup aria-label={t("class.affiliation.aria")}>
            {FACTION_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={faction === option.id ? "dark" : "outline-secondary"}
                aria-pressed={faction === option.id}
                onClick={() => setFaction(option.id)}
              >
                {t(option.labelKey)}
              </Button>
            ))}
          </ButtonGroup>
          <label className="class-skill-search-control">
            <Search aria-hidden="true" size={15} />
            <span>{t("search.skill")}</span>
            <input
              type="search"
              value={skillSearch}
              aria-label={t("search.skillNames.aria")}
              onChange={(event) => setSkillSearch(event.target.value)}
            />
          </label>
          <label className="class-skill-search-control">
            <Search aria-hidden="true" size={15} />
            <span>{t("search.class")}</span>
            <input
              type="search"
              value={classSearch}
              aria-label={t("search.class.aria")}
              onChange={(event) => setClassSearch(event.target.value)}
            />
          </label>
        </div>
        <span>{t("class.browser.count", { classes: selectedClassIds.length, skills: visibleSkills.length })}</span>
      </div>

      <div className="class-skill-tree" aria-label={t("class.browser.treeAria")}>
        <div className="class-skill-tree-actions">
          <Button
            type="button"
            size="sm"
            variant="outline-secondary"
            onClick={() => setClassesSelected(visibleClassIds, true)}
            disabled={visibleClassIds.length === 0 || allVisibleSelected}
          >
            <CheckCheck aria-hidden="true" size={15} />
            {t("common.selectAll")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline-secondary"
            onClick={() => setClassesSelected(visibleClassIds, false)}
            disabled={visibleClassIds.length === 0 || selectedClassIds.length === 0}
          >
            <Square aria-hidden="true" size={14} />
            {t("common.deselectAll")}
          </Button>
        </div>
        {visibleTrees.map(({ tree, rootSelectable, promotions }) => {
          const expanded = expandedTreeIds.has(tree.id);
          const hasPromotions = promotions.length > 0;
          const treeClassIds = [
            ...(rootSelectable ? [tree.id] : []),
            ...promotions.map((promotion) => promotion.id),
          ];
          const selectedTreeClassCount = treeClassIds.filter((classId) => checkedClassIds.has(classId)).length;
          const allTreeClassesSelected = selectedTreeClassCount === treeClassIds.length;
          return (
            <div className="class-skill-tree-group" key={tree.id}>
              <div className="class-skill-tree-group-header">
                <TreeSelectionCheckbox
                  allSelected={allTreeClassesSelected}
                  label={classLabel(tree.id, tree.label, tree.labelZhHans)}
                  partiallySelected={selectedTreeClassCount > 0 && !allTreeClassesSelected}
                  onChange={() => setClassesSelected(treeClassIds, !allTreeClassesSelected)}
                />
                <ClassRow
                  affiliation={tree.affiliation}
                  checked={checkedClassIds.has(tree.id)}
                  classId={tree.id}
                  contextOnly={!rootSelectable}
                  controlId={`${instanceId}-${tree.id}`}
                  expanded={hasPromotions ? expanded : undefined}
                  label={classLabel(tree.id, tree.label, tree.labelZhHans)}
                  onDisclosure={hasPromotions ? () => toggleTree(tree.id) : undefined}
                  onToggle={() => toggleClass(tree.id)}
                />
              </div>
              {hasPromotions && expanded ? (
                <div className="class-skill-tree-children" id={`${instanceId}-${tree.id}-promotions`}>
                  {promotions.map((promotion) => (
                    <ClassRow
                      key={promotion.id}
                      affiliation={promotion.affiliation}
                      checked={checkedClassIds.has(promotion.id)}
                      classId={promotion.id}
                      controlId={`${instanceId}-${tree.id}-${promotion.id}`}
                      label={classLabel(promotion.id, promotion.label, promotion.labelZhHans)}
                      onToggle={() => toggleClass(promotion.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {visibleTrees.length === 0 ? <p className="class-skill-tree-empty">{t("class.browser.noTrees")}</p> : null}
      </div>

      <div className="class-skill-results" aria-live="polite">
        {visibleSkills.length > 0 ? visibleSkills.map(({ skill, acquisition }) => (
          <article className="class-skill-result" key={skill.id}>
            <img
              className="class-skill-icon"
              src={getClassSkillIconUrl(skill.iconAssetId)}
              alt=""
              width={24}
              height={24}
            />
            <div className="class-skill-result-copy">
              <strong>{resolve(skill.names, skill.names.en)}</strong>
              <p><SkillEffectText en={skill.description} zhHans={skill.descriptionZhHans} /></p>
              {skill.notes?.map((note, index) => <small key={note}>{resolve({ en: note, zhHans: skill.notesZhHans?.[index] })}</small>)}
              <div className="class-skill-acquisitions">
                {acquisition.map((edge) => (
                  <span key={`${edge.classId}-${edge.level}-${edge.gender ?? "all"}`}>
                    {classLabels.get(edge.classId) ?? edge.classId} · Lv. {edge.level}
                    {edge.gender ? ` · ${capitalize(edge.gender)} only` : ""}
                  </span>
                ))}
              </div>
            </div>
          </article>
        )) : (
          <p className="class-skill-empty">{t("class.browser.noneSelected")}</p>
        )}
      </div>
    </section>
  );
}

function TreeSelectionCheckbox({
  allSelected,
  label,
  partiallySelected,
  onChange,
}: {
  allSelected: boolean;
  label: string;
  partiallySelected: boolean;
  onChange: () => void;
}) {
  return (
    <input
      className="class-skill-tree-checkbox"
      type="checkbox"
      checked={allSelected}
      aria-label={`${allSelected ? "Deselect" : "Select"} ${label} class tree`}
      ref={(input) => {
        if (input) input.indeterminate = partiallySelected;
      }}
      onChange={onChange}
    />
  );
}

function ClassRow({
  affiliation,
  checked,
  classId,
  contextOnly = false,
  controlId,
  expanded,
  label,
  onDisclosure,
  onToggle,
}: {
  affiliation: ClassAffiliation;
  checked: boolean;
  classId: string;
  contextOnly?: boolean;
  controlId: string;
  expanded?: boolean;
  label: string;
  onDisclosure?: () => void;
  onToggle: () => void;
}) {
  const { t } = useLocale();
  const childContainerId = `${controlId}-promotions`;
  return (
    <div className={`class-skill-class-row${contextOnly ? " is-context-only" : ""}`} data-class-id={classId}>
      {onDisclosure ? (
        <button
          type="button"
          className="class-skill-disclosure"
          aria-label={t(expanded ? "class.collapsePromotions" : "class.expandPromotions", { label })}
          aria-controls={childContainerId}
          aria-expanded={expanded}
          title={t(expanded ? "class.collapsePromotions" : "class.expandPromotions", { label })}
          onClick={onDisclosure}
        >
          {expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
        </button>
      ) : <span className="class-skill-disclosure-spacer" />}
      {contextOnly ? (
        <span className="class-skill-context-label">{label}</span>
      ) : (
        <>
          <input
            id={controlId}
            type="checkbox"
            checked={checked}
            onChange={onToggle}
          />
          <label htmlFor={controlId}>{label}</label>
          <span className={`class-affiliation class-affiliation-${affiliation}`}>
            {t(AFFILIATION_BADGE_KEYS[affiliation])}
          </span>
        </>
      )}
    </div>
  );
}

function collectVisibleSkills(
  classIds: string[],
  skillsByClass: Record<string, ClassSkillIndexEntry[]>,
  skillLookup: ReadonlyMap<string, ClassSkill>,
): Array<{ skill: ClassSkill; acquisition: ClassSkillAcquisition[] }> {
  const selectedSkills = new Map<string, { skill: ClassSkill; acquisition: ClassSkillAcquisition[] }>();
  classIds.forEach((classId) => {
    (skillsByClass[classId] ?? []).forEach((edge) => {
      const skill = skillLookup.get(edge.skillId);
      if (!skill) return;
      const result = selectedSkills.get(skill.id) ?? { skill, acquisition: [] };
      result.acquisition.push({ classId, level: edge.level, ...(edge.gender ? { gender: edge.gender } : {}) });
      selectedSkills.set(skill.id, result);
    });
  });
  return [...selectedSkills.values()];
}

function matchesClassFilter(
  affiliation: ClassAffiliation,
  faction: FactionFilter,
  specialTree: boolean,
): boolean {
  if (faction === "all") return true;
  if (faction === "special") return specialTree;
  return affiliation === faction;
}

function toEnZh(bag: { en: string; zhHans?: string }): { en: string; zh: string | undefined } {
  return { en: bag.en, zh: bag.zhHans };
}

// Matches an English name (word-based) or a Simplified-Chinese name (substring,
// so CJK queries work) against the query.
function matchesLocalizedName(en: string, zh: string | undefined, query: string): boolean {
  if (matchesNameSearch(en, query)) return true;
  const trimmed = query.trim().toLocaleLowerCase();
  return Boolean(zh && trimmed && zh.toLocaleLowerCase().includes(trimmed));
}

function matchesNameSearch(name: string, query: string): boolean {
  const nameWords = normalizeWords(name);
  const queryWords = normalizeWords(query);
  return queryWords.length === 0
    || queryWords.every((queryWord) => nameWords.some((nameWord) => nameWord.includes(queryWord)));
}

function normalizeWords(value: string): string[] {
  return value.toLocaleLowerCase().match(/[a-z0-9+]+/g) ?? [];
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
