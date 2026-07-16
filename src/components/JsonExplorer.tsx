export default function JsonExplorer({ value, label }: { value: unknown; label: string }) {
  return (
    <div className="json-explorer" aria-label={label}>
      <JsonNode value={value} depth={0} />
    </div>
  );
}

function JsonNode({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  if (value === null || typeof value !== "object") {
    return (
      <div className="json-leaf">
        {name === undefined ? null : <span className="json-key">{name}: </span>}
        <JsonPrimitive value={value} />
      </div>
    );
  }

  const entries = Object.entries(value);
  const collectionLabel = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`;

  return (
    <details className="json-branch" open={depth < 2}>
      <summary>
        {name === undefined ? null : <span className="json-key">{name} </span>}
        <span className="json-count">{collectionLabel}</span>
      </summary>
      <div className="json-children">
        {entries.map(([key, child]) => (
          <JsonNode key={key} name={key} value={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}

function JsonPrimitive({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return <span className="json-string">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number") {
    return <span className="json-number">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="json-boolean">{String(value)}</span>;
  }
  return <span className="json-null">null</span>;
}
