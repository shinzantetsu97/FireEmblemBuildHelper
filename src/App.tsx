import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import Navbar from "react-bootstrap/Navbar";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Spinner from "react-bootstrap/Spinner";
import Tooltip from "react-bootstrap/Tooltip";
import {
  Download,
  FileText,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createNote,
  createWorkspaceBackup,
  deleteNote,
  ensureDefaultWorkspace,
  formatWorkspaceTextExport,
  importWorkspaceBackup,
  listNotes,
  listWorkspaces,
  markWorkspaceExported,
  updateNote,
} from "./storage";
import type { Note, Workspace } from "./types";

type NoteDraft = Pick<Note, "title" | "content">;

const EMPTY_DRAFT: NoteDraft = { title: "", content: "" };

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [notePendingDeletion, setNotePendingDeletion] = useState<Note | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void initializeWorkspace();
  }, []);

  async function initializeWorkspace(): Promise<void> {
    try {
      const defaultWorkspace = await ensureDefaultWorkspace();
      await loadWorkspace(defaultWorkspace.id);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      setIsLoading(false);
    }
  }

  async function loadWorkspace(workspaceId: string): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const [availableWorkspaces, workspaceNotes] = await Promise.all([
        listWorkspaces(),
        listNotes(workspaceId),
      ]);
      const workspace = availableWorkspaces.find((item) => item.id === workspaceId);

      if (!workspace) {
        throw new Error("The selected workspace could not be found.");
      }

      setWorkspaces(availableWorkspaces);
      setActiveWorkspace(workspace);
      setNotes(workspaceNotes);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  function openNewNoteEditor(): void {
    setEditingNote(null);
    setDraft(EMPTY_DRAFT);
    setEditorError(null);
    setIsEditorOpen(true);
  }

  function openEditNoteEditor(note: Note): void {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setEditorError(null);
    setIsEditorOpen(true);
  }

  async function saveNote(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!activeWorkspace || !draft.title.trim() || !draft.content.trim()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingNote) {
        await updateNote(editingNote, draft);
      } else {
        await createNote(activeWorkspace.id, draft);
      }

      setIsEditorOpen(false);
      await loadWorkspace(activeWorkspace.id);
    } catch (caughtError) {
      setEditorError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteNote(): Promise<void> {
    if (!notePendingDeletion || !activeWorkspace) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteNote(notePendingDeletion);
      setNotePendingDeletion(null);
      await loadWorkspace(activeWorkspace.id);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function exportJsonBackup(): Promise<void> {
    if (!activeWorkspace) {
      return;
    }

    setError(null);

    try {
      const backup = await createWorkspaceBackup(activeWorkspace.id);
      downloadFile(
        JSON.stringify(backup, null, 2),
        "fire-emblem-build-helper-backup.json",
        "application/json",
      );
      const updatedWorkspace = await markWorkspaceExported(activeWorkspace.id);

      setActiveWorkspace(updatedWorkspace);
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace,
        ),
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  async function exportTextSummary(): Promise<void> {
    if (!activeWorkspace) {
      return;
    }

    setError(null);

    try {
      const backup = await createWorkspaceBackup(activeWorkspace.id);
      downloadFile(
        formatWorkspaceTextExport(backup),
        "fire-emblem-build-helper-notes.txt",
        "text/plain;charset=utf-8",
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  async function importJsonBackup(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const restoredWorkspace = await importWorkspaceBackup(
        parseJsonBackup(await readFileAsText(file)),
      );
      await loadWorkspace(restoredWorkspace.id);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && !activeWorkspace) {
    return (
      <main className="loading-screen" aria-live="polite">
        <Spinner animation="border" role="status" />
        <span>Loading workspace</span>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Navbar className="app-header" expand="md">
        <Container fluid="lg">
          <Navbar.Brand className="app-brand">FireEmblemBuildHelper</Navbar.Brand>
          <span className="app-section-label">Notes workspace</span>
        </Container>
      </Navbar>

      <main>
        <Container className="workspace-main" fluid="lg">
          {error ? (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          ) : null}

          <section className="workspace-heading" aria-labelledby="workspace-heading">
            <div>
              <p className="eyebrow">Local workspace</p>
              <h1 id="workspace-heading">{activeWorkspace?.name ?? "Workspace"}</h1>
            </div>
            <Form.Group className="workspace-picker" controlId="workspace-picker">
              <Form.Label>Workspace</Form.Label>
              <Form.Select
                value={activeWorkspace?.id ?? ""}
                onChange={(event) => void loadWorkspace(event.target.value)}
                disabled={isLoading}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </section>

          <Alert className="data-warning" variant="warning">
            <div className="warning-copy">
              <ShieldAlert aria-hidden="true" size={22} />
              <div>
                <strong>Back up this browser-local workspace.</strong>
                <p>
                  Clearing site data, using private browsing, or switching browsers or devices can
                  remove your notes. JSON backups restore data; text summaries are for reading.
                </p>
                {activeWorkspace?.lastExportedAt ? (
                  <span>Last JSON backup: {formatDateTime(activeWorkspace.lastExportedAt)}</span>
                ) : (
                  <span>No JSON backup recorded yet.</span>
                )}
              </div>
            </div>
            <div className="warning-actions">
              <Button variant="dark" size="sm" onClick={() => void exportJsonBackup()}>
                <Download aria-hidden="true" size={16} />
                Backup JSON
              </Button>
              <Button variant="outline-dark" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload aria-hidden="true" size={16} />
                Restore backup
              </Button>
              <IconButton label="Download readable text summary" onClick={() => void exportTextSummary()}>
                <FileText aria-hidden="true" size={18} />
              </IconButton>
              <input
                ref={fileInputRef}
                accept="application/json,.json"
                aria-label="Choose JSON backup file"
                className="visually-hidden"
                type="file"
                onChange={(event) => void importJsonBackup(event)}
              />
            </div>
          </Alert>

          <section className="notes-section" aria-labelledby="notes-heading">
            <div className="notes-toolbar">
              <div>
                <p className="eyebrow">Workspace notes</p>
                <h2 id="notes-heading">Notes</h2>
                <span>{notes.length === 1 ? "1 note" : `${notes.length} notes`}</span>
              </div>
              <Button onClick={openNewNoteEditor} disabled={!activeWorkspace || isSaving}>
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
                <Button onClick={openNewNoteEditor} disabled={!activeWorkspace || isSaving}>
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
                      <IconButton label={`Edit ${note.title}`} onClick={() => openEditNoteEditor(note)}>
                        <Pencil aria-hidden="true" size={18} />
                      </IconButton>
                      <IconButton
                        label={`Delete ${note.title}`}
                        variant="outline-danger"
                        onClick={() => setNotePendingDeletion(note)}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </IconButton>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </section>
        </Container>
      </main>

      <Modal show={isEditorOpen} onHide={() => setIsEditorOpen(false)} centered>
        <Form onSubmit={(event) => void saveNote(event)}>
          <Modal.Header closeButton>
            <Modal.Title>{editingNote ? "Edit note" : "New note"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editorError ? <Alert variant="danger">{editorError}</Alert> : null}
            <Form.Group className="mb-3" controlId="note-title">
              <Form.Label>Title</Form.Label>
              <Form.Control
                autoFocus
                maxLength={120}
                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
                required
                value={draft.title}
              />
            </Form.Group>
            <Form.Group controlId="note-content">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                maxLength={10_000}
                onChange={(event) =>
                  setDraft((currentDraft) => ({ ...currentDraft, content: event.target.value }))
                }
                required
                rows={9}
                value={draft.content}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !draft.title.trim() || !draft.content.trim()}>
              {isSaving ? "Saving..." : "Save note"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={notePendingDeletion !== null}
        onHide={() => setNotePendingDeletion(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete note?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Delete <strong>{notePendingDeletion?.title}</strong>? This cannot be undone unless you
            restore a backup.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setNotePendingDeletion(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void confirmDeleteNote()} disabled={isSaving}>
            Delete note
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "outline-secondary",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: string;
}): React.ReactElement {
  return (
    <OverlayTrigger overlay={<Tooltip>{label}</Tooltip>} placement="top">
      <Button aria-label={label} className="icon-button" onClick={onClick} size="sm" variant={variant}>
        {children}
      </Button>
    </OverlayTrigger>
  );
}

function downloadFile(contents: string, fileName: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong with browser storage.";
}

function parseJsonBackup(contents: string): unknown {
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error("This file is not valid JSON. Choose a FireEmblemBuildHelper JSON backup.");
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error ?? new Error("The backup file could not be read."));
    };
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.readAsText(file);
  });
}
