import type { AvatarChoice, StatBlock, UnitRuntime } from "../../../data";

export const STAT_KEYS: Array<keyof StatBlock> = [
  "hp",
  "strength",
  "magic",
  "skill",
  "speed",
  "luck",
  "defense",
  "resistance",
];

export type AvatarGender = "male" | "female";
export type AvailabilityScenario = UnitRuntime["availability"][number];
export type AvatarTalent = NonNullable<UnitRuntime["avatarConfiguration"]>["talents"][number];

export type AvatarSelection = {
  config: NonNullable<UnitRuntime["avatarConfiguration"]>;
  boon: AvatarChoice;
  bane: AvatarChoice;
  talent: AvatarTalent;
  gender: AvatarGender;
  boonId: string;
  baneId: string;
  talentId: string;
  setBoonId: (id: string) => void;
  setBaneId: (id: string) => void;
  setTalentId: (id: string) => void;
  setGender: (gender: AvatarGender) => void;
};

export type PairupTableBonuses = {
  attackStance: { baseBonus: Record<string, number>; rankDeltas: Record<string, Record<string, number>> };
  guardStance: { baseBonus: Record<string, number>; rankDeltas: Record<string, Record<string, number>> };
};
