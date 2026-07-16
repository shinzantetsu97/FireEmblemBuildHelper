import { beforeEach, describe, expect, it } from "vitest";
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
import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION } from "./types";
import { resetBrowserStorage } from "./test/storageTestUtils";

describe("browser-local workspace storage", () => {
  beforeEach(async () => {
    await resetBrowserStorage();
  });

  it("creates one default workspace and supports a note lifecycle", async () => {
    const workspace = await ensureDefaultWorkspace();
    const sameWorkspace = await ensureDefaultWorkspace();
    const note = await createNote(workspace.id, {
      title: "  Mozu route  ",
      content: "  Revisit Archer timing.  ",
    });

    expect(sameWorkspace.id).toBe(workspace.id);
    expect(note).toMatchObject({
      workspaceId: workspace.id,
      title: "Mozu route",
      content: "Revisit Archer timing.",
    });

    const updatedNote = await updateNote(note, {
      title: "Mozu Archer route",
      content: "Check seal timing before promotion.",
    });

    expect(await listNotes(workspace.id)).toEqual([updatedNote]);

    await deleteNote(updatedNote);
    expect(await listNotes(workspace.id)).toEqual([]);
  });

  it("creates a versioned Unicode-safe backup and readable summary", async () => {
    const workspace = await ensureDefaultWorkspace();
    await createNote(workspace.id, {
      title: "物集 build note",
      content: "火纹ifの弓使いルートを確認する。",
    });

    const backup = await createWorkspaceBackup(workspace.id);
    const exportedWorkspace = await markWorkspaceExported(workspace.id);
    const textSummary = formatWorkspaceTextExport(backup);

    expect(backup).toMatchObject({
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      workspace: { id: workspace.id },
      notes: [
        {
          title: "物集 build note",
          content: "火纹ifの弓使いルートを確認する。",
        },
      ],
    });
    expect(exportedWorkspace.lastExportedAt).toEqual(expect.any(String));
    expect(textSummary).toContain("物集 build note");
    expect(textSummary).toContain("火纹ifの弓使いルートを確認する。");
  });

  it("imports into a separate workspace without overwriting the original", async () => {
    const workspace = await ensureDefaultWorkspace();
    const originalNote = await createNote(workspace.id, {
      title: "Conquest draft",
      content: "Keep the original note intact.",
    });
    const backup = await createWorkspaceBackup(workspace.id);

    const restoredWorkspace = await importWorkspaceBackup(backup);
    const restoredNotes = await listNotes(restoredWorkspace.id);

    expect(restoredWorkspace).toMatchObject({ name: "Restored: My planning workspace" });
    expect(await listWorkspaces()).toHaveLength(2);
    expect(await listNotes(workspace.id)).toEqual([originalNote]);
    expect(restoredNotes).toHaveLength(1);
    expect(restoredNotes[0]).toMatchObject({
      title: originalNote.title,
      content: originalNote.content,
    });
    expect(restoredNotes[0].id).not.toBe(originalNote.id);
  });

  it("rejects malformed and unsupported backup data before writing it", async () => {
    const workspace = await ensureDefaultWorkspace();

    await expect(importWorkspaceBackup({ format: "other-app", formatVersion: 1 })).rejects.toThrow(
      "unsupported backup format",
    );
    await expect(
      importWorkspaceBackup({
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt: "2026-07-15T00:00:00.000Z",
        workspace: { id: "workspace", name: "Invalid" },
        notes: [],
      }),
    ).rejects.toThrow("missing valid workspace or note data");

    expect(await listWorkspaces()).toEqual([workspace]);
    expect(await listNotes(workspace.id)).toEqual([]);
  });
});
