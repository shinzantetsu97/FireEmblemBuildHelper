import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { fe14Data } from "./games/fe14/data";
import { createNote, ensureDefaultWorkspace } from "./storage";
import { resetBrowserStorage } from "./test/storageTestUtils";

describe("notes workspace", () => {
  beforeEach(async () => {
    window.history.replaceState({}, "", "/Notes");
    await resetBrowserStorage();
  });

  it("uses the project home page at root and keeps notes on their own route", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(screen.getByRole("heading", { name: "FireEmblemBuildHelper", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Game Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fire Emblem If \/ Fates/ })).toHaveAttribute("href", "/FE14/Units");
    expect(screen.getByRole("heading", { name: "Version log", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("v0.3.0")).toBeInTheDocument();
    expect(screen.getByText("Complete FE14 first-generation roster")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("href", "/Notes");
    expect(screen.queryByRole("link", { name: "Updates" })).not.toBeInTheDocument();
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
    const feliciaCard = screen.getByRole("img", { name: "Felicia portrait" }).closest("a");
    expect(feliciaCard).toHaveAttribute(
      "href",
      "/FE14/Units/Felicia",
    );
    expect(within(feliciaCard!).getByText("ALL")).toBeInTheDocument();
    expect(within(feliciaCard!).queryByText("Accepted")).not.toBeInTheDocument();

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
    expect(screen.getByRole("heading", { name: "References" })).toBeInTheDocument();
    expect(screen.queryByText("Audit trail")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Felicia JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"felicia"').length).toBeGreaterThan(0);
  });

  it("opens Jakob's complete review slice", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Jakob");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Jakob", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Evasive Partner")).toBeInTheDocument();
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
    expect(screen.getByText("Miraculous Save")).toBeInTheDocument();
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
    expect(screen.getByText("Vow of Friendship")).toBeInTheDocument();
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
    expect(screen.getByText("Healing Descant")).toBeInTheDocument();
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
    expect(screen.getByText("Forager")).toBeInTheDocument();
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
    expect(screen.getByText("Highwayman")).toBeInTheDocument();
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

  it("shows Yukimura's Birthright-only castle recruitment and scaling caveat", () => {
    window.history.replaceState({}, "", "/FE14/Units/Yukimura");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Yukimura", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no one has produced a concrete, accurate data table for Yukimura yet, FFS/i)).toBeInTheDocument();
    expect(screen.getByText("After Chapter 21")).toBeInTheDocument();
    expect(screen.getByText("Lv. 10-15 Mechanist")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Joining stats at Lv. 10" })).toBeInTheDocument();
    expect(screen.getByText(/Puppet Lv\. 3, then a My Castle refresh by waiting/i)).toBeInTheDocument();
    expect(screen.getByText("Ch. 22: Lv. 10")).toBeInTheDocument();
    expect(screen.getByText("Ch. 27: Lv. 15")).toBeInTheDocument();
    expect(screen.getByText(/Level 10 bases \+ \(individual growth rates \+ Mechanist class growth rates\) × levels gained/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be recruited in Conquest or Revelation/i)).toBeInTheDocument();
  });

  it("shows Flora's route-specific castle recruitment, bases, and autolevel rules", () => {
    window.history.replaceState({}, "", "/FE14/Units/Flora");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Flora", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no one has produced a concrete, accurate data table for Flora yet, FFS/i)).toBeInTheDocument();
    expect(screen.getByText("After Chapter 18")).toBeInTheDocument();
    expect(screen.getByText("After Chapter 22")).toBeInTheDocument();
    expect(screen.getByText("Lv. 5-15 Maid")).toBeInTheDocument();
    expect(screen.getByText("Lv. 7-15 Maid")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Joining stats at Lv. 5" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Joining stats at Lv. 7" })).toBeInTheDocument();
    expect(screen.getByText(/Fire Orb Lv\. 3, then a My Castle refresh by waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/Any of Ballista, Fire Orb, or Launcher Lv\. 3, then a My Castle refresh by waiting/i)).toBeInTheDocument();
    expect(screen.getByText("Dagger B, Staff B")).toBeInTheDocument();
    expect(screen.getByText("Dagger C, Staff B")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Friendship Seal (A+)" })).toBeInTheDocument();
    expect(screen.getAllByText("Mercenary")).toHaveLength(2);
    expect(screen.getByText("Dark Mage")).toBeInTheDocument();
    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    const feliciaRow = within(relationships).getByText("Felicia").closest(".support-row") as HTMLElement | null;
    expect(feliciaRow).not.toBeNull();
    expect(within(feliciaRow!).getByText("Mercenary")).toBeInTheDocument();
    expect(within(feliciaRow!).getByLabelText("Already available via Heart Seal")).toBeInTheDocument();
    expect(within(relationships).getByText(/Marked classes are already available through this unit's Heart Seal options/i)).toBeInTheDocument();
    expect(screen.getByText("Ch. 19-22: Lv. 5")).toBeInTheDocument();
    expect(screen.getAllByText("Ch. 23: Lv. 7")).toHaveLength(2);
    expect(screen.getAllByText("Ch. 27: Lv. 15")).toHaveLength(2);
    expect(screen.getAllByText(/Level 5 bases \+ \(individual growth rates \+ Maid class growth rates\) × levels gained/i)).toHaveLength(2);
    expect(screen.getByText(/Revelation's complete milestone schedule and exact weapon-rank milestones still need direct testing/i)).toBeInTheDocument();
  });

  it("shows Fuga's Revelation castle recruitment and unresolved later scaling", () => {
    window.history.replaceState({}, "", "/FE14/Units/Fuga");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Fuga", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no one has produced a concrete, accurate data table for Fuga yet, FFS/i)).toBeInTheDocument();
    expect(screen.getByText("After Chapter 18")).toBeInTheDocument();
    expect(screen.getByText(/Lv\. 10\+ \(scales\) Master Of Arms/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Joining stats at Lv. 10" })).toBeInTheDocument();
    expect(screen.getByText("Sword B, Lance C, Axe C")).toBeInTheDocument();
    expect(screen.getByText(/Hot Spring Lv\. 3, then a My Castle refresh by waiting/i)).toBeInTheDocument();
    expect(screen.getByText("Ch. 19: Lv. 10")).toBeInTheDocument();
    expect(screen.getByText(/Level 10 bases \+ \(individual growth rates \+ Master Of Arms class growth rates\) × levels gained/i)).toBeInTheDocument();
    expect(screen.getByText(/Exact later chapter and weapon-rank milestones still need direct testing/i)).toBeInTheDocument();
    expect(screen.getByText("Female Corrin Talent only")).toBeInTheDocument();
    expect(screen.getByText("Hayato")).toBeInTheDocument();
  });

  it("shows Gunter's temporary deployment, route returns, and Conquest-only supports", () => {
    window.history.replaceState({}, "", "/FE14/Units/Gunter");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Gunter", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Chapter 2")).toHaveLength(3);
    expect(screen.getByText("Chapter 15")).toBeInTheDocument();
    expect(screen.getByText("Chapter 7 (during)")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(3);
    expect(screen.getAllByText("Lv. 3 Great Knight")).toHaveLength(2);
    expect(screen.getByText("Lv. 10 Great Knight")).toBeInTheDocument();
    expect(screen.getByText("Iron Lance")).toBeInTheDocument();
    expect(screen.getByText("Steel Lance, Steel Axe, Javelin, Vulnerary")).toBeInTheDocument();
    expect(screen.getAllByText(/cannot initiate support conversations or receive support bonuses in Revelation/i)).toHaveLength(2);
    expect(screen.getByText(/never returns in Birthright/i)).toBeInTheDocument();
    expect(screen.getByText(/EXP progress, level gains, and weapon proficiency.*remains unverified/i)).toBeInTheDocument();
    expect(screen.getByText("Friendship Seal (A+)")).toBeInTheDocument();
    expect(screen.getByText("Jakob")).toBeInTheDocument();
    expect(screen.getByText("Female Corrin Talent only")).toBeInTheDocument();
    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    expect(within(relationships).getByText(/Support availability:/i)).toBeInTheDocument();
    expect(within(relationships).getByText(/Corrin and Jakob supports are Conquest-only/i)).toBeInTheDocument();
  });

  it("shows Elise's guest deployment, permanent joins, and class access", () => {
    window.history.replaceState({}, "", "/FE14/Units/Elise");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Elise", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Conquest Chapter 6 guest")).toBeInTheDocument();
    expect(screen.getByText("Lv. 4 Troubadour")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText("Chapter 7 (turn 3)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 14")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(3);
    expect(screen.getAllByText("Staff D")).toHaveLength(3);
    expect(screen.getAllByText("Heal, Freeze")).toHaveLength(2);
    expect(screen.getByText("Heal, Mend")).toBeInTheDocument();
    expect(screen.getByText(/staves do not carry forward/i)).toBeInTheDocument();
    expect(screen.getByText("Male Corrin Talent only")).toBeInTheDocument();
    expect(screen.getByText("Lily's Poise")).toBeInTheDocument();
    const eliseHeader = screen.getByRole("heading", { name: "Elise", level: 1 }).closest(".unit-header") as HTMLElement;
    expect(within(eliseHeader).getByText("Available In")).toBeInTheDocument();
    expect(within(eliseHeader).getByText("Conquest, Revelation")).toBeInTheDocument();
    expect(within(eliseHeader).getByText("Dragon Vein")).toBeInTheDocument();
    expect(within(eliseHeader).queryByText("Personal skill")).not.toBeInTheDocument();
    expect(within(eliseHeader).queryByText("Lily's Poise")).not.toBeInTheDocument();
    expect(screen.getByText("Camilla")).toBeInTheDocument();
    expect(screen.getByText("Sakura")).toBeInTheDocument();
  });

  it("shows Arthur's Conquest and Revelation recruitment blocks and seal outcomes", () => {
    window.history.replaceState({}, "", "/FE14/Units/Arthur");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Arthur", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Chapter 7 (turn 4)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 14")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(2);
    expect(screen.getByText("Lv. 7 Fighter")).toBeInTheDocument();
    expect(screen.getByText("Lv. 9 Fighter")).toBeInTheDocument();
    expect(screen.getByText("Iron Axe, Hand Axe")).toBeInTheDocument();
    expect(screen.getByText("Iron Axe")).toBeInTheDocument();
    expect(screen.getAllByText("Axe D")).toHaveLength(2);
    expect(screen.getByText("Misfortunate")).toBeInTheDocument();
    const arthurHeader = screen.getByRole("heading", { name: "Arthur", level: 1 }).closest(".unit-header") as HTMLElement;
    expect(within(arthurHeader).queryByText("Personal skill")).not.toBeInTheDocument();
    expect(within(arthurHeader).queryByText("Misfortunate")).not.toBeInTheDocument();
    expect(screen.getByText("255%")).toBeInTheDocument();
    expect(screen.getAllByText("Outlaw")).toHaveLength(2);
    expect(screen.getByText("Female Corrin Talent only")).toBeInTheDocument();
    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    const friendshipGroup = within(relationships).getByRole("heading", { name: "Friendship Seal (A+)" }).parentElement;
    const noGrantGroup = within(relationships).getByRole("heading", { name: "A support (no class grant)" }).parentElement;
    const partnerGroup = within(relationships).getByRole("heading", { name: "Partner Seal (S)" }).parentElement;
    expect(friendshipGroup).not.toBeNull();
    expect(partnerGroup).not.toBeNull();
    expect(friendshipGroup?.parentElement).toHaveClass("support-column-friendship");
    expect(noGrantGroup?.parentElement).toBe(friendshipGroup?.parentElement);
    expect(partnerGroup?.parentElement).toHaveClass("support-column-partner");
    expect(Array.from(friendshipGroup!.querySelectorAll(".support-row > span:first-child"), (node) => node.textContent)).toEqual([
      "Niles",
      "Benny",
      "Keaton",
      "Azama",
    ]);
    expect(within(noGrantGroup!).getByText("Corrin (M)")).toBeInTheDocument();
    expect(within(noGrantGroup!).getByText("No class grant")).toBeInTheDocument();
    expect(Array.from(partnerGroup!.querySelectorAll(".support-row > span:first-child"), (node) => node.textContent).slice(0, 6)).toEqual([
      "Corrin (F)",
      "Azura",
      "Felicia",
      "Mozu",
      "Camilla",
      "Elise",
    ]);
    const azamaRow = screen.getByText("Azama").closest(".support-row") as HTMLElement | null;
    expect(azamaRow).not.toBeNull();
    expect(within(azamaRow!).getByText("Monk")).toBeInTheDocument();
  });

  it("shows Effie's route joins, growths, and resolved seal fallbacks", () => {
    window.history.replaceState({}, "", "/FE14/Units/Effie");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Effie", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Chapter 7 (turn 4)")).toBeInTheDocument();
    expect(screen.getByText("Chapter 14")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(2);
    expect(screen.getByText("Lv. 6 Knight")).toBeInTheDocument();
    expect(screen.getByText("Lv. 8 Knight")).toBeInTheDocument();
    expect(screen.getAllByText("Iron Lance")).toHaveLength(2);
    expect(screen.getAllByText("Lance D")).toHaveLength(2);
    expect(screen.getByText("Puissance")).toBeInTheDocument();
    expect(screen.getByText("295%")).toBeInTheDocument();
    expect(screen.getByText("Male Corrin Talent only")).toBeInTheDocument();

    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    const friendshipGroup = within(relationships).getByRole("heading", { name: "Friendship Seal (A+)" }).parentElement;
    const noGrantGroup = within(relationships).getByRole("heading", { name: "A support (no class grant)" }).parentElement;
    const partnerGroup = within(relationships).getByRole("heading", { name: "Partner Seal (S)" }).parentElement;
    expect(friendshipGroup).not.toBeNull();
    expect(partnerGroup).not.toBeNull();
    expect(Array.from(friendshipGroup!.querySelectorAll(".support-row > span:first-child"), (node) => node.textContent)).toEqual([
      "Mozu",
      "Elise",
      "Nyx",
      "Hana",
    ]);
    expect(within(noGrantGroup!).getByText("Corrin (F)")).toBeInTheDocument();
    expect(within(noGrantGroup!).getByText("No class grant")).toBeInTheDocument();
    expect(Array.from(partnerGroup!.querySelectorAll(".support-row > span:first-child"), (node) => node.textContent).slice(0, 6)).toEqual([
      "Corrin (M)",
      "Jakob",
      "Silas",
      "Kaze",
      "Xander",
      "Leo",
    ]);
    const azamaRow = within(relationships).getByText("Azama").closest(".support-row") as HTMLElement | null;
    expect(azamaRow).not.toBeNull();
    expect(within(azamaRow!).getByText("Shrine Maiden")).toBeInTheDocument();
    const bennyRow = within(relationships).getByText("Benny").closest(".support-row") as HTMLElement | null;
    expect(bennyRow).not.toBeNull();
    expect(within(bennyRow!).getByText("Fighter")).toBeInTheDocument();
    const eliseRow = within(relationships).getByText("Elise").closest(".support-row") as HTMLElement | null;
    expect(eliseRow).not.toBeNull();
    expect(within(eliseRow!).getByLabelText("Already available via Heart Seal")).toBeInTheDocument();
    const jakobRow = within(relationships).getByText("Jakob").closest(".support-row") as HTMLElement | null;
    expect(jakobRow).not.toBeNull();
    expect(within(jakobRow!).getByLabelText("Already available via Heart Seal")).toBeInTheDocument();
    expect(within(relationships).getByText(/Marked classes are already available through this unit's Heart Seal options/i)).toBeInTheDocument();
  });

  it.each([
    { slug: "Odin", name: "Odin", cards: 2, levels: ["Lv. 5 Dark Mage", "Lv. 12 Dark Mage"], growth: "330%", skill: "Aching Blood" },
    { slug: "Niles", name: "Niles", cards: 2, levels: ["Lv. 8 Outlaw", "Lv. 14 Outlaw"], growth: "285%", skill: "Kidnap" },
    { slug: "Nyx", name: "Nyx", cards: 2, levels: ["Lv. 9 Dark Mage"], growth: "235%", skill: "Countercurse" },
    { slug: "Camilla", name: "Camilla", cards: 3, levels: ["Lv. 1 Malig Knight"], growth: "325%", skill: "Rose's Thorns" },
    { slug: "Selena", name: "Selena", cards: 2, levels: ["Lv. 10 Mercenary"], growth: "250%", skill: "Fierce Rival" },
    { slug: "Beruka", name: "Beruka", cards: 2, levels: ["Lv. 9 Wyvern Rider"], growth: "280%", skill: "Opportunist" },
    { slug: "Laslow", name: "Laslow", cards: 2, levels: ["Lv. 12 Mercenary", "Lv. 16 Mercenary"], growth: "285%", skill: "Fancy Footwork" },
    { slug: "Peri", name: "Peri", cards: 2, levels: ["Lv. 10 Cavalier", "Lv. 16 Cavalier"], growth: "270%", skill: "Bloodthirst" },
    { slug: "Benny", name: "Benny", cards: 2, levels: ["Lv. 15 Knight"], growth: "285%", skill: "Fierce Mien" },
    { slug: "Charlotte", name: "Charlotte", cards: 2, levels: ["Lv. 10 Fighter"], growth: "275%", skill: "Unmask" },
  ])("shows $name's complete first-pass unit data", ({ slug, name, cards, levels, growth, skill }) => {
    window.history.replaceState({}, "", `/FE14/Units/${slug}`);
    render(<App />);

    expect(screen.getByRole("heading", { name, level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(cards);
    for (const levelClass of levels) expect(screen.getAllByText(levelClass).length).toBeGreaterThan(0);
    expect(screen.getByText(growth)).toBeInTheDocument();
    expect(screen.getByText(skill)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Supports and seal grants" })).toBeInTheDocument();
  });

  it.each([
    { slug: "Leo", name: "Leo", cards: 3, levels: ["Lv. 1 Dark Knight", "Lv. 2 Dark Knight"], growth: "325%", skill: "Pragmatic" },
    { slug: "Keaton", name: "Keaton", cards: 2, levels: ["Lv. 15 Wolfskin"], growth: "280%", skill: "Collector" },
    { slug: "Xander", name: "Xander", cards: 3, levels: ["Lv. 3 Paladin", "Lv. 4 Paladin"], growth: "290%", skill: "Chivalry" },
    { slug: "Rinkah", name: "Rinkah", cards: 1, levels: ["Lv. 4 Oni Savage"], growth: "255%", skill: "Fiery Blood" },
    { slug: "Sakura", name: "Sakura", cards: 2, levels: ["Lv. 1 Shrine Maiden", "Lv. 4 + Chapter 5 levels Shrine Maiden"], growth: "310%", skill: "Quiet Strength" },
    { slug: "Hana", name: "Hana", cards: 2, levels: ["Lv. 4 Samurai"], growth: "265%", skill: "Fearsome Blow" },
    { slug: "Subaki", name: "Subaki", cards: 2, levels: ["Lv. 5 Sky Knight"], growth: "250%", skill: "Perfectionist" },
    { slug: "Saizo", name: "Saizo", cards: 2, levels: ["Lv. 7 Ninja", "Lv. 9 Ninja"], growth: "335%", skill: "Pyrotechnics" },
    { slug: "Orochi", name: "Orochi", cards: 2, levels: ["Lv. 5 Diviner", "Lv. 7 Diviner"], growth: "275%", skill: "Capture" },
    { slug: "Hinoka", name: "Hinoka", cards: 3, levels: ["Lv. 8 Sky Knight", "Lv. 17 Sky Knight"], growth: "305%", skill: "Rallying Cry" },
    { slug: "Azama", name: "Azama", cards: 2, levels: ["Lv. 7 Monk", "Lv. 13 Monk"], growth: "310%", skill: "Divine Retribution" },
    { slug: "Setsuna", name: "Setsuna", cards: 2, levels: ["Lv. 3 Archer", "Lv. 11 Archer"], growth: "225%", skill: "Optimist" },
    { slug: "Hayato", name: "Hayato", cards: 2, levels: ["Lv. 1 Diviner", "Lv. 9 Diviner"], growth: "315%", skill: "Pride" },
    { slug: "Oboro", name: "Oboro", cards: 2, levels: ["Lv. 10 Spear Fighter"], growth: "280%", skill: "Nohr Enmity" },
    { slug: "Hinata", name: "Hinata", cards: 2, levels: ["Lv. 10 Samurai"], growth: "235%", skill: "Triple Threat" },
    { slug: "Takumi", name: "Takumi", cards: 3, levels: ["Lv. 11 Archer"], growth: "285%", skill: "Competitive" },
    { slug: "Kagero", name: "Kagero", cards: 2, levels: ["Lv. 10 Ninja"], growth: "260%", skill: "Shuriken Mastery" },
    { slug: "Reina", name: "Reina", cards: 2, levels: ["Lv. 1 Kinshi Knight"], growth: "195%", skill: "Morbid Celebration" },
    { slug: "Kaden", name: "Kaden", cards: 2, levels: ["Lv. 14 Kitsune"], growth: "290%", skill: "Reciprocity" },
    { slug: "Scarlet", name: "Scarlet", cards: 2, levels: ["Lv. 1 Wyvern Lord", "Lv. 3 Wyvern Lord"], growth: "270%", skill: "In Extremis" },
    { slug: "Ryoma", name: "Ryoma", cards: 3, levels: ["Lv. 4 Swordmaster"], growth: "290%", skill: "Bushido" },
  ])("shows $name's review-ready first-pass unit data", ({ slug, name, cards, levels, growth, skill }) => {
    window.history.replaceState({}, "", `/FE14/Units/${slug}`);
    render(<App />);

    expect(screen.getByRole("heading", { name, level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Joining stats" })).toHaveLength(cards);
    for (const levelClass of levels) expect(screen.getAllByText(levelClass).length).toBeGreaterThan(0);
    expect(screen.getByText(growth)).toBeInTheDocument();
    expect(screen.getByText(skill)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Supports and seal grants" })).toBeInTheDocument();
  });

  it("shows Rinkah's Revelation progress return and no-EXP royal guest state", () => {
    window.history.replaceState({}, "", "/FE14/Units/Rinkah");
    const { unmount } = render(<App />);
    expect(screen.getByText(/rejoins at the start of Chapter 9 with her level, EXP, stats, and weapon proficiency from Chapter 5 retained/i)).toBeInTheDocument();
    expect(screen.queryByText(/fixed level 4 Rinkah/i)).not.toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/FE14/Units/Leo");
    render(<App />);
    expect(screen.getByText("Conquest Chapter 6 guest")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText(/displayed level is treated as 18 levels higher/i)).toBeInTheDocument();
  });

  it("shows Sakura's enhanced Revelation template with Chapter 5 progress", () => {
    window.history.replaceState({}, "", "/FE14/Units/Sakura");
    render(<App />);
    expect(screen.getByText("Lv. 4 + Chapter 5 levels Shrine Maiden")).toBeInTheDocument();
    expect(screen.getByText("Staff D + Chapter 5 proficiency gained")).toBeInTheDocument();
    expect(screen.getAllByText(/level 4 stat template and D-rank staff template/i).length).toBeGreaterThan(0);
    const sakuraHeader = screen.getByRole("heading", { name: "Sakura", level: 1 }).closest(".unit-header") as HTMLElement;
    expect(within(sakuraHeader).getByText("Birthright, Revelation")).toBeInTheDocument();
    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    const azamaRow = within(relationships).getByText("Azama").closest(".support-row") as HTMLElement | null;
    expect(azamaRow).not.toBeNull();
    expect(within(azamaRow!).getByText("Apothecary")).toBeInTheDocument();
    expect(within(azamaRow!).queryByLabelText(/Already available/i)).not.toBeInTheDocument();
    const corrinOnlyRow = screen.getByText("Male Corrin Talent only").closest("div") as HTMLElement | null;
    expect(corrinOnlyRow).not.toBeNull();
    expect(within(corrinOnlyRow!).queryByText("Apothecary")).not.toBeInTheDocument();
  });

  it("shows Reina and Scarlet's restricted supports, extra Heart Seal classes, and departure rule", () => {
    window.history.replaceState({}, "", "/FE14/Units/Reina");
    const { unmount } = render(<App />);
    expect(screen.getByText(/Reina supports only Corrin/i)).toBeInTheDocument();
    expect(screen.getByText("Diviner")).toBeInTheDocument();
    expect(screen.getByText("Ninja")).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/FE14/Units/Scarlet");
    render(<App />);
    expect(screen.getByText(/Scarlet supports only Corrin/i)).toBeInTheDocument();
    expect(screen.getByText("WARNING for Revelation player")).toBeInTheDocument();
    expect(screen.getByText(/permanently leaves the playable army at the end of Revelation Chapter 18/i)).toBeInTheDocument();
    expect(screen.getByText(/This warning does not apply to Birthright/i)).toBeInTheDocument();
    expect(screen.getByText("Outlaw")).toBeInTheDocument();
    expect(screen.getByText("Knight")).toBeInTheDocument();
    expect(screen.getByText(/In Revelation only, Scarlet permanently leaves the playable army at the end of Chapter 18/i)).toBeInTheDocument();
    expect(screen.getAllByText(/In Revelation only/i)).toHaveLength(1);
  });

  it("shows Corrin's boon, bane, Talent, and missable Friendship class rules", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Corrin");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Corrin", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Prologue")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Corrin configuration" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Starting base modifiers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personal growth modifiers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cap modifiers" })).toBeInTheDocument();
    const baseModifierTable = screen.getByRole("heading", { name: "Starting base modifiers" }).parentElement?.querySelector("table") as HTMLElement;
    expect(baseModifierTable.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(screen.getAllByText("+15% / -10%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+20% / -15%").length).toBeGreaterThan(0);
    expect(screen.getByText("Missable-class bottleneck")).toBeInTheDocument();
    expect(screen.getByText(/does not choose one A\+ partner/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First-generation Friendship class coverage" })).toBeInTheDocument();
    expect(screen.getByText(/Attack Stance and Guard Stance bonuses are determined by the selected boon and bane/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Attack and Guard Stance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Friendship Seal (same-gender A)" })).toBeInTheDocument();
    expect(screen.getByText(/Dragonstone weapon rank is absent during the early game and appears at D/i)).toBeInTheDocument();
    expect(screen.getAllByText(/male Corrin must marry a female Corrin-exclusive partner/i).length).toBeGreaterThan(0);

    const genderToggle = screen.getByRole("group", { name: "Corrin gender" });
    const malePortrait = screen.getByAltText("Male Corrin portrait");
    const malePortraitSource = malePortrait.getAttribute("src");
    const friendshipGroup = screen.getByRole("heading", { name: "Friendship Seal (same-gender A)" }).closest(".support-group") as HTMLElement;
    const partnerGroup = screen.getByRole("heading", { name: "Partner Seal (S)" }).closest(".support-group") as HTMLElement;
    expect(within(friendshipGroup).getByText("Jakob")).toBeInTheDocument();
    expect(within(friendshipGroup).queryByText("Felicia")).not.toBeInTheDocument();
    expect(within(partnerGroup).getByText("Felicia")).toBeInTheDocument();
    expect(within(partnerGroup).queryByText("Jakob")).not.toBeInTheDocument();

    await user.click(within(genderToggle).getByRole("button", { name: "Female" }));
    expect(screen.getByAltText("Female Corrin portrait").getAttribute("src")).not.toBe(malePortraitSource);
    expect(within(friendshipGroup).getByText("Felicia")).toBeInTheDocument();
    expect(within(friendshipGroup).queryByText("Jakob")).not.toBeInTheDocument();
    expect(within(partnerGroup).getByText("Jakob")).toBeInTheDocument();
    expect(within(partnerGroup).queryByText("Felicia")).not.toBeInTheDocument();

    const startingBoon = screen.getByLabelText("Starting bases boon");
    const startingBane = screen.getByLabelText("Starting bases bane");
    const growthBoon = screen.getByLabelText("Growth and caps boon");
    const growthBane = screen.getByLabelText("Growth and caps bane");
    expect(startingBoon).toHaveValue("robust");
    expect(growthBoon).toHaveValue("robust");
    await user.selectOptions(startingBoon, "quick");
    expect(growthBoon).toHaveValue("quick");
    await user.selectOptions(growthBane, "unlucky");
    expect(startingBane).toHaveValue("unlucky");

    const stanceBoon = screen.getByLabelText("Stance bonuses boon");
    const stanceBane = screen.getByLabelText("Stance bonuses bane");
    expect(stanceBoon).toHaveValue("quick");
    expect(stanceBane).toHaveValue("unlucky");
    const stanceSection = screen.getByRole("heading", { name: "Attack and Guard Stance" }).closest("section") as HTMLElement;
    const stanceRows = within(stanceSection).getAllByRole("row");
    expect(stanceRows[1]).toHaveTextContent("No supportHit rate +10Dodge +5");
    expect(stanceRows[2]).toHaveTextContent("CAvoid +5Luck +1");
    expect(stanceRows[3]).toHaveTextContent("BCritical +3Defense +1");
    expect(stanceRows[4]).toHaveTextContent("AAvoid +5Speed +1");
    expect(stanceRows[5]).toHaveTextContent("SHit rate +5, Critical +3Speed +1, Resistance +1");
    await user.selectOptions(stanceBoon, "clever");
    expect(startingBoon).toHaveValue("clever");

    const nativeClassAccess = screen.getByRole("heading", { name: "Native class access" }).parentElement?.parentElement as HTMLElement;
    const talent = screen.getByLabelText("Corrin Talent");
    expect(talent).toHaveValue("cavalier");
    expect(within(nativeClassAccess).getByText("Cavalier")).toBeInTheDocument();
    expect(within(nativeClassAccess).getAllByText("Nohr Princess").length).toBeGreaterThan(0);
    expect(within(nativeClassAccess).queryByText("Female Corrin Talent only")).not.toBeInTheDocument();
    await user.selectOptions(talent, "priest");
    expect(within(nativeClassAccess).getByText("Shrine Maiden")).toBeInTheDocument();
    expect(screen.getByText(/Shrine Maiden → Priestess \/ Onmyoji/)).toBeInTheDocument();
    await user.selectOptions(talent, "dragon");
    expect(within(nativeClassAccess).getByText("Wyvern Rider")).toBeInTheDocument();
    expect(screen.getByText("Dragon", { selector: "dt" }).closest("div")).toHaveAttribute("aria-current", "true");
    expect(within(screen.getByRole("table", { name: "Corrin missing class access" })).queryByText("Wyvern Rider")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Already available via Heart Seal").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Corrin JSON tree")).toBeInTheDocument();
    expect(screen.getAllByText('"missable_class_access"').length).toBeGreaterThan(0);
  });

  it("covers every legal Corrin boon and bane stance combination exactly once", () => {
    const config = fe14Data.units.find((unit) => unit.identity.id === "corrin")?.avatarConfiguration;
    expect(config).not.toBeNull();
    expect(config).toBeDefined();
    if (!config) return;

    for (const boon of config.boons) {
      for (const bane of config.banes.filter((choice) => choice.stat !== boon.stat)) {
        const attackMatches = config.pairupRule.attackStance.variants.filter(
          (variant) => variant.boonIds.includes(boon.id) && variant.baneIds.includes(bane.id),
        );
        const guardMatches = config.pairupRule.guardStance.variants.filter(
          (variant) => variant.boonId === boon.id && variant.baneId === bane.id,
        );
        expect(attackMatches, `${boon.id}/${bane.id} Attack Stance lookup`).toHaveLength(1);
        expect(guardMatches, `${boon.id}/${bane.id} Guard Stance lookup`).toHaveLength(1);
      }
    }
  });

  it("separates Anna's DLC NPC scaling from her fixed recruited data", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units");
    const { unmount } = render(<App />);
    await user.selectOptions(screen.getByLabelText("Route roster"), "dlc");
    expect(screen.getByText("Anna", { selector: ".unit-directory-name" })).toBeInTheDocument();
    expect(screen.getByText("DLC-exclusive", { selector: ".unit-directory-category" })).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/FE14/Units/Anna");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Anna", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("DLC: Birthright, Conquest, Revelation")).toBeInTheDocument();
    expect(screen.getByText("Lv. 10 Outlaw")).toBeInTheDocument();
    expect(screen.getByText("Bow C")).toBeInTheDocument();
    expect(screen.getByText("Arms Scroll")).toBeInTheDocument();
    expect(screen.getByText("Clear Anna on the Run for the first time")).toBeInTheDocument();
    expect(screen.getByText(/NPC Anna scales from level 10.*level 18/i)).toBeInTheDocument();
    expect(screen.getAllByText(/recruited Anna.*fixed level 10/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Make a Killing")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A support (no class grant)" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Friendship Seal (A+)" })).not.toBeInTheDocument();
  });

  it("keeps Corrin's same-gender A-support class access one-way", () => {
    for (const unitId of ["azura", "mozu", "anna"]) {
      const unit = fe14Data.units.find((candidate) => candidate.identity.id === unitId);
      expect(unit?.classAccess?.sealGrants.some(
        (grant) => grant.supportRelationshipId === `${unitId}__corrin_female`,
      )).toBe(false);
      expect(unit?.classAccess?.sealGrants.some(
        (grant) => grant.supportRelationshipId === `${unitId}__corrin_male` && grant.seal === "partner",
      )).toBe(true);
    }
  });

  it("keeps Selena and Beruka's Conquest-only half-rank proficiency separate from Revelation", () => {
    window.history.replaceState({}, "", "/FE14/Units/Selena");
    const { unmount } = render(<App />);
    expect(screen.getByText("Sword D (50% to C)")).toBeInTheDocument();
    expect(screen.getByText("Sword D")).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/FE14/Units/Beruka");
    render(<App />);
    expect(screen.getByText("Axe D (50% to C)")).toBeInTheDocument();
    expect(screen.getByText("Axe D")).toBeInTheDocument();
  });

  it("shows both Corrin Partner Seal paths for Niles", () => {
    window.history.replaceState({}, "", "/FE14/Units/Niles");
    render(<App />);

    expect(screen.getByText("Corrin Talent only")).toBeInTheDocument();
    const relationships = screen.getByRole("region", { name: "Supports and seal grants" });
    const partnerGroup = within(relationships).getByRole("heading", { name: "Partner Seal (S)" }).parentElement;
    expect(partnerGroup).not.toBeNull();
    expect(Array.from(partnerGroup!.querySelectorAll(".support-row > span:first-child"), (node) => node.textContent).filter((name) => name?.startsWith("Corrin ("))).toEqual([
      "Corrin (F)",
      "Corrin (M)",
    ]);
  });
});
