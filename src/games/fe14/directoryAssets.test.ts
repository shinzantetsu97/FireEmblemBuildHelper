import { describe, expect, it } from "vitest";
import { fe14Data } from "./data";
import { getDirectoryIconUrl } from "./directoryAssets";

describe("FE14 directory icons", () => {
  it("resolves a local icon for every weapon and item", () => {
    for (const entry of [...fe14Data.weapons, ...fe14Data.items]) {
      expect(getDirectoryIconUrl(entry.iconSource.imageUrl)).toContain("/directory_icons/");
    }
  });
});
