import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
} from "../../storage";
import type { Note, Workspace } from "../../types";
import { EMPTY_NOTE_DRAFT, type NoteDraft } from "./types";
import { downloadFile, getErrorMessage, parseJsonBackup, readFileAsText } from "./utils";

export default function useNotesWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_NOTE_DRAFT);
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
      if (!workspace) throw new Error("The selected workspace could not be found.");

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
    setDraft(EMPTY_NOTE_DRAFT);
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
    if (!activeWorkspace || !draft.title.trim() || !draft.content.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      if (editingNote) await updateNote(editingNote, draft);
      else await createNote(activeWorkspace.id, draft);
      setIsEditorOpen(false);
      await loadWorkspace(activeWorkspace.id);
    } catch (caughtError) {
      setEditorError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteNote(): Promise<void> {
    if (!notePendingDeletion || !activeWorkspace) return;

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
    if (!activeWorkspace) return;

    setError(null);
    try {
      const backup = await createWorkspaceBackup(activeWorkspace.id);
      downloadFile(JSON.stringify(backup, null, 2), "fire-emblem-build-helper-backup.json", "application/json");
      const updatedWorkspace = await markWorkspaceExported(activeWorkspace.id);
      setActiveWorkspace(updatedWorkspace);
      setWorkspaces((current) => current.map((workspace) => (
        workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
      )));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  async function exportTextSummary(): Promise<void> {
    if (!activeWorkspace) return;
    setError(null);
    try {
      const backup = await createWorkspaceBackup(activeWorkspace.id);
      downloadFile(formatWorkspaceTextExport(backup), "fire-emblem-build-helper-notes.txt", "text/plain;charset=utf-8");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    }
  }

  async function importJsonBackup(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsSaving(true);
    setError(null);
    try {
      const restoredWorkspace = await importWorkspaceBackup(parseJsonBackup(await readFileAsText(file)));
      await loadWorkspace(restoredWorkspace.id);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  return {
    activeWorkspace,
    confirmDeleteNote,
    draft,
    editingNote,
    editorError,
    error,
    exportJsonBackup,
    exportTextSummary,
    fileInputRef,
    importJsonBackup,
    isEditorOpen,
    isLoading,
    isSaving,
    loadWorkspace,
    notePendingDeletion,
    notes,
    openEditNoteEditor,
    openNewNoteEditor,
    saveNote,
    setDraft,
    setError,
    setIsEditorOpen,
    setNotePendingDeletion,
    workspaces,
  };
}
