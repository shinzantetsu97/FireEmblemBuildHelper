export default function SectionHeading({ eyebrow, id, title }: { eyebrow?: string; id: string; title: string }) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
    </div>
  );
}
