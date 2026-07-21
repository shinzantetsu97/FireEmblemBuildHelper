import Form from "react-bootstrap/Form";
import type { Workspace } from "../../types";
import { useLocale } from "../../i18n/LocaleContext";

export default function WorkspaceHeader({
  activeWorkspace,
  disabled,
  onChange,
  workspaces,
}: {
  activeWorkspace: Workspace | null;
  disabled: boolean;
  onChange: (workspaceId: string) => void;
  workspaces: Workspace[];
}) {
  const { t } = useLocale();
  return (
    <section className="workspace-heading" aria-labelledby="workspace-heading">
      <div>
        <p className="eyebrow">{t("notes.workspace.eyebrow")}</p>
        <h1 id="workspace-heading">{activeWorkspace?.name ?? t("notes.workspace.fallbackName")}</h1>
      </div>
      <Form.Group className="workspace-picker" controlId="workspace-picker">
        <Form.Label>{t("notes.workspace.label")}</Form.Label>
        <Form.Select
          value={activeWorkspace?.id ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </Form.Select>
      </Form.Group>
    </section>
  );
}
