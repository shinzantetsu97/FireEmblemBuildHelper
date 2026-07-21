import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fe14Data } from "../../data";
import SectionHeading from "../units/detail/SectionHeading";
import { type SealGrantPreviews } from "../units/detail/SupportDirectory";
import UnitClassSkillCards, { type UnitClassSkillCard } from "./UnitClassSkillCards";
import { useLocale } from "../../../../i18n/LocaleContext";

export interface ClassSkillSource {
  label: string;
  classIds: Array<string | null | undefined>;
}

export default function UnitClassSkills({
  gender,
  initialCardLimit,
  prioritizePartnerSeal = false,
  sources,
  selectedSealPreviews,
}: {
  gender?: "male" | "female";
  initialCardLimit?: number;
  prioritizePartnerSeal?: boolean;
  sources: ClassSkillSource[];
  selectedSealPreviews: SealGrantPreviews;
}) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);
  const intrinsicSources = sources.map((source) => ({
      ...source,
      classIds: source.classIds.filter((classId): classId is string => Boolean(classId) && classId !== "avatar_talent"),
    })).filter((source) => source.classIds.length > 0);
  const previewSources = (["friendship", "partner"] as const).reduce((result, seal) => {
    const preview = selectedSealPreviews[seal];
    if (preview && preview.grantedClassId !== "avatar_talent") {
      result[seal] = {
        label: seal === "friendship"
          ? t("skills.source.friendship", { name: preview.partnerName })
          : t("skills.source.partner", { name: preview.partnerName }),
        classIds: [preview.grantedClassId],
      };
    }
    return result;
  }, {} as Partial<Record<"friendship" | "partner", { label: string; classIds: string[] }>>);
  const resolvedSources = prioritizePartnerSeal ? [
    ...intrinsicSources.slice(0, 2),
    ...(previewSources.partner ? [previewSources.partner] : []),
    ...intrinsicSources.slice(2),
    ...(previewSources.friendship ? [previewSources.friendship] : []),
  ] : [
    ...intrinsicSources,
    ...(previewSources.friendship ? [previewSources.friendship] : []),
    ...(previewSources.partner ? [previewSources.partner] : []),
  ];
  const cards = buildClassSkillCards(resolvedSources);
  const hasCardOverflow = initialCardLimit !== undefined && cards.length > initialCardLimit;
  const visibleCards = hasCardOverflow && !showAll ? cards.slice(0, initialCardLimit) : cards;

  return (
    <section className="data-section unit-class-skills" aria-labelledby="accessible-class-skills-heading">
      <SectionHeading title={t("skills.build.title")} id="accessible-class-skills-heading" />
      <UnitClassSkillCards cards={visibleCards} gender={gender} skills={fe14Data.classSkills} />
      {hasCardOverflow ? (
        <button className="unit-class-skill-expand" type="button" onClick={() => setShowAll((current) => !current)}>
          {showAll ? <ChevronUp aria-hidden="true" size={17} /> : <ChevronDown aria-hidden="true" size={17} />}
          {showAll ? t("skills.showFirst", { count: initialCardLimit ?? 0 }) : t("skills.showAll", { count: cards.length })}
        </button>
      ) : null}
    </section>
  );
}

function buildClassSkillCards(sources: Array<{ label: string; classIds: string[] }>): UnitClassSkillCard[] {
  const sourcesByClassId = new Map<string, string[]>();
  sources.forEach((source) => source.classIds.forEach((classId) => {
    const labels = sourcesByClassId.get(classId) ?? [];
    if (!labels.includes(source.label)) labels.push(source.label);
    sourcesByClassId.set(classId, labels);
  }));

  return Array.from(sourcesByClassId, ([classId, sourceLabels]) => {
    const tree = fe14Data.classDirectory.find((candidate) => candidate.id === classId);
    return tree ? { sources: sourceLabels, tree } : null;
  }).filter((card): card is UnitClassSkillCard => card !== null);
}
