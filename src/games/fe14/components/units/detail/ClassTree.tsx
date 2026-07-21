import { classNames, displayId, fe14Data } from "../../../data";
import { useLocale } from "../../../../../i18n/LocaleContext";

export function ClassTreeList({ classIds }: { classIds: string[] }) {
  return classIds.map((classId, index) => (
    <span key={classId}>
      {index > 0 ? ", " : null}
      <ClassTreeLabel classId={classId} />
    </span>
  ));
}

export function ClassTreeLabel({ classId, labelOverride }: { classId: string; labelOverride?: string }) {
  const { t, resolve, locale } = useLocale();
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const label = labelOverride ?? resolve(classNames(classId), displayId(classId));
  if (!classTree) return <>{label}</>;

  const promotions = classTree.promotions
    .map((promotion) => resolve(classNames(promotion.id), promotion.label))
    .join(locale === "zhHans" ? "、" : " or ");
  return (
    <span className="class-tree-label" tabIndex={0} title={t("class.promotesTo", { label, promotions })}>
      {label}
    </span>
  );
}
