import { useMemo } from "react";
import { fe14Data, type SourceRef, type UnitRuntime } from "../../../data";
import { useLocale } from "../../../../../i18n/LocaleContext";

export default function UnitReferences({ unit }: { unit: UnitRuntime }) {
  const { t } = useLocale();
  return (
    <section className="unit-references" aria-labelledby="sources-heading">
      <h2 id="sources-heading">{t("unit.references")}</h2>
      <SourceList unit={unit} />
    </section>
  );
}

function SourceList({ unit }: { unit: UnitRuntime }) {
  const sourceIds = useMemo(() => new Set(collectSourceRefs(unit).map((ref) => ref.sourceId)), [unit]);
  const sources = fe14Data.sources.filter((source) => sourceIds.has(source.id));
  return (
    <ol className="source-list">
      {sources.map((source) => (
        <li key={source.id}>
          {source.location.startsWith("http") ? (
            <a href={source.location} target="_blank" rel="noreferrer">{source.title}</a>
          ) : (
            <span>{source.title}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function collectSourceRefs(value: unknown): SourceRef[] {
  if (Array.isArray(value)) return value.flatMap(collectSourceRefs);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const current = typeof record.sourceId === "string" ? [record as unknown as SourceRef] : [];
  return current.concat(Object.values(record).flatMap(collectSourceRefs));
}
