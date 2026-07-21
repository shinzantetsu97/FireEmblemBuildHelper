import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Note } from "../../types";
import IconButton from "./IconButton";
import { formatDateTime } from "./utils";
import { useLocale } from "../../i18n/LocaleContext";

export default function NotesList({
  disabled,
  isLoading,
  notes,
  onDelete,
  onEdit,
  onNew,
}: {
  disabled: boolean;
  isLoading: boolean;
  notes: Note[];
  onDelete: (note: Note) => void;
  onEdit: (note: Note) => void;
  onNew: () => void;
}) {
  const { t } = useLocale();
  return (
    <section className="notes-section" aria-labelledby="notes-heading">
      <div className="notes-toolbar">
        <div>
          <p className="eyebrow">{t("notes.list.eyebrow")}</p>
          <h2 id="notes-heading">{t("nav.notes")}</h2>
          <span>{notes.length === 1 ? t("notes.list.countOne") : t("notes.list.countOther", { count: notes.length })}</span>
        </div>
        <Button onClick={onNew} disabled={disabled}>
          <Plus aria-hidden="true" size={18} />
          {t("notes.list.new")}
        </Button>
      </div>

      {isLoading ? (
        <div className="inline-loading" aria-live="polite">
          <Spinner animation="border" size="sm" role="status" />
          {t("notes.list.loading")}
        </div>
      ) : notes.length === 0 ? (
        <div className="notes-empty-state">
          <h3>{t("notes.list.emptyTitle")}</h3>
          <p>{t("notes.list.emptyBody")}</p>
          <Button onClick={onNew} disabled={disabled}>
            <Plus aria-hidden="true" size={18} />
            {t("notes.list.createFirst")}
          </Button>
        </div>
      ) : (
        <ListGroup className="note-list">
          {notes.map((note) => (
            <ListGroup.Item key={note.id} className="note-list-item">
              <div className="note-copy">
                <h3>{note.title}</h3>
                <p>{note.content}</p>
                <span>{t("notes.list.updated", { date: formatDateTime(note.updatedAt) })}</span>
              </div>
              <div className="note-actions">
                <IconButton label={t("notes.list.editAria", { title: note.title })} onClick={() => onEdit(note)}>
                  <Pencil aria-hidden="true" size={18} />
                </IconButton>
                <IconButton label={t("notes.list.deleteAria", { title: note.title })} variant="outline-danger" onClick={() => onDelete(note)}>
                  <Trash2 aria-hidden="true" size={18} />
                </IconButton>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </section>
  );
}
