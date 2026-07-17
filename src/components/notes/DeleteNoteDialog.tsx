import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import type { Note } from "../../types";

export default function DeleteNoteDialog({
  isSaving,
  note,
  onConfirm,
  onHide,
}: {
  isSaving: boolean;
  note: Note | null;
  onConfirm: () => void;
  onHide: () => void;
}) {
  return (
    <Modal show={note !== null} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>Delete note?</Modal.Title></Modal.Header>
      <Modal.Body>
        <p>Delete <strong>{note?.title}</strong>? This cannot be undone unless you restore a backup.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={isSaving}>Delete note</Button>
      </Modal.Footer>
    </Modal>
  );
}
