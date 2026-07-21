import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fe14Data } from "../../data";
import ClassSkillBrowser from "./ClassSkillBrowser";
import { LocaleProvider } from "../../../../i18n/LocaleContext";

const allClassIds = new Set(fe14Data.classDirectory.flatMap((tree) => [
  tree.id,
  ...tree.promotions.map((promotion) => promotion.id),
]));

function renderBrowser(availableClassIds: ReadonlySet<string> = allClassIds) {
  return render(
    <LocaleProvider>
      <ClassSkillBrowser
        availableClassIds={availableClassIds}
        classTrees={fe14Data.classDirectory}
        classSkills={fe14Data.classSkills}
        skillsByClass={fe14Data.skillsByClass}
        scope="directory"
      />
    </LocaleProvider>,
  );
}

describe("FE14 class skill browser", () => {
  it("shows every standard class and deduplicates shared skills", () => {
    const view = renderBrowser();

    const classRows = [...view.container.querySelectorAll<HTMLElement>("[data-class-id]")];
    expect(view.container.querySelectorAll(".class-skill-class-row input[type='checkbox']")).toHaveLength(65);
    expect(new Set(classRows.map((row) => row.dataset.classId)).size).toBe(55);
    expect(view.container.querySelectorAll(".class-skill-result")).toHaveLength(106);
    expect(view.container.querySelectorAll(".class-skill-icon")).toHaveLength(106);

    const locktouch = screen.getByText("Locktouch").closest(".class-skill-result") as HTMLElement;
    expect(within(locktouch).getByText("Ninja · Lv. 1")).toBeInTheDocument();
    expect(within(locktouch).getByText("Outlaw · Lv. 1")).toBeInTheDocument();
  });

  it("filters acquisitions by faction while preserving the mixed Noble hierarchy", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("button", { name: "Hoshidan Class" }));
    expect(screen.getByRole("checkbox", { name: "Hoshido Noble" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Nohr Noble" })).not.toBeInTheDocument();
    expect(screen.getByText("Nohr Prince / Princess")).toHaveClass("class-skill-context-label");
    let locktouch = screen.getByText("Locktouch").closest(".class-skill-result") as HTMLElement;
    expect(within(locktouch).getByText("Ninja · Lv. 1")).toBeInTheDocument();
    expect(within(locktouch).queryByText("Outlaw · Lv. 1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nohrian Class" }));
    expect(screen.getByRole("checkbox", { name: "Nohr Noble" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Hoshido Noble" })).not.toBeInTheDocument();
    locktouch = screen.getByText("Locktouch").closest(".class-skill-result") as HTMLElement;
    expect(within(locktouch).getByText("Outlaw · Lv. 1")).toBeInTheDocument();
    expect(within(locktouch).queryByText("Ninja · Lv. 1")).not.toBeInTheDocument();
  });

  it("shows complete overlapping trees in the Special Class filter", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("button", { name: "Special Class" }));
    for (const className of [
      "Nohr Prince / Princess",
      "Nohr Noble",
      "Hoshido Noble",
      "Songstress",
      "Villager",
      "Kitsune",
      "Wolfskin",
    ]) {
      expect(screen.getByRole("checkbox", { name: className })).toBeChecked();
    }
    expect(screen.queryByRole("checkbox", { name: "Cavalier" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hoshidan Class" }));
    expect(screen.getByRole("checkbox", { name: "Villager" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Kitsune" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Wolfskin" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nohrian Class" }));
    expect(screen.getByRole("checkbox", { name: "Wolfskin" })).toBeInTheDocument();
  });

  it("keeps child selections when a class tree is folded", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("button", { name: "Collapse Ninja promotions" }));
    expect(screen.queryByRole("checkbox", { name: "Master Ninja" })).not.toBeInTheDocument();
    expect(screen.getByText("Lethality")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand Ninja promotions" }));
    expect(screen.getByRole("checkbox", { name: "Master Ninja" })).toBeChecked();
  });

  it("toggles each acquisition class independently", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("checkbox", { name: "Ninja" }));
    let locktouch = screen.getByText("Locktouch").closest(".class-skill-result") as HTMLElement;
    expect(within(locktouch).queryByText("Ninja · Lv. 1")).not.toBeInTheDocument();
    expect(within(locktouch).getByText("Outlaw · Lv. 1")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Outlaw" }));
    expect(screen.queryByText("Locktouch")).not.toBeInTheDocument();
  });

  it("searches skill-name substrings and retains each matching class tree", async () => {
    const user = userEvent.setup();
    renderBrowser();

    const search = screen.getByRole("searchbox", { name: "Search skill names" });
    await user.type(search, "Locktouch");
    expect(screen.getByRole("checkbox", { name: "Ninja" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Outlaw" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Cavalier" })).not.toBeInTheDocument();
    expect(screen.getByText("Poison Strike")).toBeInTheDocument();
    expect(screen.getByText("Movement +1")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "Lock");
    expect(screen.getByText("Locktouch")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "Locksmith");
    expect(screen.getByText("No matching class trees.")).toBeInTheDocument();
  });

  it("searches class-name substrings and retains the full class tree", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.type(screen.getByRole("searchbox", { name: "Search class names" }), "mast nin");
    expect(screen.getByRole("checkbox", { name: "Ninja" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Master Ninja" })).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox", { name: "Mechanist" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("checkbox", { name: "Outlaw" })).not.toBeInTheDocument();
    expect(screen.getByText("Golembane")).toBeInTheDocument();
  });

  it("selects and deselects the complete visible scope", async () => {
    const user = userEvent.setup();
    const view = renderBrowser();

    await user.click(screen.getByRole("button", { name: "Deselect all" }));
    expect(view.container.querySelectorAll(".class-skill-class-row input:checked")).toHaveLength(0);
    expect(screen.getByText("No class skills selected.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(view.container.querySelectorAll(".class-skill-result")).toHaveLength(106);
  });

  it("selects a complete class tree and exposes partial group state", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.click(screen.getByRole("checkbox", { name: "Deselect Ninja class tree" }));
    expect(screen.getByRole("checkbox", { name: "Ninja" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Master Ninja" })).not.toBeChecked();
    screen.getAllByRole("checkbox", { name: "Mechanist" }).forEach((checkbox) => expect(checkbox).not.toBeChecked());
    const locktouch = screen.getByText("Locktouch").closest(".class-skill-result") as HTMLElement;
    expect(within(locktouch).queryByText("Ninja · Lv. 1")).not.toBeInTheDocument();
    expect(within(locktouch).getByText("Outlaw · Lv. 1")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select Ninja class tree" }));
    await user.click(screen.getByRole("checkbox", { name: "Ninja" }));
    const groupCheckbox = screen.getByRole("checkbox", { name: "Select Ninja class tree" }) as HTMLInputElement;
    expect(groupCheckbox.indeterminate).toBe(true);
  });

  it("prunes unit-profile scope and adds newly available classes as selected", async () => {
    const ninjaClasses = new Set(["ninja", "master_ninja"]);
    const view = renderBrowser(ninjaClasses);

    expect(view.container.querySelectorAll(".class-skill-class-row input[type='checkbox']")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "Ninja" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Master Ninja" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Mechanist" })).not.toBeInTheDocument();
    expect(view.container.querySelectorAll(".class-skill-result")).toHaveLength(4);

    view.rerender(
      <LocaleProvider>
        <ClassSkillBrowser
          availableClassIds={new Set([...ninjaClasses, "outlaw"])}
          classTrees={fe14Data.classDirectory}
          classSkills={fe14Data.classSkills}
          skillsByClass={fe14Data.skillsByClass}
          scope="unit-profile"
        />
      </LocaleProvider>,
    );
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Outlaw" })).toBeChecked());
  });

  it("shows gender conditions on Troubadour acquisitions", () => {
    renderBrowser(new Set(["troubadour"]));

    const gentilhomme = screen.getByText("Gentilhomme").closest(".class-skill-result") as HTMLElement;
    const demoiselle = screen.getByText("Demoiselle").closest(".class-skill-result") as HTMLElement;
    expect(within(gentilhomme).getByText("Troubadour · Lv. 10 · Male only")).toBeInTheDocument();
    expect(within(demoiselle).getByText("Troubadour · Lv. 10 · Female only")).toBeInTheDocument();
  });
});
