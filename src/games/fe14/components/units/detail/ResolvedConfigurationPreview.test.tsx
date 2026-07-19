import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fe14Data } from "../../../data";
import { resolveUnitBaseConfiguration } from "../../../baseConfiguration";
import ResolvedConfigurationPreview, { BaseConfigurationSurface } from "./ResolvedConfigurationPreview";

function unit(unitId: string) {
  return fe14Data.units.find((entry) => entry.identity.id === unitId)!;
}

describe("resolved configuration preview", () => {
  it("switches Silas's complete resolved snapshot with the route tabs", async () => {
    const user = userEvent.setup();
    render(
      <ResolvedConfigurationPreview
        avatarGender="male"
        avatarSelection={null}
        setAvatarGender={vi.fn()}
        unit={unit("silas")}
      />,
    );

    expect(screen.getByRole("tab", { name: "Birthright" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table", { name: "Stat profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Joining stats").querySelector(".resolved-stat-total")).toHaveTextContent("72");
    expect(screen.getByLabelText("Effective growth rates").querySelector("dd")).toHaveTextContent("50%");
    expect(screen.getByLabelText("Effective growth rates").querySelector(".resolved-stat-total")).toHaveTextContent("360%");
    expect(screen.getByLabelText("Cap modifiers").querySelectorAll("dd")).toHaveLength(9);
    expect(screen.getByLabelText("Cap modifiers").querySelector(".resolved-stat-total")).toHaveTextContent("—");
    expect(screen.getByRole("table", { name: "Support stance bonuses" })).toBeInTheDocument();
    expect(screen.getByLabelText("Attack Stance").querySelectorAll('[role="cell"]')).toHaveLength(5);
    expect(screen.getByLabelText("Guard Stance").querySelectorAll('[role="cell"]')).toHaveLength(5);
    const skills = screen.getByRole("heading", { name: "Starting skills" }).parentElement!;
    const inventory = screen.getByRole("heading", { name: "Inventory" }).parentElement!;
    expect(skills.nextElementSibling).toBe(inventory);
    expect([...skills.querySelectorAll("strong")].map((element) => element.textContent).slice(0, 2)).toEqual([
      "Vow of Friendship",
      "Elbow Room",
    ]);
    expect(skills).toHaveTextContent("Personal skillInnate");
    expect(skills).toHaveTextContent("Cavalier classLevel 1");
    expect(skills).not.toHaveTextContent("Verified history");
    await user.click(screen.getByRole("tab", { name: "Individual" }));
    expect(screen.getByLabelText("Individual growth rates").querySelector("dd")).toHaveTextContent("40%");
    expect(screen.getByLabelText("Individual growth rates").querySelector(".resolved-stat-total")).toHaveTextContent("285%");
    await user.click(screen.getByRole("tab", { name: "Conquest" }));

    expect(screen.getByRole("tab", { name: "Conquest" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Chapter 7, during")).toBeInTheDocument();
    await user.click(screen.getByText("Inspect resolved object"));
    expect(screen.getByLabelText("Silas resolved configuration JSON")).toHaveTextContent(
      /"availabilityId": "silas\.conquest"/,
    );
    expect(screen.getByLabelText("Silas resolved configuration JSON")).toHaveTextContent(
      /"iron_sword"/,
    );
  });

  it("lets Kaze switch between his Conquest appearance and rejoin states", async () => {
    const user = userEvent.setup();
    render(
      <ResolvedConfigurationPreview
        avatarGender="male"
        avatarSelection={null}
        setAvatarGender={vi.fn()}
        unit={unit("kaze")}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Conquest" }));
    expect(screen.getByRole("tab", { name: "Conquest" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: /Pre-route.*Chapter 4/ }));
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getAllByText("Chapter 4, start")).toHaveLength(2);
  });

  it("updates Rinkah's state by route and warns for non-permanent Conquest units", async () => {
    const user = userEvent.setup();
    const view = render(
      <ResolvedConfigurationPreview
        avatarGender="male"
        avatarSelection={null}
        setAvatarGender={vi.fn()}
        unit={unit("rinkah")}
      />,
    );

    expect(screen.getByText("Join")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Conquest" }));
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    const rinkahWarning = screen.getByText(/Warning: Rinkah is not a permanent unit on Conquest/);
    expect(rinkahWarning).toHaveClass("is-warning");
    expect(rinkahWarning.closest("ul")?.previousElementSibling).toHaveClass("resolved-config-controls");

    view.rerender(
      <ResolvedConfigurationPreview
        avatarGender="male"
        avatarSelection={null}
        setAvatarGender={vi.fn()}
        unit={unit("sakura")}
      />,
    );
    await user.click(screen.getByRole("tab", { name: "Conquest" }));
    expect(screen.getByText(/Warning: Sakura is not a permanent unit on Conquest/)).toHaveClass("is-warning");
  });

  it("renders one-route units as a non-interactive route label", () => {
    render(
      <ResolvedConfigurationPreview
        avatarGender="male"
        avatarSelection={null}
        setAvatarGender={vi.fn()}
        unit={unit("yukimura")}
      />,
    );

    expect(screen.getByLabelText("Only available route")).toHaveTextContent("Birthright");
    expect(screen.queryByRole("tablist", { name: "Resolved route" })).not.toBeInTheDocument();
  });

  it("exposes offspring timing, base growth, parent growth, and Offspring Seal controls", () => {
    const dwyer = unit("dwyer");
    const onStoryChapterChange = vi.fn();
    const onPromotionClassChange = vi.fn();
    const baseline = resolveUnitBaseConfiguration(dwyer, { routeId: "conquest" });
    const promoted = resolveUnitBaseConfiguration(dwyer, {
      routeId: "conquest",
      offspringStoryChapter: 24,
      offspringPromotionClassId: "strategist",
    });
    const view = render(
      <BaseConfigurationSurface
        onOffspringPromotionClassChange={onPromotionClassChange}
        onOffspringStoryChapterChange={onStoryChapterChange}
        onRouteChange={vi.fn()}
        resolution={baseline}
        unit={dwyer}
      />,
    );

    expect(screen.getByText("Earliest: Ch. 8")).toBeInTheDocument();
    expect(screen.getByLabelText("Child growth rates before parent inheritance")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Child and variable parent growth rates" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Offspring recruitment story position"), { target: { value: "11" } });
    expect(onStoryChapterChange).toHaveBeenCalledWith(19);

    view.rerender(
      <BaseConfigurationSurface
        onOffspringPromotionClassChange={onPromotionClassChange}
        onOffspringStoryChapterChange={onStoryChapterChange}
        onRouteChange={vi.fn()}
        resolution={promoted}
        unit={dwyer}
      />,
    );
    expect(screen.getByLabelText("Offspring Seal class")).toHaveValue("strategist");
    fireEvent.change(screen.getByLabelText("Offspring Seal class"), { target: { value: "attendant" } });
    expect(onPromotionClassChange).toHaveBeenCalledWith("attendant");
  });
});
