export const BACKUP_FORMAT = "fire-emblem-build-helper.workspace";
export const BACKUP_FORMAT_VERSION = 1;

export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastExportedAt?: string;
};

export type Note = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceBackup = {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  exportedAt: string;
  workspace: Workspace;
  notes: Note[];
};
