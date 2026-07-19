import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { fe14Data } from "./games/fe14/data";
import { createNote, ensureDefaultWorkspace } from "./storage";
import { resetBrowserStorage } from "./test/storageTestUtils";

describe("application regressions", () => {
  beforeEach(async () => {
    window.history.replaceState({}, "", "/Notes");
    await resetBrowserStorage();
  });

  it("uses the project home page at root and keeps the complete release archive concise", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(screen.getByRole("heading", { name: "FireEmblemBuildHelper", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fire Emblem If \/ Fates/ })).toHaveAttribute("href", "/FE14/Units");
    expect(screen.getByText("v0.6.0")).toBeInTheDocument();
    expect(screen.getByText("Route-driven FE14 base configuration")).toBeInTheDocument();
    expect(screen.getAllByText(/^v\d/)).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "View complete history" }));
    expect(screen.getByText("v0.0.1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show newest releases only" })).toHaveAttribute("aria-expanded", "true");
  });

  it("creates a note that remains after the app remounts", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await screen.findByRole("heading", { name: "My planning workspace" });
    await user.click(screen.getByRole("button", { name: "New note" }));
    await user.type(screen.getByLabelText("Title"), "Mozu route");
    await user.type(screen.getByLabelText("Content"), "Test Archer before promotion.");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    expect(await screen.findByRole("heading", { name: "Mozu route" })).toBeInTheDocument();

    view.unmount();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Mozu route" })).toBeInTheDocument();
  });

  it("edits and deletes a note only after confirmation", async () => {
    const user = userEvent.setup();
    const workspace = await ensureDefaultWorkspace();
    await createNote(workspace.id, { title: "Old build", content: "Needs revision." });
    render(<App />);

    await screen.findByRole("heading", { name: "Old build" });
    await user.click(screen.getByRole("button", { name: "Edit Old build" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated build");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    await user.click(await screen.findByRole("button", { name: "Delete Updated build" }));

    const deleteDialog = screen.getByRole("dialog");
    expect(within(deleteDialog).getByText("Delete note?")).toBeInTheDocument();
    await user.click(within(deleteDialog).getByRole("button", { name: "Delete note" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Updated build" })).not.toBeInTheDocument());
  });

  it("shows a clear error for a non-JSON backup file", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "My planning workspace" });

    await user.upload(
      screen.getByLabelText("Choose JSON backup file"),
      new File(["not a backup"], "notes.txt", { type: "application/json" }),
    );
    expect(await screen.findByText("This file is not valid JSON. Choose a FireEmblemBuildHelper JSON backup.")).toBeInTheDocument();
  });

  it("filters the complete FE14 portrait roster by route and generation", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units");
    render(<App />);

    expect(screen.getAllByRole("img")).toHaveLength(69);
    expect(screen.getByRole("img", { name: "Felicia portrait" }).closest("a")).toHaveAttribute("href", "/FE14/Units/Felicia");
    await user.selectOptions(screen.getByLabelText("Route roster"), "conquest");
    expect(screen.getAllByRole("img")).toHaveLength(41);
    expect(screen.queryByRole("img", { name: "Ryoma portrait" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Generation"), "first");
    expect(screen.getAllByRole("img")).toHaveLength(28);
  });

  it("opens the class-skill directory and navigates to it without a reload", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units");
    const view = render(<App />);

    await user.click(screen.getByRole("link", { name: "FE14 Skills" }));
    expect(window.location.pathname).toBe("/FE14/Skills");
    expect(screen.getByRole("heading", { name: "FE14 Class Skills", level: 1 })).toBeInTheDocument();
    expect(view.container.querySelectorAll(".class-skill-class-row input[type='checkbox']")).toHaveLength(65);
    expect(view.container.querySelectorAll(".class-skill-result")).toHaveLength(106);
  });

  it("renders Felicia through the shared base configuration and keeps JSON inspection", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Felicia");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Felicia", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Base configuration", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Stat profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Joining stats")).toBeInTheDocument();
    expect(screen.getByLabelText("Effective growth rates")).toBeInTheDocument();
    expect(screen.getByLabelText("Cap modifiers")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Starting skills" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weapon levels" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Support stance bonuses" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Native class access" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Felicia JSON tree")).toBeInTheDocument();
  });

  it("switches every visible Silas starting-state field with the route tabs", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Silas");
    render(<App />);

    expect(screen.getByRole("tab", { name: "Birthright" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Chapter 7, end")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Conquest" }));
    expect(screen.getByText("Chapter 7, during")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Revelation" }));
    expect(screen.getByText("Chapter 14, end")).toBeInTheDocument();
    expect(screen.getByLabelText("Joining stats")).toBeInTheDocument();
  });

  it("keeps Kaze's appearance and permanent rejoin as route-local states", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Kaze");
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Conquest" }));
    expect(screen.getByRole("tablist", { name: "Availability state" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Pre-route.*Chapter 4/ }));
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getAllByText("Chapter 4, start")).toHaveLength(2);
  });

  it("keeps Corrin's live boon, bane, Talent, and independent class exception", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Corrin");
    const view = render(<App />);

    expect(screen.getByRole("heading", { name: "Corrin configuration", level: 2 })).toBeInTheDocument();
    const boon = screen.getByLabelText("Starting bases boon");
    expect(boon).toHaveValue("robust");
    await user.selectOptions(boon, "quick");
    expect(boon).toHaveValue("quick");

    const talent = screen.getByLabelText("Corrin Talent");
    await user.selectOptions(talent, "dragon");
    expect(screen.getByText("Dragon", { selector: "dt" }).closest("div")).toHaveAttribute("aria-current", "true");
    expect(screen.queryByRole("heading", { name: "Native class access" })).not.toBeInTheDocument();

    view.unmount();
    window.history.replaceState({}, "", "/FE14/Units/Subaki");
    render(<App />);
    expect(screen.getByRole("complementary", { name: "Female Corrin Talent only" })).toBeInTheDocument();
  });

  it("preserves every legal Corrin boon and bane stance lookup", () => {
    const config = fe14Data.units.find((unit) => unit.identity.id === "corrin")!.avatarConfiguration!;
    for (const boon of config.boons) {
      for (const bane of config.banes.filter((choice) => choice.stat !== boon.stat)) {
        expect(config.pairupRule.attackStance.variants.filter(
          (variant) => variant.boonIds.includes(boon.id) && variant.baneIds.includes(bane.id),
        ), `${boon.id}/${bane.id} Attack Stance`).toHaveLength(1);
        expect(config.pairupRule.guardStance.variants.filter(
          (variant) => variant.boonId === boon.id && variant.baneId === bane.id,
        ), `${boon.id}/${bane.id} Guard Stance`).toHaveLength(1);
      }
    }
  });

  it("renders offspring route, parent, timing, growth, and inheritance controls together", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Dwyer");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Choose Route" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose Dwyer's mother" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mother")).toHaveValue("corrin");
    expect(screen.getByLabelText("Offspring recruitment story position")).toBeInTheDocument();
    expect(screen.getByLabelText("Child growth rates before parent inheritance")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Child and variable parent growth rates" })).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum recruitment stats before parent inheritance")).toHaveTextContent("Minimum");

    await user.click(screen.getByText("Open recruitment inheritance calculator and formula walkthrough"));
    expect(screen.getByRole("heading", { name: "Parent-stat recruitment calculator" })).toBeInTheDocument();
    expect(screen.getByLabelText("Jakob current Str")).toBeInTheDocument();
    expect(screen.getByLabelText("Corrin current Str")).toBeInTheDocument();
    expect(screen.getByLabelText("Str recruitment stat calculation")).toBeInTheDocument();
    expect(screen.queryByText("Offspring Seal result")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected class ceiling")).not.toBeInTheDocument();
  });

  it("updates offspring timing and parent-dependent accessible skills", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Dwyer");
    render(<App />);

    const storyPosition = screen.getByLabelText("Offspring recruitment story position");
    fireEvent.change(storyPosition, { target: { value: "11" } });
    expect(screen.getByLabelText("Offspring Seal class")).toBeInTheDocument();

    const sources = screen.getByLabelText("Class access sources");
    expect(within(sources).getByText("From Corrin")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Mother"), "felicia");
    expect(within(sources).getByText("From Felicia")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Available class skills" })).getByText("Mercenary")).toBeInTheDocument();
  });

  it("resolves nested Kana parentage without restoring redundant class-access markup", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Kana");
    render(<App />);

    expect(screen.getByLabelText("Kana gender")).toHaveValue("female");
    await user.selectOptions(screen.getByLabelText("Parent"), "sophie");
    expect(screen.getByLabelText("Sophie's mother")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Sophie's mother"), "felicia");
    expect(screen.getByLabelText("Class access sources")).toHaveTextContent("From Sophie");
    expect(screen.queryByRole("heading", { name: "Resolved class access" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Kana gender"), "male");
    expect(screen.getByAltText("Male Kana portrait")).toBeInTheDocument();
  });

  it("previews Friendship and Partner Seal trees independently", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Felicia");
    render(<App />);

    const sources = screen.getByLabelText("Class access sources");
    const skills = screen.getByRole("region", { name: "Available class skills" });
    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    await user.click(within(relationships).getByRole("radio", { name: "Preview Peri Friendship Seal class skills" }));
    expect(within(sources).getByText("Friendship: Peri")).toBeInTheDocument();
    expect(within(skills).getByText("Cavalier")).toBeInTheDocument();

    await user.click(within(relationships).getByRole("radio", { name: "Preview Niles Partner Seal class skills" }));
    expect(within(sources).getByText("Partner: Niles")).toBeInTheDocument();
    expect(within(skills).getByText("Outlaw")).toBeInTheDocument();
  });
});
