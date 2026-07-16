import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { createNote, ensureDefaultWorkspace } from "./storage";
import { resetBrowserStorage } from "./test/storageTestUtils";

describe("notes workspace", () => {
  beforeEach(async () => {
    window.history.replaceState({}, "", "/");
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

  it("shows the full FE14 portrait roster on the unit index", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units");
    render(<App />);

    expect(screen.getByRole("heading", { name: "FE14 Units" })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(48);
    expect(screen.getByText("No. 02")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Felicia portrait" }).closest("a")).toHaveAttribute(
      "href",
      "/FE14/Units/Felicia",
    );

    await user.selectOptions(screen.getByLabelText("Route roster"), "conquest");
    expect(screen.getAllByRole("img")).toHaveLength(28);
    expect(screen.queryByRole("img", { name: "Ryoma portrait" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Xander portrait" })).toBeInTheDocument();
  });

  it("opens Felicia's overview and expandable JSON data", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Felicia");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Felicia", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personal growth and cap modifiers" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(2);
    expect(screen.getAllByText("Chapter 2")).toHaveLength(3);
    expect(screen.getAllByText("Chapter 16")).toHaveLength(3);
    expect(screen.getByText("Dagger D, Staff D")).toBeInTheDocument();
    expect(screen.getByText("Dagger C (~1/3 to B), Staff C (~1/3 to B)")).toBeInTheDocument();
    expect(screen.getByText(/four built-in Eternal Seals/i)).toBeInTheDocument();
    expect(screen.getByText("Oni Savage")).toBeInTheDocument();
    expect(screen.getByText("Spear Fighter")).toBeInTheDocument();
    expect(screen.getByText("Apothecary")).toBeInTheDocument();
    expect(screen.getByText("Wyvern Rider")).toBeInTheDocument();
    expect(screen.getAllByText("Troubadour")[0]).toHaveAttribute(
      "title",
      "Troubadour promotes to Strategist or Maid / Butler.",
    );

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Felicia JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"felicia"').length).toBeGreaterThan(0);
  });

  it("opens Jakob's complete review slice", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Jakob");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Jakob", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Evasive Partner")).toHaveLength(2);
    expect(screen.getAllByText("Chapter 2")).toHaveLength(3);
    expect(screen.getAllByText("Chapter 16")).toHaveLength(3);
    expect(screen.getByText("Dagger D, Staff D")).toBeInTheDocument();
    expect(screen.getByText("Dagger C (~1/3 to B), Staff C (~1/3 to B)")).toBeInTheDocument();
    expect(screen.getByText("Outlaw")).toBeInTheDocument();
    expect(screen.getByText("Apothecary")).toBeInTheDocument();
    expect(screen.getByText(/With female Corrin, Jakob leaves after Chapter 3/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Jakob JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"jakob"').length).toBeGreaterThan(0);
  });

  it("shows Kaze's route-specific level and retention rules", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Kaze");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Kaze", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Miraculous Save")).toHaveLength(2);
    expect(screen.getAllByText("Chapter 4")).toHaveLength(3);
    expect(screen.getByText("Normal: Iron Shuriken, Vulnerary ×2; Hard/Lunatic: Iron Shuriken, Vulnerary")).toBeInTheDocument();
    expect(screen.getByText("Chapter 11 (end)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 8 (end)")).toBeInTheDocument();
    expect(screen.getByText("Lv. 9 + Ch. 4/5 levels Ninja")).toBeInTheDocument();
    expect(screen.getByText("Dagger C + Chapter 4/5 proficiency gained")).toBeInTheDocument();
    expect(screen.getAllByText("Dagger D + retained Chapter 5 proficiency")).toHaveLength(2);
    expect(screen.getByText(/level 9 template, then adds every level gained/i)).toBeInTheDocument();
    expect(screen.getByText(/remains in the army after Chapter 15 only if Corrin has reached A support/i)).toBeInTheDocument();
    expect(screen.getByText("Outlaw")).toBeInTheDocument();
    expect(screen.getByText("Apothecary")).toBeInTheDocument();
    expect(screen.getAllByText("Str")).not.toHaveLength(0);
    expect(screen.queryByText(/fixed \+4 Strength adjustment/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Kaze JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"kaze"').length).toBeGreaterThan(0);
  });

  it("shows Silas's route-specific recruitment data", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Silas");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Silas", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Vow of Friendship")).toHaveLength(2);
    expect(screen.getByText("Chapter 7 (end)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 7 (during)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 14 (end)")).toBeInTheDocument();
    expect(screen.getByText("Sword C, Lance D")).toBeInTheDocument();
    expect(screen.getByText("Sword D, Lance E")).toBeInTheDocument();
    expect(screen.getByText("Sword B, Lance B")).toBeInTheDocument();
    expect(screen.getByText("Outlaw")).toBeInTheDocument();
    expect(screen.getByText("Apothecary")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Silas JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"silas"').length).toBeGreaterThan(0);
  });

  it("shows Azura's route split and Chapter 5 stat return", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Azura");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Azura", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Healing Descant")).toHaveLength(2);
    expect(screen.getAllByText("Chapter 5")).toHaveLength(3);
    expect(screen.getByText("Chapter 9")).toBeInTheDocument();
    expect(screen.getByText("Chapter 6")).toBeInTheDocument();
    expect(screen.getByText("Brass Naginata")).toBeInTheDocument();
    expect(screen.getByText("Vulnerary, Chest Key")).toBeInTheDocument();
    expect(screen.getByText("Bronze Lance, Vulnerary")).toBeInTheDocument();
    expect(screen.getByText(/restores Azura with the stats she had at the end of Chapter 5/i)).toBeInTheDocument();
    expect(screen.getByText("Oni Savage")).toBeInTheDocument();
    expect(screen.getByText("Spear Fighter")).toBeInTheDocument();
    expect(screen.getByText("Wyvern Rider")).toBeInTheDocument();
    expect(screen.getByText("Apothecary")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Azura JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"azura"').length).toBeGreaterThan(0);
  });

  it("shows Mozu's Paralogue 1 recruitment and Aptitude note", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Mozu");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Mozu", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Forager")).toHaveLength(2);
    expect(screen.getByText(/Paralogue 1 recruitment \(unlocks after Chapter 7\)/i)).toBeInTheDocument();
    expect(screen.getAllByText("Chapter 7 (conditional)")).toHaveLength(3);
    expect(screen.getByText("Brass Naginata, Vulnerary")).toBeInTheDocument();
    expect(screen.getByText("Lance E")).toBeInTheDocument();
    expect(screen.getByText("290%")).toBeInTheDocument();
    expect(screen.getByText(/talking to her with Corrin in Paralogue 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Aptitude, which adds 10% to every growth rate/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot access Apothecary, but she still reaches Merchant/i)).toBeInTheDocument();
    expect(screen.getByText("Oni Savage")).toBeInTheDocument();
    expect(screen.getByText("Wyvern Rider")).toBeInTheDocument();
    expect(screen.getByText("Apothecary")).toBeInTheDocument();
    expect(screen.getAllByText("Villager")[0]).toHaveAttribute(
      "title",
      "Villager promotes to Merchant or Master of Arms.",
    );

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Mozu JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"mozu"').length).toBeGreaterThan(0);
  });

  it("shows Shura's route-specific recruitment choices", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Shura");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Shura", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Highwayman")).toHaveLength(2);
    expect(screen.getByText("Chapter 22 (end)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 16 (end)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 15 (during)")).toBeInTheDocument();
    expect(screen.getByText("Spy's Yumi, Beaststone Plus")).toBeInTheDocument();
    expect(screen.getByText("Killer Bow, Mend")).toBeInTheDocument();
    expect(screen.getByText("Steel Bow, Heal")).toBeInTheDocument();
    expect(screen.getByText("Bow A, Staff C")).toBeInTheDocument();
    expect(screen.getByText("Bow C, Staff D")).toBeInTheDocument();
    expect(screen.getByText("Bow B, Staff C")).toBeInTheDocument();
    expect(screen.getByText(/killing him instead awards Boots/i)).toBeInTheDocument();
    expect(screen.getByText(/talking to him with Corrin/i)).toBeInTheDocument();
    expect(screen.getByText("200%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Shura JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"shura"').length).toBeGreaterThan(0);
  });

  it("shows Izana's My Castle refresh and Conquest autolevel rules", () => {
    window.history.replaceState({}, "", "/FE14/Units/Izana");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Izana", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Sharing is caring.")).toBeInTheDocument();
    expect(screen.getByText(/no one has produced a concrete, accurate data table for Izana yet, FFS/i)).toBeInTheDocument();
    expect(screen.getByText(/Until then, \(╯‵□′\)╯︵┻━┻/i)).toBeInTheDocument();
    expect(screen.getByText("After Chapter 18")).toBeInTheDocument();
    expect(screen.getByText("After Chapter 22")).toBeInTheDocument();
    expect(screen.getByText("Lv. 5+ (scales) Onmyoji")).toBeInTheDocument();
    expect(screen.getByText("Lv. 7-15 Onmyoji")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Joining stats at Lv. 5" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Joining stats at Lv. 7" })).toBeInTheDocument();
    expect(screen.getAllByText(/Hot Spring Lv\. 3, then a My Castle refresh by waiting/i)).toHaveLength(2);
    expect(screen.getByText("Ch. 23: Lv. 7")).toBeInTheDocument();
    expect(screen.getByText("Ch. 27: Lv. 15")).toBeInTheDocument();
    expect(screen.getAllByText(/Castle-recruit autolevel.*Offspring Seal-esque level scaling/i)).toHaveLength(3);
    expect(screen.getAllByText(/Weapon proficiency scales with story progress/i)).toHaveLength(2);
    expect(screen.getAllByText(/Level 5 bases \+ \(individual growth rates \+ Onmyoji class growth rates\) × levels gained/i)).toHaveLength(2);
    expect(screen.getByText(/Later Birthright chapter milestones still need direct testing/i)).toBeInTheDocument();
  });
});
