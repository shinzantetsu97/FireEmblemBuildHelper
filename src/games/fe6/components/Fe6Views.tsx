import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Table from "react-bootstrap/Table";
import { Braces, ChevronLeft, ChevronRight, LayoutList } from "lucide-react";
import JsonExplorer from "../../../components/JsonExplorer";
import { AppLink } from "../../../router";
import { useLocale } from "../../../i18n/LocaleContext";
import {
  calculateFe6SupportAffinityBonuses,
  collectFe6SourceRefs,
  FE6_SUPPORT_RANK_MULTIPLIERS,
  fe6ClassName,
  fe6Classes,
  fe6Items,
  fe6Sources,
  fe6Units,
  fe6Weapons,
  findFe6ClassBySlug,
  findFe6Source,
  findFe6UnitBySlug,
  formatAffinityHalfUnits,
  formatFe6Join,
  matchesFe6ClassSearch,
  matchesFe6UnitSearch,
  type Fe6Caps,
  type Fe6Class,
  type Fe6SourceRef,
  type Fe6Stats,
  type Fe6SupportRank,
  type Fe6Unit,
} from "../data";
import { getFe6AffinityIconUrl } from "../affinityAssets";
import { getFe6ClassSpriteUrl } from "../classSpriteAssets";
import { getFe6PortraitUrl } from "../portraitAssets";
import { getFe6WeaponItemIconUrl } from "../weaponItemAssets";

const statKeys: Array<keyof Fe6Stats> = ["hp", "power", "skill", "speed", "luck", "defense", "resistance"];
const classStatKeys: Array<Exclude<keyof Fe6Stats, "luck">> = ["hp", "power", "skill", "speed", "defense", "resistance"];
const affinityKeys = ["attack", "defense", "accuracy", "avoid", "critical", "criticalEvade"] as const;
const weaponTabs = ["sword", "lance", "axe", "bow", "staff", "anima", "light", "dark"] as const;
const weaponTabLabels: Record<(typeof weaponTabs)[number], string> = { sword: "Swords", lance: "Lances", axe: "Axes", bow: "Bows", staff: "Staves", anima: "Anima", light: "Light", dark: "Dark" };

export function Fe6UnitIndexPage({ notFound = false }: { notFound?: boolean }) {
  const { resolve, locale, t } = useLocale();
  const [query, setQuery] = useState("");
  const units = useMemo(() => fe6Units.filter((unit) => matchesFe6UnitSearch(unit, query)), [query]);
  return <main><Container className="data-main" fluid="lg">
    {notFound ? <Alert variant="warning">{t("fe6.units.notFound")}</Alert> : null}
    <header className="data-page-heading">
      <div><p className="eyebrow">{t("fe6.eyebrow")}</p><h1>{t("fe6.units.title")}</h1></div>
      <div className="fe6-directory-controls"><Form.Group controlId="fe6-unit-search"><Form.Label>{t("fe6.units.search")}</Form.Label><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("fe6.units.searchPlaceholder")} /></Form.Group><span>{t("directory.available", { available: units.length, total: fe6Units.length })}</span></div>
    </header>
    {locale === "zhHans" ? <p className="fe6-fan-translation-note">{t("fe6.units.fanTranslationPrefix")}<a href="http://www.k73.com/3ds/19454-2.html" target="_blank" rel="noreferrer">火花天龙剑</a>{t("fe6.units.fanTranslationSuffix")}</p> : null}
    {units.length ? <section className="fe6-unit-directory" aria-label={t("fe6.units.directoryAria")}>{units.map((unit) => <Fe6UnitCard key={unit.id} unit={unit} resolve={resolve} locale={locale} t={t} />)}</section> : <p className="fe6-empty-state">{t("fe6.units.empty")}</p>}
  </Container></main>;
}

function Fe6UnitCard({ unit, resolve, locale, t }: { unit: Fe6Unit; resolve: ReturnType<typeof useLocale>["resolve"]; locale: ReturnType<typeof useLocale>["locale"]; t: ReturnType<typeof useLocale>["t"] }) {
  const portrait = getFe6PortraitUrl(unit.id);
  const name = resolve(unit.names, unit.names.en);
  return <AppLink className="fe6-unit-directory-card" to={`/FE6/Units/${unit.id}`}>
    {portrait ? <img src={portrait} alt="" loading="lazy" /> : <PortraitFallback name={name} />}
    <span className="fe6-unit-number">{t("directory.number", { no: String(unit.displayOrder).padStart(2, "0") })}</span>
    <div><strong>{name}</strong><span>{fe6ClassName(unit.characterProfile.startingClassId, locale)}</span><small>{formatFe6Join(unit.characterProfile.recruitment, locale)}</small><ChevronRight aria-hidden="true" size={17} /></div>
  </AppLink>;
}

export function Fe6UnitDetailPage({ slug }: { slug: string }) {
  const { t, resolve } = useLocale();
  const unit = findFe6UnitBySlug(slug);
  const [view, setView] = useState<"overview" | "json">("overview");
  if (!unit) return <Fe6UnitNotFound />;
  return <main><Container className="unit-detail-main fe6-detail-main" fluid="lg">
    <AppLink className="back-link" to="/FE6/Units"><ChevronLeft aria-hidden="true" size={17} />{t("fe6.units.backToUnits")}</AppLink>
    <Fe6UnitHeader unit={unit} />
    <ViewToolbar view={view} onChange={setView} />
    {view === "overview" ? <Fe6UnitOverview unit={unit} /> : <JsonExplorer value={unit} label={t("unit.jsonTree", { name: resolve(unit.names, unit.names.en) })} />}
  </Container></main>;
}

function Fe6UnitNotFound() { const { t } = useLocale(); return <main><Container className="data-main" fluid="lg"><Alert variant="warning">{t("fe6.units.notFound")}</Alert><AppLink className="back-link" to="/FE6/Units"><ChevronLeft aria-hidden="true" size={17} />{t("fe6.units.backToUnits")}</AppLink></Container></main>; }

function Fe6UnitHeader({ unit }: { unit: Fe6Unit }) {
  const { resolve, locale, t } = useLocale();
  const portrait = getFe6PortraitUrl(unit.id);
  const profile = unit.characterProfile;
  const name = resolve(unit.names, unit.names.en);
  return <header className="unit-header fe6-unit-header">
    {portrait ? <img src={portrait} alt={t("unit.portraitAlt", { name })} /> : <PortraitFallback name={name} />}
    <div className="unit-header-copy"><div className="unit-header-meta"><span>{fe6ClassName(profile.startingClassId, locale)}</span><span>{t("config.level")} {profile.startingLevel}</span></div><h1>{name}</h1><p>{unit.names.ja ? <span lang="ja">{unit.names.ja}</span> : null}{unit.names.jaLatn ? <span>{unit.names.jaLatn}</span> : null}{unit.aliases.length ? <span>{t("fe6.units.aliases", { aliases: unit.aliases.join(", ") })}</span> : null}</p></div>
    <dl className="unit-header-facts"><div><dt>{t("config.recruitment")}</dt><dd>{formatFe6Join(profile.recruitment, locale)}</dd></div><div><dt>{t("config.startingClass")}</dt><dd>{fe6ClassName(profile.startingClassId, locale)}</dd></div></dl>
  </header>;
}

function Fe6UnitOverview({ unit }: { unit: Fe6Unit }) {
  const { locale, t } = useLocale();
  const profile = unit.characterProfile;
  return <div className="fe6-overview">
    <section className="data-section" aria-labelledby="fe6-character-profile"><h2 id="fe6-character-profile">{t("section.base.title")}</h2>
      <dl className="fe6-fact-grid"><div><dt>{t("fe6.units.recruitmentTime")}</dt><dd>{formatFe6Join(profile.recruitment, locale)}</dd></div><div><dt>{t("fe6.units.recruitmentCondition")}</dt><dd>{profile.recruitment.condition}</dd></div><div><dt>{t("config.startingClass")}</dt><dd>{fe6ClassName(profile.startingClassId, locale)}</dd></div><div><dt>{t("config.level")}</dt><dd>{profile.startingLevel}</dd></div><div><dt>{t("config.inventory")}</dt><dd><StartingItemsList items={profile.startingItems.items} /></dd></div></dl>
      <h3>{t("config.statProfile")}</h3><StatProfile unit={unit} />
      {profile.hardModeExpectedStats.length ? <HardModeStatProfile unit={unit} /> : null}
      <AffinitySection unit={unit} />
    </section>
    <section className="data-section" aria-labelledby="fe6-supports"><h2 id="fe6-supports">{t("fe6.units.supports")}</h2><Fe6Supports unit={unit} /></section>
    <SourceList value={unit} />
  </div>;
}

function StatProfile({ unit }: { unit: Fe6Unit }) {
  const { locale, t } = useLocale();
  const profile = unit.characterProfile;
  return <Table className="fe6-stat-table" responsive aria-label={t("config.statProfile")}><thead><tr><th>{t("fe6.units.profileColumn")}</th>{statKeys.map((key) => <th key={key}>{unitStatLabel(key, t)}</th>)}<th>{t("fe6.stats.constitution")}</th><th>{t("fe6.stats.movement")}</th><th>{t("config.weaponLevels")}</th></tr></thead><tbody><tr><th scope="row">{t("fe6.units.base")}</th>{statKeys.map((key) => <td key={key}>{profile.baseStats.stats[key]}</td>)}<td>{profile.baseStats.constitution}</td><td>{profile.baseStats.movement}</td><td>{formatWeaponLevels(profile.weaponLevels, locale)}</td></tr><tr><th scope="row">{t("fe6.units.growth")}</th>{statKeys.map((key) => <td key={key}>{profile.growths[key]}%</td>)}<td>—</td><td>—</td><td>—</td></tr><tr><th scope="row">{t("fe6.units.baseClassCap")}</th>{statKeys.map((key) => <td key={key}>{profile.baseClassCap?.[key] ?? "—"}</td>)}<td>{profile.baseClassCap?.constitution ?? "—"}</td><td>{profile.baseClassCap?.movement ?? "—"}</td><td>—</td></tr><tr><th scope="row">{t("fe6.units.promotedClassCap")}</th>{statKeys.map((key) => <td key={key}>{profile.promotedClassCap?.[key] ?? "—"}</td>)}<td>{profile.promotedClassCap?.constitution ?? "—"}</td><td>{profile.promotedClassCap?.movement ?? "—"}</td><td>—</td></tr></tbody></Table>;
}

function HardModeStatProfile({ unit }: { unit: Fe6Unit }) {
  const { t } = useLocale();
  return <section className="fe6-hard-mode"><h3>{t("fe6.units.hardModeBases")}</h3><Table className="fe6-stat-table fe6-hard-mode-table" responsive><thead><tr><th>{t("fe6.units.profileColumn")}</th>{statKeys.map((key) => <th key={key}>{unitStatLabel(key, t)}</th>)}<th>{t("fe6.stats.constitution")}</th><th>{t("fe6.stats.movement")}</th><th>{t("config.weaponLevels")}</th></tr></thead><tbody>{unit.characterProfile.hardModeExpectedStats.map((snapshot) => <tr key={snapshot.id}><th scope="row">{t("config.level")} {snapshot.startingLevel}</th>{statKeys.map((key) => <td key={key}>{snapshot.stats[key]}</td>)}<td>{snapshot.constitution}</td><td>{snapshot.movement}</td><td>—</td></tr>)}</tbody></Table></section>;
}

function AffinitySection({ unit }: { unit: Fe6Unit }) {
  const { resolve, t } = useLocale();
  const partners = unit.supports.map(findFe6UnitBySlug).filter((partner): partner is Fe6Unit => Boolean(partner));
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? "");
  const [rank, setRank] = useState<Fe6SupportRank>("C");
  const partner = partners.find((candidate) => candidate.id === partnerId) ?? partners[0];
  const bonuses = partner ? calculateFe6SupportAffinityBonuses(unit, partner, rank) : null;
  return <section className="fe6-affinity-section" aria-labelledby="fe6-affinity"><div className="fe6-affinity-heading"><h3 id="fe6-affinity"><AffinityIcon affinityId={unit.characterProfile.affinity.id} />{t("fe6.units.affinity")}: {affinityLabel(unit.characterProfile.affinity.id, t)}</h3><p>{t("fe6.units.affinityContribution")}</p></div><AffinityBonusTable rows={(Object.keys(FE6_SUPPORT_RANK_MULTIPLIERS) as Fe6SupportRank[]).map((supportRank) => ({ label: supportRank, bonuses: multiplyAffinity(unit.characterProfile.affinity.bonusHalfUnits, FE6_SUPPORT_RANK_MULTIPLIERS[supportRank]) }))} /><section className="fe6-affinity-calculator" aria-labelledby="fe6-affinity-calculator"><div><h3 id="fe6-affinity-calculator">{t("fe6.units.affinityCalculator")}</h3><p>{t("fe6.units.affinityCalculatorHelp")}</p></div>{partners.length ? <><div className="fe6-affinity-controls"><Form.Group controlId="fe6-support-partner"><Form.Label>{t("fe6.units.supportPartner")}</Form.Label><Form.Select value={partner?.id ?? ""} onChange={(event) => setPartnerId(event.target.value)}>{partners.map((candidate) => <option key={candidate.id} value={candidate.id}>{resolve(candidate.names, candidate.names.en)} — {affinityLabel(candidate.characterProfile.affinity.id, t)}</option>)}</Form.Select></Form.Group><Form.Group controlId="fe6-support-rank"><Form.Label>{t("fe6.units.supportRank")}</Form.Label><Form.Select value={rank} onChange={(event) => setRank(event.target.value as Fe6SupportRank)}>{(Object.keys(FE6_SUPPORT_RANK_MULTIPLIERS) as Fe6SupportRank[]).map((supportRank) => <option key={supportRank} value={supportRank}>{supportRank}</option>)}</Form.Select></Form.Group></div>{partner && bonuses ? <div className="fe6-affinity-result"><p><AffinityIcon affinityId={unit.characterProfile.affinity.id} /> {t("fe6.units.affinityResult", { first: resolve(unit.names, unit.names.en), second: resolve(partner.names, partner.names.en), rank })}</p><AffinityBonusTable rows={[{ label: t("config.total"), bonuses }]} /></div> : null}</> : <p className="fe6-empty-state">{t("fe6.units.noSupportPartners")}</p>}</section></section>;
}

function AffinityBonusTable({ rows }: { rows: Array<{ label: string; bonuses: Record<string, number> }> }) { const { t } = useLocale(); return <Table className="fe6-affinity-table" responsive><thead><tr><th>{t("fe6.units.rank")}</th>{affinityKeys.map((key) => <th key={key}>{affinityLabel(key, t)}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{affinityKeys.map((key) => <td key={key}>{formatAffinityHalfUnits(row.bonuses[key] ?? 0)}</td>)}</tr>)}</tbody></Table>; }

function AffinityIcon({ affinityId }: { affinityId: string }) { const src = getFe6AffinityIconUrl(affinityId); return src ? <img className="fe6-affinity-icon" src={src} alt="" /> : null; }

function multiplyAffinity(bonuses: Record<string, number>, multiplier: number): Record<string, number> { return Object.fromEntries(Object.entries(bonuses).map(([stat, value]) => [stat, value * multiplier])); }

function Fe6Supports({ unit }: { unit: Fe6Unit }) {
  const { resolve, t } = useLocale();
  const partners = unit.supports.map(findFe6UnitBySlug).filter((partner): partner is Fe6Unit => Boolean(partner));
  return partners.length ? <ul className="fe6-support-list">{partners.map((partner) => <li key={partner.id}><AppLink to={`/FE6/Units/${partner.id}`}>{getFe6PortraitUrl(partner.id) ? <img src={getFe6PortraitUrl(partner.id)} alt="" /> : null}{resolve(partner.names, partner.names.en)}</AppLink></li>)}</ul> : <p className="fe6-empty-state">{t("fe6.units.noSupportPartners")}</p>;
}

function StartingItemsList({ items }: { items: string[] }) {
  const { t } = useLocale();
  if (!items.length) return <>{t("common.none")}</>;
  return <span className="fe6-starting-items">{items.map((item) => <span className="fe6-starting-item" key={item}>{findStartingItemIcons(item).map(({ kind, id }) => {
    const icon = getFe6WeaponItemIconUrl(kind, id);
    return icon ? <img key={`${kind}:${id}`} src={icon} alt="" loading="lazy" /> : null;
  })}<span>{item}</span></span>)}</span>;
}

function findStartingItemIcons(value: string): Array<{ kind: "weapon" | "item"; id: string }> {
  return [...fe6Weapons.map((entry) => ({ kind: "weapon" as const, id: entry.id, name: entry.names.en })), ...fe6Items.map((entry) => ({ kind: "item" as const, id: entry.id, name: entry.names.en }))]
    .filter((entry) => new RegExp(`(^|[^a-z])${escapeRegex(entry.name)}($|[^a-z])`, "i").test(value))
    .sort((left, right) => right.name.length - left.name.length)
    .map(({ kind, id }) => ({ kind, id }));
}

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function Fe6ClassIndexPage() {
  const { t, resolve, locale } = useLocale();
  const [query, setQuery] = useState(""); const [tier, setTier] = useState<"all" | Fe6Class["tier"]>("all");
  const classes = useMemo(() => fe6Classes.filter((entry) => (tier === "all" || entry.tier === tier) && matchesFe6ClassSearch(entry, query)), [query, tier]);
  return <main><Container className="data-main" fluid="lg"><header className="data-page-heading"><div><p className="eyebrow">{t("fe6.eyebrow")}</p><h1>{t("fe6.classes.title")}</h1></div><div className="fe6-directory-controls"><Form.Group controlId="fe6-class-search"><Form.Label>{t("fe6.classes.search")}</Form.Label><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} /></Form.Group><Form.Group controlId="fe6-class-tier"><Form.Label>{t("fe6.classes.tier")}</Form.Label><Form.Select value={tier} onChange={(event) => setTier(event.target.value as typeof tier)}><option value="all">{t("fe6.classes.all")}</option><option value="base">{t("fe6.classes.base")}</option><option value="promoted">{t("fe6.classes.promoted")}</option><option value="special">{t("fe6.classes.special")}</option><option value="enemy_only">{t("fe6.classes.enemyOnly")}</option><option value="npc_only">{t("fe6.classes.npcOnly")}</option></Form.Select></Form.Group></div></header><section className="fe6-class-directory" aria-label={t("fe6.classes.directoryAria")}>{classes.map((entry) => <Fe6ClassRecord key={entry.id} entry={entry} t={t} resolve={resolve} locale={locale} />)}</section>{!classes.length ? <p className="fe6-empty-state">{t("fe6.classes.empty")}</p> : null}</Container></main>;
}

function Fe6ClassRecord({ entry, t, resolve, locale }: { entry: Fe6Class; t: ReturnType<typeof useLocale>["t"]; resolve: ReturnType<typeof useLocale>["resolve"]; locale: ReturnType<typeof useLocale>["locale"] }) {
  const promotedClass = entry.promotionClassId ? findFe6ClassBySlug(entry.promotionClassId) : undefined;
  const sprite = getFe6ClassSpriteUrl(entry.id);
  const name = resolve(entry.names);
  return <article className="fe6-class-record"><div className="fe6-class-record-main"><div className="fe6-class-identity">{sprite ? <img src={sprite} alt="" loading="lazy" /> : <ClassSpriteFallback name={name} />}<div><strong>{name}</strong><span>{tierLabel(entry.tier, t)}</span>{entry.gender ? <span>{t(entry.gender === "male" ? "common.male" : "common.female")}</span> : null}</div></div><ClassStatTable entry={entry} t={t} locale={locale} name={name} /><section className="fe6-class-ranks"><h2>{t("fe6.classes.baseWeaponRanks")}</h2><InlineRankList ranks={entry.baseWeaponRanks} promotionRanks={entry.promotion?.weaponRankGains} promotionLabel={t("fe6.classes.promotion")} locale={locale} /></section><section className="fe6-class-notes"><h2>{t("fe6.classes.notes")}</h2>{entry.notes ? <p>{resolve({ en: entry.notes, zhHans: entry.notesZhHans ?? undefined })}</p> : null}{promotedClass && entry.promotion ? <p><strong>{t("fe6.classes.promotesTo")}</strong> {resolve(promotedClass.names)}</p> : null}{!entry.notes && !promotedClass ? <p>—</p> : null}</section></div></article>;
}

function ClassStatTable({ entry, t, locale, name }: { entry: Fe6Class; t: ReturnType<typeof useLocale>["t"]; locale: ReturnType<typeof useLocale>["locale"]; name: string }) { return <Table className="fe6-class-stat-table" responsive aria-label={`${name} ${t("fe6.classes.stats")}`}><thead><tr><th>{t("fe6.classes.stats")}</th>{classStatKeys.map((key) => <th key={key}>{classStatLabel(key, locale)}</th>)}<th>{t("fe6.stats.constitution")}</th><th>{t("fe6.stats.movement")}</th></tr></thead><tbody><tr><th scope="row">{t("fe6.classes.base")}</th>{classStatKeys.map((key) => <td key={key}>{entry.baseStats[key]}</td>)}<td>{entry.constitution}</td><td>{entry.movement}</td></tr><tr><th scope="row">{t("fe6.classes.max")}</th>{classStatKeys.map((key) => <td key={key}>{entry.maximumStats[key]}</td>)}<td>{entry.maximumStats.constitution}</td><td>{entry.maximumStats.movement}</td></tr>{entry.promotion ? <tr className="fe6-class-promotion-gain-row"><th scope="row">{t("fe6.classes.promotion")}</th>{classStatKeys.map((key) => <td key={key}>+{entry.promotion!.statGains[key]}</td>)}<td>+{entry.promotion.constitutionGain}</td><td>+{entry.promotion.movementGain}</td></tr> : null}</tbody></Table>; }

function ClassSpriteFallback({ name }: { name: string }) { return <div className="fe6-class-sprite-fallback" aria-hidden="true">{name.slice(0, 1)}</div>; }

export function Fe6WeaponItemDirectoryPage() {
  const { locale, resolve, t } = useLocale();
  const [view, setView] = useState<"weapons" | "items">("weapons"); const [tab, setTab] = useState<(typeof weaponTabs)[number]>("sword");
  const rows = fe6Weapons.filter((weapon) => weapon.weaponTypeId === tab);
  return <main><Container className="data-main" fluid="lg"><header className="data-page-heading"><div><p className="eyebrow">{t("fe6.eyebrow")}</p><h1>{t("fe6.weapons.title")}</h1></div><span>{view === "weapons" ? t("fe6.weapons.count", { count: fe6Weapons.length, kind: t("fe6.weapons.weaponsAndStaves") }) : t("fe6.weapons.count", { count: fe6Items.length, kind: t("fe6.weapons.itemsCount") })}</span></header><Nav className="weapon-directory-view-tabs" variant="tabs"><Nav.Item><Nav.Link active={view === "weapons"} onClick={() => setView("weapons")}>{t("fe6.weapons.weapons")}</Nav.Link></Nav.Item><Nav.Item><Nav.Link active={view === "items"} onClick={() => setView("items")}>{t("fe6.weapons.items")}</Nav.Link></Nav.Item></Nav>{view === "weapons" ? <><Nav className="weapon-directory-tabs" variant="pills" aria-label={t("fe6.weapons.typeAria")}>{weaponTabs.map((id) => <Nav.Item key={id}><Nav.Link active={tab === id} onClick={() => setTab(id)}>{weaponTabLabel(id, locale)}</Nav.Link></Nav.Item>)}</Nav><WeaponTable rows={rows} staff={tab === "staff"} resolve={resolve} t={t} /></> : <ItemTable resolve={resolve} t={t} />}</Container></main>;
}

function WeaponTable({ rows, staff, resolve, t }: { rows: typeof fe6Weapons; staff: boolean; resolve: ReturnType<typeof useLocale>["resolve"]; t: ReturnType<typeof useLocale>["t"] }) { return <section className="weapon-directory-section"><h2>{weaponTabLabel(staff ? "staff" : rows[0]?.weaponTypeId as (typeof weaponTabs)[number], useLocale().locale)}</h2><Table className="weapon-directory-table fe6-weapon-table" responsive hover><thead><tr><th>{t("fe6.weapons.name")}</th><th>{t("fe6.weapons.rank")}</th><th>{t("fe6.weapons.range")}</th>{staff ? <><th>{t("fe6.weapons.uses")}</th><th>{t("fe6.weapons.worth")}</th><th>{t("fe6.weapons.staffExperience")}</th></> : <><th>{t("fe6.weapons.weight")}</th><th>{t("fe6.weapons.might")}</th><th>{t("fe6.weapons.hit")}</th><th>{t("fe6.weapons.critical")}</th><th>{t("fe6.weapons.uses")}</th><th>{t("fe6.weapons.worth")}</th></>}<th>{t("fe6.weapons.effect")}</th></tr></thead><tbody>{rows.map((weapon) => <tr key={weapon.id}><th scope="row"><WeaponItemName kind="weapon" id={weapon.id} name={resolve(weapon.names, weapon.names.en)} />{weapon.availabilityFlags.map((flag) => <Badge key={flag} bg="secondary" className="fe6-flag">{t(flag === "unobtainable" ? "fe6.weapons.unobtainable" : "fe6.weapons.trialMapOnly")}</Badge>)}</th><td>{displayValue(weapon.rank)}</td><td>{displayValue(weapon.range?.display ?? null)}</td>{staff ? <><td>{displayValue(weapon.uses)}</td><td>{formatWorth(weapon.worth)}</td><td>{displayValue(weapon.staffExperience)}</td></> : <><td>{displayValue(weapon.weight)}</td><td>{displayValue(weapon.might)}</td><td>{displayValue(weapon.hit)}</td><td>{displayValue(weapon.critical)}</td><td>{displayValue(weapon.uses)}</td><td>{formatWorth(weapon.worth)}</td></>}<td>{displayValue(resolve({ en: weapon.effect ?? "", zhHans: weapon.effectZhHans ?? undefined }))}</td></tr>)}</tbody></Table></section>; }

function ItemTable({ resolve, t }: { resolve: ReturnType<typeof useLocale>["resolve"]; t: ReturnType<typeof useLocale>["t"] }) { return <section className="weapon-directory-section"><h2>{t("fe6.weapons.items")}</h2><Table className="weapon-directory-table fe6-item-table" responsive hover><thead><tr><th>{t("fe6.weapons.name")}</th><th>{t("fe6.weapons.uses")}</th><th>{t("fe6.weapons.worth")}</th><th>{t("fe6.weapons.effect")}</th></tr></thead><tbody>{fe6Items.map((item) => <tr key={item.id}><th scope="row"><WeaponItemName kind="item" id={item.id} name={resolve(item.names, item.names.en)} />{item.availabilityFlags.map((flag) => <Badge key={flag} bg="secondary" className="fe6-flag">{t(flag === "unobtainable" ? "fe6.weapons.unobtainable" : "fe6.weapons.trialMapOnly")}</Badge>)}</th><td>{displayValue(item.uses)}</td><td>{formatWorth(item.worth)}</td><td>{displayValue(resolve({ en: item.effect ?? "", zhHans: item.effectZhHans ?? undefined }))}</td></tr>)}</tbody></Table></section>; }

function WeaponItemName({ kind, id, name }: { kind: "weapon" | "item"; id: string; name: string }) { const icon = getFe6WeaponItemIconUrl(kind, id); return <span className="fe6-weapon-item-name">{icon ? <img src={icon} alt="" loading="lazy" /> : null}<span>{name}</span></span>; }

function ViewToolbar({ view, onChange }: { view: "overview" | "json"; onChange: (view: "overview" | "json") => void }) { const { t } = useLocale(); return <div className="unit-view-toolbar"><ButtonGroup aria-label={t("unit.view.aria")}><Button variant={view === "overview" ? "dark" : "outline-secondary"} onClick={() => onChange("overview")} aria-pressed={view === "overview"}><LayoutList aria-hidden="true" size={17} />{t("unit.view.overview")}</Button><Button variant={view === "json" ? "dark" : "outline-secondary"} onClick={() => onChange("json")} aria-pressed={view === "json"}><Braces aria-hidden="true" size={17} />{t("unit.view.json")}</Button></ButtonGroup><span>{t("fe6.units.curatedData")}</span></div>; }

function SourceList({ value }: { value: unknown }) { const { t } = useLocale(); const references = collectFe6SourceRefs(value); const sources = references.map((reference) => findFe6Source(reference.sourceId)).filter((source): source is NonNullable<typeof source> => Boolean(source)); return <section className="unit-references" aria-labelledby="fe6-sources"><h2 id="fe6-sources">{t("unit.references")}</h2><ol className="source-list">{sources.map((source) => <li key={source.id}><a href={source.location} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ol></section>; }

function InlineRankList({ ranks, promotionRanks, promotionLabel, locale }: { ranks: Record<string, string>; promotionRanks?: Record<string, string>; promotionLabel: string; locale: ReturnType<typeof useLocale>["locale"] }) { const base = Object.entries(ranks).map(([weapon, rank]) => `${weaponLabel(weapon, locale)} ${rank}`); const promotion = Object.entries(promotionRanks ?? {}).map(([weapon, rank]) => `${weaponLabel(weapon, locale)} ${rank}`); return <p className="fe6-inline-ranks">{base.length ? base.join(", ") : "—"}{promotion.length ? <>{base.length ? ", " : null}<strong>{promotionLabel}:</strong> {promotion.join(", ")}</> : null}</p>; }
function RankList({ ranks, empty, locale }: { ranks: Record<string, string>; empty: string; locale: ReturnType<typeof useLocale>["locale"] }) { const entries = Object.entries(ranks); return entries.length ? <dl className="fe6-rank-list">{entries.map(([weapon, rank]) => <div key={weapon}><dt>{weaponLabel(weapon, locale)}</dt><dd>{rank}</dd></div>)}</dl> : <p>{empty}</p>; }
function formatWeaponLevels(ranks: Record<string, string>, locale: ReturnType<typeof useLocale>["locale"]): string { const entries = Object.entries(ranks); return entries.length ? entries.map(([weapon, rank]) => `${weaponLabel(weapon, locale)} ${rank}`).join(" · ") : "—"; }
function PortraitFallback({ name }: { name: string }) { return <div className="fe6-portrait-fallback" aria-hidden="true">{name.slice(0, 1)}</div>; }
function tierLabel(tier: Fe6Class["tier"], t: ReturnType<typeof useLocale>["t"]): string { if (tier === "base") return t("fe6.classes.base"); if (tier === "promoted") return t("fe6.classes.promoted"); if (tier === "special") return t("fe6.classes.special"); return t(tier === "enemy_only" ? "fe6.classes.enemyOnly" : "fe6.classes.npcOnly"); }
function unitStatLabel(stat: keyof Fe6Stats, t: ReturnType<typeof useLocale>["t"]): string { return t(`fe6.stats.${stat === "power" ? "power" : stat}` as "fe6.stats.hp"); }
function affinityLabel(affinity: string, t: ReturnType<typeof useLocale>["t"]): string { return t(`fe6.affinity.${affinity}` as "fe6.affinity.attack"); }
function classStatLabel(stat: (typeof classStatKeys)[number], locale: ReturnType<typeof useLocale>["locale"]): string { return locale === "zhHans" ? { hp: "HP", power: "力量/魔法", skill: "技巧", speed: "速度", defense: "防御", resistance: "魔防" }[stat] : { hp: "HP", power: "Str/Mag", skill: "Skl", speed: "Spd", defense: "Def", resistance: "Res" }[stat]; }
function weaponTabLabel(weapon: (typeof weaponTabs)[number], locale: ReturnType<typeof useLocale>["locale"]): string { return locale === "zhHans" ? weaponLabel(weapon, locale) : weaponTabLabels[weapon]; }
function weaponLabel(weapon: string, locale: ReturnType<typeof useLocale>["locale"]): string { const english: Record<string, string> = { sword: "Sword", lance: "Lance", axe: "Axe", bow: "Bow", staff: "Staff", anima: "Anima", light: "Light", dark: "Dark" }; const zhHans: Record<string, string> = { sword: "剑", lance: "枪", axe: "斧", bow: "弓", staff: "杖", anima: "理", light: "光", dark: "暗" }; return (locale === "zhHans" ? zhHans : english)[weapon] ?? weapon; }
function displayValue(value: string | number | null): string | number { return value === null || value === "" ? "—" : value; }
function formatWorth(value: number | null): string { return value === null ? "—" : `${value.toLocaleString()} G`; }
