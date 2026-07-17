import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Note } from "../../types";
import IconButton from "./IconButton";
import { formatDateTime } from "./utils";

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
  return (
    <section className="notes-section" aria-labelledby="notes-heading">
      <div className="notes-toolbar">
        <div>
          <p className="eyebrow">Workspace notes</p>
          <h2 id="notes-heading">Notes</h2>
          <span>{notes.length === 1 ? "1 note" : `${notes.length} notes`}</span>
        </div>
        <Button onClick={onNew} disabled={disabled}>
          <Plus aria-hidden="true" size={18} />
          New note
        </Button>
      </div>

      {isLoading ? (
        <div className="inline-loading" aria-live="polite">
          <Spinner animation="border" size="sm" role="status" />
          Loading notes
        </div>
      ) : notes.length === 0 ? (
        <div className="notes-empty-state">
          <h3>No notes yet</h3>
          <p>Keep route ideas, build thoughts, and source checks in this workspace.</p>
          <Button onClick={onNew} disabled={disabled}>
            <Plus aria-hidden="true" size={18} />
            Create first note
          </Button>
        </div>
      ) : (
        <ListGroup className="note-list">
          {notes.map((note) => (
            <ListGroup.Item key={note.id} className="note-list-item">
              <div className="note-copy">
                <h3>{note.title}</h3>
                <p>{note.content}</p>
                <span>Updated {formatDateTime(note.updatedAt)}</span>
              </div>
              <div className="note-actions">
                <IconButton label={`Edit ${note.title}`} onClick={() => onEdit(note)}>
                  <Pencil aria-hidden="true" size={18} />
                </IconButton>
                <IconButton label={`Delete ${note.title}`} variant="outline-danger" onClick={() => onDelete(note)}>
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
