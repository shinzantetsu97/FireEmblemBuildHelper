import { useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Table from "react-bootstrap/Table";
import { fe14Data, type WeaponDirectoryEntry } from "../data";
import { getDirectoryIconUrl } from "../directoryAssets";
import { getWeaponTypeIconUrl } from "../weaponAssets";
import { useLocale } from "../../../i18n/LocaleContext";

type LocalizedLabel = { en: string; zhHans: string };
type WeaponTab = { id: string; label: LocalizedLabel; typeId: string; families: Array<{ id: string; label: LocalizedLabel }> };

const FAMILY_MODIFIERS: Record<string, { en: string; zhHans: string }> = {
  katana: { en: "Grants +1 Speed, −1 Defense, and −1 Resistance unless otherwise stated.", zhHans: "速度+1、防御−1、魔防−1（除非另有说明）。" },
  naginata: { en: "Grants +1 Defense and +1 Resistance unless otherwise stated.", zhHans: "防御+1、魔防+1（除非另有说明）。" },
  club: { en: "No shared stat modifier.", zhHans: "无共通能力修正。" },
  shuriken: { en: "Grants +2 Speed unless otherwise stated.", zhHans: "速度+2（除非另有说明）。" },
  bow: { en: "Triples might against flying units unless otherwise stated.", zhHans: "敌方为飞行单位时，威力×3（除非另有说明）。" },
  yumi: { en: "Grants +2 Resistance and triples might against flying units unless otherwise stated.", zhHans: "魔防+2；敌方为飞行单位时，威力×3（除非另有说明）。" },
  scroll: { en: "Stat modifiers vary by scroll; see each description.", zhHans: "能力修正因咒而异；请参阅各自说明。" },
  rod: { en: "No shared stat modifier.", zhHans: "无共通能力修正。" },
};

const WEAPON_TABS: WeaponTab[] = [
  { id: "swords", label: { en: "Swords", zhHans: "剑" }, typeId: "sword", families: [{ id: "sword", label: { en: "Swords", zhHans: "剑" } }, { id: "katana", label: { en: "Katanas", zhHans: "刀" } }] },
  { id: "lances", label: { en: "Lances", zhHans: "枪" }, typeId: "lance", families: [{ id: "lance", label: { en: "Lances", zhHans: "枪" } }, { id: "naginata", label: { en: "Naginatas", zhHans: "薙刀" } }] },
  { id: "axes", label: { en: "Axes", zhHans: "斧" }, typeId: "axe", families: [{ id: "axe", label: { en: "Axes", zhHans: "斧" } }, { id: "club", label: { en: "Clubs", zhHans: "棍棒" } }] },
  { id: "daggers", label: { en: "Daggers", zhHans: "暗器" }, typeId: "dagger", families: [{ id: "dagger", label: { en: "Daggers", zhHans: "暗器" } }, { id: "shuriken", label: { en: "Shurikens", zhHans: "手里剑" } }] },
  { id: "bows", label: { en: "Bows", zhHans: "弓" }, typeId: "bow", families: [{ id: "bow", label: { en: "Bows", zhHans: "弓" } }, { id: "yumi", label: { en: "Yumi", zhHans: "和弓" } }] },
  { id: "magic", label: { en: "Magic", zhHans: "魔法" }, typeId: "tome", families: [{ id: "tome", label: { en: "Tomes", zhHans: "魔导书" } }, { id: "scroll", label: { en: "Scrolls", zhHans: "咒" } }] },
  { id: "staves", label: { en: "Staves", zhHans: "杖" }, typeId: "staff", families: [{ id: "staff", label: { en: "Staves", zhHans: "杖" } }, { id: "rod", label: { en: "Rods", zhHans: "祭器" } }] },
  { id: "stones", label: { en: "Stones", zhHans: "石" }, typeId: "dragonstone", families: [{ id: "dragonstone", label: { en: "Dragonstones", zhHans: "龙石" } }, { id: "beaststone", label: { en: "Beaststones", zhHans: "兽石" } }, { id: "other_stone", label: { en: "Other", zhHans: "其他" } }] },
];

const ITEM_CATEGORIES: Array<{ id: string; label: LocalizedLabel }> = [
  { id: "consumable", label: { en: "Consumables", zhHans: "消耗品" } }, { id: "key", label: { en: "Keys", zhHans: "钥匙" } }, { id: "permanent_booster", label: { en: "Permanent boosters", zhHans: "永久能力提升" } }, { id: "promotion", label: { en: "Promotion items", zhHans: "转职道具" } }, { id: "special", label: { en: "Special items", zhHans: "特殊道具" } },
];

function number(value: number | null) { return value === null ? "—" : String(value); }
function range(value: WeaponDirectoryEntry["range"]) { return value.min === null || value.max === null ? "—" : value.min === value.max ? String(value.min) : `${value.min}-${value.max}`; }
function description(weapon: WeaponDirectoryEntry, locale: "en" | "zhHans") {
  if (locale === "zhHans") return weapon.descriptions.zhHans ?? (weapon.descriptions.en === "?" ? "" : weapon.descriptions.en);
  return weapon.descriptions.en;
}

export default function WeaponItemDirectoryPage() {
  const [view, setView] = useState<"weapons" | "items">("weapons");
  const [tabId, setTabId] = useState("swords");
  const { resolve, locale, t } = useLocale();
  const tab = WEAPON_TABS.find((candidate) => candidate.id === tabId) ?? WEAPON_TABS[0];
  const weaponGroups = useMemo(() => tab.families.map((family) => ({ ...family, rows: fe14Data.weapons.filter((weapon) => weapon.familyId === family.id) })), [tab]);

  return <main>
    <Container className="data-main" fluid="lg">
      <header className="data-page-heading">
        <div><p className="eyebrow">{t("fe14.eyebrow")}</p><h1>{t("weapons.title")}</h1></div>
        <span>{view === "weapons" ? (locale === "zhHans" ? `${fe14Data.weapons.length} 件武器` : `${fe14Data.weapons.length} weapons`) : (locale === "zhHans" ? `${fe14Data.items.length} 件道具` : `${fe14Data.items.length} items`)}</span>
      </header>

      <Nav className="weapon-directory-view-tabs" variant="tabs">
        <Nav.Item><Nav.Link active={view === "weapons"} onClick={() => setView("weapons")}>{t("weapons.weapons")}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={view === "items"} onClick={() => setView("items")}>{t("weapons.items")}</Nav.Link></Nav.Item>
      </Nav>

      {view === "weapons" ? <>
        <Nav className="weapon-directory-tabs" variant="pills" aria-label="Weapon type">
          {WEAPON_TABS.map((candidate) => <Nav.Item key={candidate.id}><Nav.Link active={candidate.id === tab.id} onClick={() => setTabId(candidate.id)}><img alt="" src={getWeaponTypeIconUrl(candidate.typeId)} />{candidate.label[locale]}</Nav.Link></Nav.Item>)}
        </Nav>
        {weaponGroups.map((group) => group.rows.length > 0 && <section className="weapon-directory-section" key={group.id}>
          <h2><img alt="" src={getWeaponTypeIconUrl(tab.typeId)} />{group.label[locale]}</h2>
          {FAMILY_MODIFIERS[group.id] ? <p className="weapon-family-modifier">{locale === "zhHans" ? FAMILY_MODIFIERS[group.id].zhHans : FAMILY_MODIFIERS[group.id].en}</p> : null}
          <Table className="weapon-directory-table" responsive hover>
            <colgroup><col className="weapon-col-name" /><col className="weapon-col-rank" /><col className="weapon-col-stat" /><col className="weapon-col-stat" /><col className="weapon-col-stat" /><col className="weapon-col-stat" /><col className="weapon-col-stat" /><col className="weapon-col-range" /><col className="weapon-col-description" /></colgroup>
            <thead><tr><th>{t("weapons.name")}</th><th>{locale === "zhHans" ? "武器等级" : "Rank"}</th><th>{locale === "zhHans" ? "威力" : "Mt"}</th><th>{locale === "zhHans" ? "命中" : "Hit"}</th><th>{locale === "zhHans" ? "必杀" : "Crit"}</th><th>{locale === "zhHans" ? "回避" : "Avo"}</th><th>{locale === "zhHans" ? "必杀回避" : "Ddg"}</th><th>{locale === "zhHans" ? "攻击距离" : "Rng"}</th><th>{t("weapons.description")}</th></tr></thead>
            <tbody>{group.rows.map((weapon) => <tr key={weapon.id}><th scope="row"><img className="weapon-directory-row-icon" alt="" src={getDirectoryIconUrl(weapon.iconSource.imageUrl)} />{resolve(weapon.names)}</th><td>{weapon.rank ?? "—"}</td><td>{number(weapon.might)}</td><td>{number(weapon.hit)}</td><td>{number(weapon.crit)}</td><td>{number(weapon.avoid)}</td><td>{number(weapon.ddg)}</td><td>{range(weapon.range)}</td><td>{description(weapon, locale)}</td></tr>)}</tbody>
          </Table>
        </section>)}
      </> : <div className="weapon-directory-items">
        {ITEM_CATEGORIES.map((category) => {
          const rows = fe14Data.items.filter((item) => item.categoryId === category.id);
          return rows.length > 0 && <section className="weapon-directory-section" key={category.id}><h2>{category.label[locale]}</h2><Table className="weapon-directory-table" responsive hover><thead><tr><th>{t("weapons.name")}</th><th>{t("weapons.uses")}</th><th>{t("weapons.description")}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><th scope="row"><img className="weapon-directory-row-icon" alt="" src={getDirectoryIconUrl(item.iconSource.imageUrl)} />{resolve(item.names)}</th><td>{number(item.uses)}</td><td>{item.descriptions[locale]}</td></tr>)}</tbody></Table></section>;
        })}
      </div>}
    </Container>
  </main>;
}
