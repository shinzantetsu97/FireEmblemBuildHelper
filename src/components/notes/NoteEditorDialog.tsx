import type { FormEvent } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import type { Note } from "../../types";
import type { NoteDraft } from "./types";
import { useLocale } from "../../i18n/LocaleContext";

export default function NoteEditorDialog({
  draft,
  editingNote,
  error,
  isSaving,
  onDraftChange,
  onHide,
  onSubmit,
  show,
}: {
  draft: NoteDraft;
  editingNote: Note | null;
  error: string | null;
  isSaving: boolean;
  onDraftChange: (draft: NoteDraft) => void;
  onHide: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  show: boolean;
}) {
  const { t } = useLocale();
  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editingNote ? t("notes.editor.editTitle") : t("notes.editor.newTitle")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group className="mb-3" controlId="note-title">
            <Form.Label>{t("notes.editor.title")}</Form.Label>
            <Form.Control
              autoFocus
              maxLength={120}
              onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
              required
              value={draft.title}
            />
          </Form.Group>
          <Form.Group controlId="note-content">
            <Form.Label>{t("notes.editor.content")}</Form.Label>
            <Form.Control
              as="textarea"
              maxLength={10_000}
              onChange={(event) => onDraftChange({ ...draft, content: event.target.value })}
              required
              rows={9}
              value={draft.content}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>{t("common.cancel")}</Button>
          <Button type="submit" disabled={isSaving || !draft.title.trim() || !draft.content.trim()}>
            {isSaving ? t("notes.editor.saving") : t("notes.editor.save")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
