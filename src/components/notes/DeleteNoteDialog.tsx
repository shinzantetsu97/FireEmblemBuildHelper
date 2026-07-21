import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import type { Note } from "../../types";
import { useLocale } from "../../i18n/LocaleContext";

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
  const { t } = useLocale();
  return (
    <Modal show={note !== null} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>{t("notes.delete.title")}</Modal.Title></Modal.Header>
      <Modal.Body>
        <p>{t("notes.delete.bodyPrefix")}<strong>{note?.title}</strong>{t("notes.delete.bodySuffix")}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>{t("common.cancel")}</Button>
        <Button variant="danger" onClick={onConfirm} disabled={isSaving}>{t("notes.delete.confirm")}</Button>
      </Modal.Footer>
    </Modal>
  );
}
