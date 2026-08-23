import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { fe14Data } from "./games/fe14/data";
import { fe6Units } from "./games/fe6/data";
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
    expect(screen.getByRole("link", { name: /Fire Emblem: The Binding Blade/ })).toHaveAttribute("href", "/FE6/Units");
    expect(screen.getByText("v0.8.0")).toBeInTheDocument();
    expect(screen.getByText("FE14 weapon and item directory")).toBeInTheDocument();
    expect(screen.getAllByText(/^v\d/)).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "View complete history" }));
    expect(screen.getByText("v0.0.1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show newest releases only" })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the FE6 directories, unit profile, class profile, and weapons without changing FE14 routes", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE6/Units");
    const view = render(<App />);

    expect(screen.getByRole("heading", { name: "FE6 Units", level: 1 })).toBeInTheDocument();
    expect(view.container.querySelectorAll(".fe6-unit-directory-card")).toHaveLength(fe6Units.length);
    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByText("简体中文"));
    expect(screen.getByText("罗伊", { selector: ".fe6-unit-directory-card strong" })).toBeInTheDocument();
    const royCard = screen.getByText("罗伊", { selector: ".fe6-unit-directory-card strong" }).closest(".fe6-unit-directory-card") as HTMLElement;
    expect(royCard).toHaveTextContent("领主");
    expect(royCard).toHaveTextContent("第1章");
    expect(royCard).not.toHaveTextContent("Ch. 1");
    expect(screen.getByText(/非官方民间译名/)).toHaveTextContent("火花天龙剑");
    expect(screen.getByRole("link", { name: "火花天龙剑" })).toHaveAttribute("href", "http://www.k73.com/3ds/19454-2.html");
    await user.click(screen.getByRole("link", { name: /罗伊/ }));
    expect(screen.getByRole("heading", { name: "罗伊", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "角色详情", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText("初始职业")).toHaveLength(2);
    expect(screen.getByText("初始物品")).toBeInTheDocument();
    expect(screen.getByText("属性一览")).toBeInTheDocument();
    expect(screen.getByText("武器等级")).toBeInTheDocument();
    expect(screen.getByText("支援属性计算器")).toBeInTheDocument();
    expect(screen.getByText("资料来源")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "FE6 单位" }));
    await user.type(screen.getByLabelText("搜索人物"), "罗伊");
    expect(view.container.querySelectorAll(".fe6-unit-directory-card")).toHaveLength(1);
    await user.clear(screen.getByLabelText("搜索人物"));
    await user.click(screen.getByRole("button", { name: "语言" }));
    await user.click(screen.getByText("English"));
    await user.type(screen.getByLabelText("Search roster"), "Thite");
    expect(view.container.querySelectorAll(".fe6-unit-directory-card")).toHaveLength(1);
    expect(screen.getByText("Thea")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search roster"));
    await user.click(screen.getByRole("link", { name: /Roy/ }));
    expect(window.location.pathname).toBe("/FE6/Units/roy");
    expect(screen.getByRole("heading", { name: "Roy", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Character Profile", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Supports", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /stat profile/i })).toBeInTheDocument();
    expect(screen.getByText("Weapon levels")).toBeInTheDocument();
    expect(screen.getByText("Rapier")).toBeInTheDocument();
    expect(screen.getByText("Vulnerary")).toBeInTheDocument();
    expect(view.container.querySelectorAll(".fe6-starting-item img")).toHaveLength(2);
    expect(screen.getByLabelText("Support partner")).toHaveValue("alen");
    await user.selectOptions(screen.getByLabelText("Support rank"), "A");
    expect(screen.getByText(/Roy.*Alen at rank A/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "JSON" }));
    expect(screen.getByLabelText("Roy JSON tree")).toBeInTheDocument();

    window.history.pushState({}, "", "/FE6/Classes");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "FE6 Classes", level: 1 })).toBeInTheDocument());
    expect(view.container.querySelectorAll(".fe6-class-record")).toHaveLength(67);
    expect(screen.getAllByText("Master Lord").length).toBeGreaterThanOrEqual(1);
    const lordClassRecord = screen.getByText("Lord", { selector: ".fe6-class-identity strong" }).closest(".fe6-class-record") as HTMLElement;
    const lordRankSection = within(lordClassRecord).getByRole("heading", { name: "Base Weapon Ranks" }).closest(".fe6-class-ranks") as HTMLElement;
    expect(lordRankSection).toHaveTextContent("Sword D, Promotion: Sword +3");
    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByText("简体中文"));
    expect(screen.getByRole("heading", { name: "FE6 职业", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("领主")).toBeInTheDocument();
    expect(screen.getAllByText("初始武器等级").length).toBeGreaterThan(0);
    expect(screen.getAllByText("力量/魔法").length).toBeGreaterThan(0);
    expect(screen.getAllByText("转职加成:", { selector: ".fe6-inline-ranks strong" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("可令一名己方单位再动")).toHaveLength(2);
    expect(screen.getAllByText("马背单位")).toHaveLength(10);
    expect(screen.getAllByText("飞行单位")).toHaveLength(6);
    await user.type(screen.getByLabelText("搜索职业"), "大领主");
    expect(view.container.querySelectorAll(".fe6-class-record")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "语言" }));
    await user.click(screen.getByText("English"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "FE6 Classes", level: 1 })).toBeInTheDocument());
    expect(document.documentElement).toHaveAttribute("lang", "en");

    window.history.pushState({}, "", "/FE6/Weapons");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(screen.getByRole("heading", { name: "FE6 Weapons & Items", level: 1 })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Staves" }));
    expect(screen.getByText("Warp")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByText("简体中文"));
    expect(screen.getByRole("heading", { name: "FE6 武器与道具", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "杖" })).toBeInTheDocument();
    expect(screen.getByText("传送")).toBeInTheDocument();
    expect(screen.getByText(/将一名同伴传送/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "道具" }));
    expect(screen.getByText("天使之衣")).toBeInTheDocument();
    expect(screen.getByText("最大HP\+7")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "语言" }));
    await user.click(screen.getByText("English"));
  }, 15_000);

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

    await user.click(screen.getByText("FE14"));
    await user.click(await screen.findByRole("link", { name: "Class Skills" }));
    expect(window.location.pathname).toBe("/FE14/Skills");
    expect(screen.getByRole("heading", { name: "FE14 Class Skills", level: 1 })).toBeInTheDocument();
    // Monk/Great Master are hidden on the directory (duplicates of Shrine Maiden/Priestess),
    // removing their two rows plus the redundant Onmyoji row under the Monk tree.
    expect(view.container.querySelectorAll(".class-skill-class-row input[type='checkbox']")).toHaveLength(62);
    expect(view.container.querySelectorAll(".class-skill-result")).toHaveLength(106);
    expect(screen.getByRole("checkbox", { name: "Shrine Maiden/Monk" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Monk" })).not.toBeInTheDocument();
  });

  it("filters the personal-skill directory by route, generation, and substring search", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units");
    const view = render(<App />);

    await user.click(screen.getByText("FE14"));
    await user.click(await screen.findByRole("link", { name: "Personal Skills" }));
    expect(window.location.pathname).toBe("/FE14/PersonalSkills");
    expect(screen.getByRole("heading", { name: "FE14 Personal Skills", level: 1 })).toBeInTheDocument();

    // Every unit with a personal skill is listed by default.
    const total = fe14Data.units.filter((unit) => unit.personalSkill !== null).length;
    expect(view.container.querySelectorAll(".personal-skill-result")).toHaveLength(total);

    // Character-name substring search narrows to a single unit.
    await user.type(screen.getByLabelText("Search character names"), "Felicia");
    expect(view.container.querySelectorAll(".personal-skill-result")).toHaveLength(1);
    expect(screen.getByText("Felicia")).toBeInTheDocument();
  });

  it("renders Felicia through the shared base configuration and keeps JSON inspection", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/FE14/Units/Felicia");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Felicia", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Character Profile", level: 2 })).toBeInTheDocument();
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
    expect(screen.getByRole("complementary", { name: "Classes that can only be obtained via S supporting female Corrin with the corresponding talent" })).toBeInTheDocument();
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
    const relationships = screen.getByRole("region", { name: "Supports and Reclass Options" });
    await user.click(within(relationships).getByRole("radio", { name: "Preview Peri Friendship Seal class skills" }));
    expect(within(sources).getByText("Friendship: Peri")).toBeInTheDocument();
    expect(within(skills).getByText("Cavalier")).toBeInTheDocument();

    await user.click(within(relationships).getByRole("radio", { name: "Preview Niles Partner Seal class skills" }));
    expect(within(sources).getByText("Partner: Niles")).toBeInTheDocument();
    expect(within(skills).getByText("Outlaw")).toBeInTheDocument();
  });
});
