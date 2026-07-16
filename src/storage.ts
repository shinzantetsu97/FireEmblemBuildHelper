import { openDB, type DBSchema } from "idb";
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  type Note,
  type Workspace,
  type WorkspaceBackup,
} from "./types";

const DATABASE_NAME = "fire-emblem-build-helper";
const DATABASE_VERSION = 1;
const DEFAULT_WORKSPACE_ID = "workspace_default";

interface FireEmblemBuildHelperDatabase extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: { "by-workspace": string };
  };
  workspaces: {
    key: string;
    value: Workspace;
  };
}

const database = openDB<FireEmblemBuildHelperDatabase>(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("workspaces")) {
      db.createObjectStore("workspaces", { keyPath: "id" });
    }

    if (!db.objectStoreNames.contains("notes")) {
      const notes = db.createObjectStore("notes", { keyPath: "id" });
      notes.createIndex("by-workspace", "workspaceId");
    }
  },
});

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  return crypto.randomUUID();
}

function createDefaultWorkspace(): Workspace {
  const timestamp = now();

  return {
    id: DEFAULT_WORKSPACE_ID,
    name: "My planning workspace",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function ensureDefaultWorkspace(): Promise<Workspace> {
  const db = await database;
  const existing = await db.get("workspaces", DEFAULT_WORKSPACE_ID);

  if (existing) {
    return existing;
  }

  const workspace = createDefaultWorkspace();
  await db.put("workspaces", workspace);
  return workspace;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = await database;
  const workspaces = await db.getAll("workspaces");

  return [...workspaces].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function listNotes(workspaceId: string): Promise<Note[]> {
  const db = await database;
  const notes = await db.getAllFromIndex("notes", "by-workspace", workspaceId);

  return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function createNote(
  workspaceId: string,
  input: Pick<Note, "title" | "content">,
): Promise<Note> {
  const db = await database;
  const timestamp = now();
  const note: Note = {
    id: createId(),
    workspaceId,
    title: input.title.trim(),
    content: input.content.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.put("notes", note);
  await touchWorkspace(workspaceId, timestamp);
  return note;
}

export async function updateNote(
  note: Note,
  input: Pick<Note, "title" | "content">,
): Promise<Note> {
  const db = await database;
  const timestamp = now();
  const updatedNote: Note = {
    ...note,
    title: input.title.trim(),
    content: input.content.trim(),
    updatedAt: timestamp,
  };

  await db.put("notes", updatedNote);
  await touchWorkspace(note.workspaceId, timestamp);
  return updatedNote;
}

export async function deleteNote(note: Note): Promise<void> {
  const db = await database;
  const timestamp = now();

  await db.delete("notes", note.id);
  await touchWorkspace(note.workspaceId, timestamp);
}

export async function createWorkspaceBackup(workspaceId: string): Promise<WorkspaceBackup> {
  const db = await database;
  const workspace = await db.get("workspaces", workspaceId);

  if (!workspace) {
    throw new Error("The selected workspace could not be found.");
  }

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now(),
    workspace,
    notes: await listNotes(workspaceId),
  };
}

export async function markWorkspaceExported(workspaceId: string): Promise<Workspace> {
  const db = await database;
  const workspace = await db.get("workspaces", workspaceId);

  if (!workspace) {
    throw new Error("The selected workspace could not be found.");
  }

  const timestamp = now();
  const updatedWorkspace: Workspace = {
    ...workspace,
    updatedAt: timestamp,
    lastExportedAt: timestamp,
  };

  await db.put("workspaces", updatedWorkspace);
  return updatedWorkspace;
}

export function formatWorkspaceTextExport(backup: WorkspaceBackup): string {
  const lines = [
    "FireEmblemBuildHelper notes summary",
    "",
    `Workspace: ${backup.workspace.name}`,
    `Exported: ${backup.exportedAt}`,
    `Notes: ${backup.notes.length}`,
    "",
  ];

  for (const note of backup.notes) {
    lines.push(note.title);
    lines.push("-".repeat(note.title.length));
    lines.push(note.content || "(No content)");
    lines.push(`Created: ${note.createdAt}`);
    lines.push(`Last updated: ${note.updatedAt}`);
    lines.push("");
  }

  return lines.join("\n");
}

export async function importWorkspaceBackup(input: unknown): Promise<Workspace> {
  const backup = parseWorkspaceBackup(input);
  const db = await database;
  const timestamp = now();
  const restoredWorkspaceId = createId();
  const restoredWorkspace: Workspace = {
    id: restoredWorkspaceId,
    name: `Restored: ${backup.workspace.name}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastExportedAt: backup.workspace.lastExportedAt,
  };
  const restoredNotes = backup.notes.map((note) => ({
    ...note,
    id: createId(),
    workspaceId: restoredWorkspaceId,
  }));
  const transaction = db.transaction(["workspaces", "notes"], "readwrite");

  await transaction.objectStore("workspaces").put(restoredWorkspace);

  for (const note of restoredNotes) {
    await transaction.objectStore("notes").put(note);
  }

  await transaction.done;
  return restoredWorkspace;
}

function parseWorkspaceBackup(input: unknown): WorkspaceBackup {
  if (!isRecord(input)) {
    throw new Error("This file is not a FireEmblemBuildHelper JSON backup.");
  }

  if (input.format !== BACKUP_FORMAT) {
    throw new Error("This JSON file uses an unsupported backup format.");
  }

  if (input.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error("This backup version is not supported by this app yet.");
  }

  if (!isWorkspace(input.workspace) || !Array.isArray(input.notes) || !input.notes.every(isNote)) {
    throw new Error("This backup is missing valid workspace or note data.");
  }

  if (!isNonEmptyString(input.exportedAt)) {
    throw new Error("This backup is missing its export timestamp.");
  }

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: input.exportedAt,
    workspace: input.workspace,
    notes: input.notes,
  };
}

function isWorkspace(value: unknown): value is Workspace {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    (value.lastExportedAt === undefined || isNonEmptyString(value.lastExportedAt))
  );
}

function isNote(value: unknown): value is Note {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.workspaceId) &&
    typeof value.title === "string" &&
    typeof value.content === "string" &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

async function touchWorkspace(workspaceId: string, timestamp: string): Promise<void> {
  const db = await database;
  const workspace = await db.get("workspaces", workspaceId);

  if (!workspace) {
    return;
  }

  await db.put("workspaces", { ...workspace, updatedAt: timestamp });
}
