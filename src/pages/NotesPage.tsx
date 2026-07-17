import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import BackupBanner from "../components/notes/BackupBanner";
import DeleteNoteDialog from "../components/notes/DeleteNoteDialog";
import NoteEditorDialog from "../components/notes/NoteEditorDialog";
import NotesList from "../components/notes/NotesList";
import useNotesWorkspace from "../components/notes/useNotesWorkspace";
import WorkspaceHeader from "../components/notes/WorkspaceHeader";

export default function NotesPage() {
  const workspace = useNotesWorkspace();

  if (workspace.isLoading && !workspace.activeWorkspace) {
    return (
      <main className="loading-screen" aria-live="polite">
        <Spinner animation="border" role="status" />
        <span>Loading workspace</span>
      </main>
    );
  }

  return (
    <>
      <main>
        <Container className="workspace-main" fluid="lg">
          {workspace.error ? (
            <Alert variant="danger" onClose={() => workspace.setError(null)} dismissible>{workspace.error}</Alert>
          ) : null}
          <WorkspaceHeader
            activeWorkspace={workspace.activeWorkspace}
            disabled={workspace.isLoading}
            onChange={(workspaceId) => void workspace.loadWorkspace(workspaceId)}
            workspaces={workspace.workspaces}
          />
          <BackupBanner
            activeWorkspace={workspace.activeWorkspace}
            fileInputRef={workspace.fileInputRef}
            onBackup={() => void workspace.exportJsonBackup()}
            onImport={(event) => void workspace.importJsonBackup(event)}
            onTextExport={() => void workspace.exportTextSummary()}
          />
          <NotesList
            disabled={!workspace.activeWorkspace || workspace.isSaving}
            isLoading={workspace.isLoading}
            notes={workspace.notes}
            onDelete={workspace.setNotePendingDeletion}
            onEdit={workspace.openEditNoteEditor}
            onNew={workspace.openNewNoteEditor}
          />
        </Container>
      </main>
      <NoteEditorDialog
        draft={workspace.draft}
        editingNote={workspace.editingNote}
        error={workspace.editorError}
        isSaving={workspace.isSaving}
        onDraftChange={workspace.setDraft}
        onHide={() => workspace.setIsEditorOpen(false)}
        onSubmit={(event) => void workspace.saveNote(event)}
        show={workspace.isEditorOpen}
      />
      <DeleteNoteDialog
        isSaving={workspace.isSaving}
        note={workspace.notePendingDeletion}
        onConfirm={() => void workspace.confirmDeleteNote()}
        onHide={() => workspace.setNotePendingDeletion(null)}
      />
    </>
  );
}
