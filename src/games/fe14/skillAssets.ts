const personalSkillIconModules = import.meta.glob<string>(
  "./assets/personal_skill_icons/*.png",
  { eager: true, import: "default", query: "?url" },
);

const classSkillIconModules = import.meta.glob<string>(
  "./assets/class_skill_icons/*.png",
  { eager: true, import: "default", query: "?url" },
);

export function getPersonalSkillIconUrl(assetId: string): string {
  const assetPath = `./assets/personal_skill_icons/${assetId}.png`;
  const assetUrl = personalSkillIconModules[assetPath];

  if (!assetUrl) {
    throw new Error(`Missing FE14 personal-skill icon asset: ${assetId}`);
  }

  return assetUrl;
}

export function getClassSkillIconUrl(assetId: string): string {
  const assetPath = `./assets/class_skill_icons/${assetId}.png`;
  const assetUrl = classSkillIconModules[assetPath];

  if (!assetUrl) {
    throw new Error(`Missing FE14 class-skill icon asset: ${assetId}`);
  }

  return assetUrl;
}
