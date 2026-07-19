import { readFile, writeFile } from "node:fs/promises";

const BASE_STATS_PATH = "data/normalized/fe14/unit-base-stats.json";
const CLASS_SKILLS_PATH = "data/normalized/fe14/class-skills.json";
const PERSONAL_SKILLS_PATH = "data/normalized/fe14/personal-skills.json";

const CLASS_ALIASES: Record<string, string> = {
  maid: "attendant",
  butler: "attendant",
};

const LEGACY_SKILL_IDS: Record<string, string> = {
  skill_2: "skill_plus_2",
  magic_2: "magic_plus_2",
  strength_2: "strength_plus_2",
  optimist: "optimistic",
};

type SourceRef = { fields: string[] } & Record<string, unknown>;
type BaseRecord = {
  unitId: string;
  level: number;
  classId: string;
  startingSkillIds?: string[];
  startingSkillOverrideIds?: string[];
  provenance: SourceRef[];
} & Record<string, unknown>;

type ClassSkill = {
  id: string;
  acquisition: Array<{ classId: string; level: number }>;
};

type PersonalSkill = { id: string; unitId: string };

const [baseRecords, classSkillFile, personalSkills] = await Promise.all([
  readJson<BaseRecord[]>(BASE_STATS_PATH),
  readJson<{ skills: ClassSkill[] }>(CLASS_SKILLS_PATH),
  readJson<PersonalSkill[]>(PERSONAL_SKILLS_PATH),
]);

const personalSkillByUnit = new Map(personalSkills.map((skill) => [skill.unitId, skill.id]));
const knownClassSkillIds = new Set(classSkillFile.skills.map((skill) => skill.id));

let overrideCount = 0;
for (const record of baseRecords) {
  const classId = CLASS_ALIASES[record.classId] ?? record.classId;
  const derivable = new Set(classSkillFile.skills
    .filter((skill) => skill.acquisition.some((edge) => edge.classId === classId && edge.level <= record.level))
    .map((skill) => skill.id));
  const personalSkillId = personalSkillByUnit.get(record.unitId);
  const verifiedIds = (record.startingSkillIds ?? record.startingSkillOverrideIds ?? [])
    .map((skillId) => LEGACY_SKILL_IDS[skillId] ?? skillId);
  const overrides = verifiedIds.filter((skillId, index, values) => (
    skillId !== personalSkillId
    && !derivable.has(skillId)
    && values.indexOf(skillId) === index
  ));

  for (const skillId of overrides) {
    if (!knownClassSkillIds.has(skillId)) {
      throw new Error(`Unknown starting-skill override ${skillId} for ${record.unitId}.`);
    }
  }

  delete record.startingSkillIds;
  if (overrides.length) {
    record.startingSkillOverrideIds = overrides;
    overrideCount += overrides.length;
  } else {
    delete record.startingSkillOverrideIds;
  }

  for (const source of record.provenance) {
    source.fields = source.fields.flatMap((field) => {
      if (field !== "startingSkillIds") return [field];
      return overrides.length ? ["startingSkillOverrideIds"] : [];
    });
  }
}

await writeFile(BASE_STATS_PATH, `${JSON.stringify(baseRecords, null, 2)}\n`, "utf8");
console.log(`Normalized ${baseRecords.length} starting snapshots with ${overrideCount} verified class-history override(s).`);

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
