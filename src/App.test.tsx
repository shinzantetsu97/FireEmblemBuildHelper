import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { createNote, ensureDefaultWorkspace } from "./storage";
import { resetBrowserStorage } from "./test/storageTestUtils";

describe("notes workspace", () => {
  beforeEach(async () => {
    await resetBrowserStorage();
  });

  it("creates a note that remains after the app remounts", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await screen.findByRole("heading", { name: "My planning workspace" });
    await user.click(screen.getByRole("button", { name: "New note" }));
    await user.type(screen.getByLabelText("Title"), "Mozu route");
    await user.type(screen.getByLabelText("Content"), "Test Archer before promotion.");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    await screen.findByRole("heading", { name: "Mozu route" });
    expect(screen.getByText("Test Archer before promotion.")).toBeInTheDocument();

    view.unmount();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Mozu route" })).toBeInTheDocument();
  });

  it("edits and deletes a note only after confirmation", async () => {
    const user = userEvent.setup();
    const workspace = await ensureDefaultWorkspace();
    await createNote(workspace.id, {
      title: "Old build",
      content: "Needs revision.",
    });

    render(<App />);

    await screen.findByRole("heading", { name: "Old build" });
    await user.click(screen.getByRole("button", { name: "Edit Old build" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated build");
    await user.clear(screen.getByLabelText("Content"));
    await user.type(screen.getByLabelText("Content"), "Now ready for review.");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    await screen.findByRole("heading", { name: "Updated build" });
    await user.click(screen.getByRole("button", { name: "Delete Updated build" }));
    const deleteDialog = screen.getByRole("dialog");
    expect(within(deleteDialog).getByText("Delete note?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Updated build" })).toBeInTheDocument();

    await user.click(within(deleteDialog).getByRole("button", { name: "Delete note" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Updated build" })).not.toBeInTheDocument();
    });
  });

  it("shows a clear error for a non-JSON backup file", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "My planning workspace" });
    const invalidBackup = new File(["not a backup"], "notes.txt", { type: "application/json" });

    await user.upload(screen.getByLabelText("Choose JSON backup file"), invalidBackup);

    expect(
      await screen.findByText("This file is not valid JSON. Choose a FireEmblemBuildHelper JSON backup."),
    ).toBeInTheDocument();
  });
});
