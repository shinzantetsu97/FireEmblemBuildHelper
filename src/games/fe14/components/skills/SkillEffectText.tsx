import { Fragment } from "react";
import { useLocale } from "../../../../i18n/LocaleContext";

const KEY_TERMS = [
  "follow-up attack speed",
  "skill activation rate",
  "Damage Dealt",
  "Damage Taken",
  "Attack Power",
  "maximum HP",
  "current HP",
  "Max HP",
  "Attack Stance",
  "Guard Stance",
  "Capture command",
  "Rally command",
  "Replicate command",
  "Shelter command",
  "follow-up attacks",
  "critical hit",
  "Strength",
  "Resistance",
  "Defense",
  "Magic",
  "Skill",
  "Speed",
  "Luck",
  "Avoid",
  "Crit",
  "Ddg",
  "Hit",
  "HP",
  "Capture",
  "Rally",
  "Replicate",
  "Shelter",
  "Wait",
  "Prison",
].sort((left, right) => right.length - left.length);

const ZH_HANS_KEY_TERMS = [
  "造成的伤害",
  "受到的伤害",
  "特技发动率",
  "技能发动率",
  "必杀回避",
  "复制（写し身）指令",
  "支援指令",
  "捕获指令",
  "待机指令",
  "救出指令",
  "追击系数",
  "最大HP",
  "物理伤害",
  "魔法伤害",
  "全能力",
  "攻击力",
  "移动力",
  "全体成长率",
  "回复量",
  "发动率",
  "力量",
  "魔力",
  "速度",
  "幸运",
  "守备",
  "魔防",
  "命中",
  "回避",
  "必杀",
  "攻阵",
  "防阵",
  "牢房",
  "技",
  "HP",
].sort((left, right) => right.length - left.length);

const KEY_TERM_PATTERN = `\\b(?:${KEY_TERMS.map(escapeRegex).join("|")})(?:\\s*[+-]\\d+(?:\\.\\d+)?%?|\\s*[x×]\\s*\\d+(?:\\.\\d+)?%?|%)?(?![A-Za-z])`;
const DIGIT_RANGE_PATTERN = "(?:(?:within|from|through|at least|at most|up to)\\s+)?[+-]?\\d+(?:\\.\\d+)?(?:\\/\\d+(?:\\.\\d+)?)?%?(?:\\s+or\\s+(?:more|fewer|less))?(?:\\s+(?:tiles?|spaces?|turns?|characters?|kanji|points?))?";
const WORD_RANGE_PATTERN = "\\b(?:(?:below|above|under|over|at|not at)\\s+)?(?:full|half|one-quarter|one|two|three|four|five|six|seven|eight|nine|ten)(?:\\s+(?:HP|tiles?|spaces?|turns?|characters?|kanji|points?))?(?![A-Za-z])";
const SUPPORT_RANGE_PATTERN = "\\b(?:at least\\s+)?[CSAB]\\s+support\\b";
const EMPHASIS_PATTERN = `(${KEY_TERM_PATTERN}|${DIGIT_RANGE_PATTERN}|${WORD_RANGE_PATTERN}|${SUPPORT_RANGE_PATTERN})`;
const ZH_HANS_KEY_TERM_PATTERN = `(?:${ZH_HANS_KEY_TERMS.map(escapeRegex).join("|")})(?:[+-]\\d+(?:\\.\\d+)?%?|%)?`;
const ZH_HANS_THRESHOLD_PATTERN = "(?:HP(?:在)?(?:一半以下|低于一半|低于1/4|未满|为满|全满)|一半|1/4)";
const ZH_HANS_RANGE_PATTERN = "(?:周围|前)?[+-]?\\d+(?:\\.\\d+)?(?:\\/\\d+(?:\\.\\d+)?)?%?(?:(?:格|个回合|回合|点|个字符|个汉字|倍|本|名)(?:内)?(?:及以上|及以下)?)?";
const ZH_HANS_RANK_PATTERN = "(?:至少达到)?[CSAB](?:级支援|支援)?";
const ZH_HANS_EMPHASIS_PATTERN = `(${ZH_HANS_THRESHOLD_PATTERN}|${ZH_HANS_KEY_TERM_PATTERN}|${ZH_HANS_RANGE_PATTERN}|${ZH_HANS_RANK_PATTERN})`;

export interface SkillTextPart {
  emphasized: boolean;
  text: string;
}

export function splitEnglishSkillText(text: string): SkillTextPart[] {
  return splitSkillText(text, EMPHASIS_PATTERN, "gi");
}

export function splitZhHansSkillText(text: string): SkillTextPart[] {
  return splitSkillText(text, ZH_HANS_EMPHASIS_PATTERN, "g");
}

function splitSkillText(text: string, source: string, flags: string): SkillTextPart[] {
  const parts: SkillTextPart[] = [];
  const pattern = new RegExp(source, flags);
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ emphasized: false, text: text.slice(cursor, index) });
    parts.push({ emphasized: true, text: match[0] });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) parts.push({ emphasized: false, text: text.slice(cursor) });
  return parts;
}

export default function SkillEffectText({ en, zhHans }: { en: string; zhHans?: string }) {
  const { locale, resolve } = useLocale();
  const text = resolve({ en, zhHans });
  const parts = locale === "en" ? splitEnglishSkillText(text) : splitZhHansSkillText(text);

  return parts.map((part, index) => (
    <Fragment key={`${index}:${part.text}`}>
      {part.emphasized ? <strong>{part.text}</strong> : part.text}
    </Fragment>
  ));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
