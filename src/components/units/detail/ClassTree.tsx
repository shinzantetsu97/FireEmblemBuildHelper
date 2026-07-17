import { displayId, fe14Data } from "../../../data/fe14";

export function ClassTreeList({ classIds }: { classIds: string[] }) {
  return classIds.map((classId, index) => (
    <span key={classId}>
      {index > 0 ? ", " : null}
      <ClassTreeLabel classId={classId} />
    </span>
  ));
}

export function ClassTreeLabel({ classId, labelOverride }: { classId: string; labelOverride?: string }) {
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const label = labelOverride ?? displayId(classId);
  if (!classTree) return <>{label}</>;

  const promotions = classTree.promotions.map((promotion) => promotion.label).join(" or ");
  return (
    <span className="class-tree-label" tabIndex={0} title={`${label} promotes to ${promotions}.`}>
      {label}
    </span>
  );
}
