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

const statLabels: Array<[keyof Fe6Stats, string]> = [
  ["hp", "HP"], ["power", "Str/Mag"], ["skill", "Skl"], ["speed", "Spd"], ["luck", "Lck"], ["defense", "Def"], ["resistance", "Res"],
];
const classStatLabels: Array<[Exclude<keyof Fe6Stats, "luck">, string]> = [
  ["hp", "HP"], ["power", "Str/Mag"], ["skill", "Skl"], ["speed", "Spd"], ["defense", "Def"], ["resistance", "Res"],
];
const affinityLabels: Array<[string, string]> = [
  ["attack", "Attack"], ["defense", "Defense"], ["accuracy", "Accuracy"], ["avoid", "Avoid"], ["critical", "Critical"], ["criticalEvade", "Critical Evade"],
];
const weaponTabs = ["sword", "lance", "axe", "bow", "staff", "anima", "light", "dark"] as const;
const weaponTabLabels: Record<(typeof weaponTabs)[number], string> = { sword: "Swords", lance: "Lances", axe: "Axes", bow: "Bows", staff: "Staves", anima: "Anima", light: "Light", dark: "Dark" };

export function Fe6UnitIndexPage({ notFound = false }: { notFound?: boolean }) {
  const { resolve } = useLocale();
  const [query, setQuery] = useState("");
  const units = useMemo(() => fe6Units.filter((unit) => matchesFe6UnitSearch(unit, query)), [query]);
  return <main><Container className="data-main" fluid="lg">
    {notFound ? <Alert variant="warning">That FE6 page could not be found.</Alert> : null}
    <header className="data-page-heading">
      <div><p className="eyebrow">Fire Emblem: The Binding Blade</p><h1>FE6 Units</h1></div>
      <div className="fe6-directory-controls"><Form.Group controlId="fe6-unit-search"><Form.Label>Search roster</Form.Label><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or alias" /></Form.Group><span>{units.length} of {fe6Units.length} units</span></div>
    </header>
    {units.length ? <section className="fe6-unit-directory" aria-label="FE6 unit roster">{units.map((unit) => <Fe6UnitCard key={unit.id} unit={unit} resolve={resolve} />)}</section> : <p className="fe6-empty-state">No units match that search.</p>}
  </Container></main>;
}

function Fe6UnitCard({ unit, resolve }: { unit: Fe6Unit; resolve: ReturnType<typeof useLocale>["resolve"] }) {
  const portrait = getFe6PortraitUrl(unit.id);
  const name = resolve(unit.names, unit.names.en);
  return <AppLink className="fe6-unit-directory-card" to={`/FE6/Units/${unit.id}`}>
    {portrait ? <img src={portrait} alt="" loading="lazy" /> : <PortraitFallback name={name} />}
    <span className="fe6-unit-number">No. {String(unit.displayOrder).padStart(2, "0")}</span>
    <div><strong>{name}</strong><span>{fe6ClassName(unit.characterProfile.startingClassId)}</span><small>{formatFe6Join(unit.characterProfile.recruitment)}</small><ChevronRight aria-hidden="true" size={17} /></div>
  </AppLink>;
}

export function Fe6UnitDetailPage({ slug }: { slug: string }) {
  const unit = findFe6UnitBySlug(slug);
  const [view, setView] = useState<"overview" | "json">("overview");
  if (!unit) return <Fe6UnitNotFound />;
  return <main><Container className="unit-detail-main fe6-detail-main" fluid="lg">
    <AppLink className="back-link" to="/FE6/Units"><ChevronLeft aria-hidden="true" size={17} />FE6 Units</AppLink>
    <Fe6UnitHeader unit={unit} />
    <ViewToolbar view={view} onChange={setView} label="Unit data view" />
    {view === "overview" ? <Fe6UnitOverview unit={unit} /> : <JsonExplorer value={unit} label={`${unit.names.en} JSON tree`} />}
  </Container></main>;
}

function Fe6UnitNotFound() { return <main><Container className="data-main" fluid="lg"><Alert variant="warning">This FE6 unit could not be found.</Alert><AppLink className="back-link" to="/FE6/Units"><ChevronLeft aria-hidden="true" size={17} />FE6 Units</AppLink></Container></main>; }

function Fe6UnitHeader({ unit }: { unit: Fe6Unit }) {
  const portrait = getFe6PortraitUrl(unit.id);
  const profile = unit.characterProfile;
  return <header className="unit-header fe6-unit-header">
    {portrait ? <img src={portrait} alt={`${unit.names.en} portrait`} /> : <PortraitFallback name={unit.names.en} />}
    <div className="unit-header-copy"><div className="unit-header-meta"><span>{fe6ClassName(profile.startingClassId)}</span><span>Lv. {profile.startingLevel}</span></div><h1>{unit.names.en}</h1><p>{unit.names.ja ? <span lang="ja">{unit.names.ja}</span> : null}{unit.names.jaLatn ? <span>{unit.names.jaLatn}</span> : null}{unit.aliases.length ? <span>Also: {unit.aliases.join(", ")}</span> : null}</p></div>
    <dl className="unit-header-facts"><div><dt>Recruitment</dt><dd>{formatFe6Join(profile.recruitment)}</dd></div><div><dt>Starting class</dt><dd>{fe6ClassName(profile.startingClassId)}</dd></div></dl>
  </header>;
}

function Fe6UnitOverview({ unit }: { unit: Fe6Unit }) {
  const profile = unit.characterProfile;
  return <div className="fe6-overview">
    <section className="data-section" aria-labelledby="fe6-character-profile"><h2 id="fe6-character-profile">Character Profile</h2>
      <dl className="fe6-fact-grid"><div><dt>Recruitment time</dt><dd>{formatFe6Join(profile.recruitment)}</dd></div><div><dt>Recruitment condition</dt><dd>{profile.recruitment.condition}</dd></div><div><dt>Starting class</dt><dd>{fe6ClassName(profile.startingClassId)}</dd></div><div><dt>Starting level</dt><dd>{profile.startingLevel}</dd></div><div><dt>Starting items</dt><dd><StartingItemsList items={profile.startingItems.items} /></dd></div></dl>
      <h3>Stat Profile</h3><StatProfile unit={unit} />
      {profile.hardModeExpectedStats.length ? <HardModeStatProfile unit={unit} /> : null}
      <AffinitySection unit={unit} />
    </section>
    <section className="data-section" aria-labelledby="fe6-supports"><h2 id="fe6-supports">Supports</h2><Fe6Supports unit={unit} /></section>
    <SourceList value={unit} />
  </div>;
}

function StatProfile({ unit }: { unit: Fe6Unit }) {
  const profile = unit.characterProfile;
  return <Table className="fe6-stat-table" responsive aria-label="Stat profile"><thead><tr><th>Profile</th>{statLabels.map(([, label]) => <th key={label}>{label}</th>)}<th>Con</th><th>Mov</th><th>Weapon Levels</th></tr></thead><tbody><tr><th scope="row">Base</th>{statLabels.map(([key]) => <td key={key}>{profile.baseStats.stats[key]}</td>)}<td>{profile.baseStats.constitution}</td><td>{profile.baseStats.movement}</td><td>{formatWeaponLevels(profile.weaponLevels)}</td></tr><tr><th scope="row">Growth</th>{statLabels.map(([key]) => <td key={key}>{profile.growths[key]}%</td>)}<td>—</td><td>—</td><td>—</td></tr><tr><th scope="row">Base Class Cap</th>{statLabels.map(([key]) => <td key={key}>{profile.baseClassCap?.[key] ?? "—"}</td>)}<td>{profile.baseClassCap?.constitution ?? "—"}</td><td>{profile.baseClassCap?.movement ?? "—"}</td><td>—</td></tr><tr><th scope="row">Promoted Class Cap</th>{statLabels.map(([key]) => <td key={key}>{profile.promotedClassCap?.[key] ?? "—"}</td>)}<td>{profile.promotedClassCap?.constitution ?? "—"}</td><td>{profile.promotedClassCap?.movement ?? "—"}</td><td>—</td></tr></tbody></Table>;
}

function HardModeStatProfile({ unit }: { unit: Fe6Unit }) {
  return <section className="fe6-hard-mode"><h3>Expected Hard-mode bases (rounded)</h3><Table className="fe6-stat-table fe6-hard-mode-table" responsive><thead><tr><th>Profile</th>{statLabels.map(([, label]) => <th key={label}>{label}</th>)}<th>Con</th><th>Mov</th><th>Weapon Levels</th></tr></thead><tbody>{unit.characterProfile.hardModeExpectedStats.map((snapshot) => <tr key={snapshot.id}><th scope="row">Lv. {snapshot.startingLevel}</th>{statLabels.map(([key]) => <td key={key}>{snapshot.stats[key]}</td>)}<td>{snapshot.constitution}</td><td>{snapshot.movement}</td><td>—</td></tr>)}</tbody></Table></section>;
}

function AffinitySection({ unit }: { unit: Fe6Unit }) {
  const partners = unit.supports.map(findFe6UnitBySlug).filter((partner): partner is Fe6Unit => Boolean(partner));
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? "");
  const [rank, setRank] = useState<Fe6SupportRank>("C");
  const partner = partners.find((candidate) => candidate.id === partnerId) ?? partners[0];
  const bonuses = partner ? calculateFe6SupportAffinityBonuses(unit, partner, rank) : null;
  return <section className="fe6-affinity-section" aria-labelledby="fe6-affinity"><div className="fe6-affinity-heading"><h3 id="fe6-affinity"><AffinityIcon affinityId={unit.characterProfile.affinity.id} />Affinity: {unit.characterProfile.affinity.name}</h3><p>Each row is this unit’s individual contribution at the selected support rank.</p></div><AffinityBonusTable rows={(Object.keys(FE6_SUPPORT_RANK_MULTIPLIERS) as Fe6SupportRank[]).map((supportRank) => ({ label: supportRank, bonuses: multiplyAffinity(unit.characterProfile.affinity.bonusHalfUnits, FE6_SUPPORT_RANK_MULTIPLIERS[supportRank]) }))} /><section className="fe6-affinity-calculator" aria-labelledby="fe6-affinity-calculator"><div><h3 id="fe6-affinity-calculator">Affinity Calculator</h3><p>Select a listed support partner and rank to see the pair’s total bonus.</p></div>{partners.length ? <><div className="fe6-affinity-controls"><Form.Group controlId="fe6-support-partner"><Form.Label>Support partner</Form.Label><Form.Select value={partner?.id ?? ""} onChange={(event) => setPartnerId(event.target.value)}>{partners.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.names.en} — {candidate.characterProfile.affinity.name}</option>)}</Form.Select></Form.Group><Form.Group controlId="fe6-support-rank"><Form.Label>Support rank</Form.Label><Form.Select value={rank} onChange={(event) => setRank(event.target.value as Fe6SupportRank)}>{(Object.keys(FE6_SUPPORT_RANK_MULTIPLIERS) as Fe6SupportRank[]).map((supportRank) => <option key={supportRank} value={supportRank}>{supportRank}</option>)}</Form.Select></Form.Group></div>{partner && bonuses ? <div className="fe6-affinity-result"><p><AffinityIcon affinityId={unit.characterProfile.affinity.id} /> {unit.names.en} + <AffinityIcon affinityId={partner.characterProfile.affinity.id} /> {partner.names.en} at rank {rank}</p><AffinityBonusTable rows={[{ label: "Total", bonuses }]} /></div> : null}</> : <p className="fe6-empty-state">No listed support partners.</p>}</section></section>;
}

function AffinityBonusTable({ rows }: { rows: Array<{ label: string; bonuses: Record<string, number> }> }) { return <Table className="fe6-affinity-table" responsive><thead><tr><th>Rank</th>{affinityLabels.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{affinityLabels.map(([id]) => <td key={id}>{formatAffinityHalfUnits(row.bonuses[id] ?? 0)}</td>)}</tr>)}</tbody></Table>; }

function AffinityIcon({ affinityId }: { affinityId: string }) { const src = getFe6AffinityIconUrl(affinityId); return src ? <img className="fe6-affinity-icon" src={src} alt="" /> : null; }

function multiplyAffinity(bonuses: Record<string, number>, multiplier: number): Record<string, number> { return Object.fromEntries(Object.entries(bonuses).map(([stat, value]) => [stat, value * multiplier])); }

function Fe6Supports({ unit }: { unit: Fe6Unit }) {
  const partners = unit.supports.map(findFe6UnitBySlug).filter((partner): partner is Fe6Unit => Boolean(partner));
  return partners.length ? <ul className="fe6-support-list">{partners.map((partner) => <li key={partner.id}><AppLink to={`/FE6/Units/${partner.id}`}>{getFe6PortraitUrl(partner.id) ? <img src={getFe6PortraitUrl(partner.id)} alt="" /> : null}{partner.names.en}</AppLink></li>)}</ul> : <p className="fe6-empty-state">No listed support partners.</p>;
}

function StartingItemsList({ items }: { items: string[] }) {
  if (!items.length) return <>None</>;
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
  const [query, setQuery] = useState(""); const [tier, setTier] = useState<"all" | Fe6Class["tier"]>("all");
  const classes = useMemo(() => fe6Classes.filter((entry) => (tier === "all" || entry.tier === tier) && matchesFe6ClassSearch(entry, query)), [query, tier]);
  return <main><Container className="data-main" fluid="lg"><header className="data-page-heading"><div><p className="eyebrow">Fire Emblem: The Binding Blade</p><h1>FE6 Classes</h1></div><div className="fe6-directory-controls"><Form.Group controlId="fe6-class-search"><Form.Label>Search classes</Form.Label><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} /></Form.Group><Form.Group controlId="fe6-class-tier"><Form.Label>Class tier</Form.Label><Form.Select value={tier} onChange={(event) => setTier(event.target.value as typeof tier)}><option value="all">All classes</option><option value="base">Base</option><option value="promoted">Promoted</option><option value="special">Special</option><option value="enemy_only">Enemy-only</option><option value="npc_only">NPC-only</option></Form.Select></Form.Group></div></header><section className="fe6-class-directory" aria-label="FE6 class directory">{classes.map((entry) => <Fe6ClassRecord key={entry.id} entry={entry} />)}</section>{!classes.length ? <p className="fe6-empty-state">No classes match that search.</p> : null}</Container></main>;
}

function Fe6ClassRecord({ entry }: { entry: Fe6Class }) {
  const promotedClass = entry.promotionClassId ? findFe6ClassBySlug(entry.promotionClassId) : undefined;
  const sprite = getFe6ClassSpriteUrl(entry.id);
  return <article className="fe6-class-record"><div className="fe6-class-record-main"><div className="fe6-class-identity">{sprite ? <img src={sprite} alt="" loading="lazy" /> : <ClassSpriteFallback name={entry.names.en} />}<div><strong>{entry.names.en}</strong><span>{tierLabel(entry.tier)}</span>{entry.gender ? <span>{entry.gender}</span> : null}</div></div><ClassStatTable entry={entry} /><section className="fe6-class-ranks"><h2>Base Weapon Ranks</h2><RankList ranks={entry.baseWeaponRanks} empty="—" /></section><section className="fe6-class-notes"><h2>Notes</h2>{entry.notes ? <p>{entry.notes}</p> : null}{promotedClass && entry.promotion ? <p><strong>Promotes to:</strong> {promotedClass.names.en}</p> : null}{!entry.notes && !promotedClass ? <p>—</p> : null}</section></div></article>;
}

function ClassStatTable({ entry }: { entry: Fe6Class }) { return <Table className="fe6-class-stat-table" responsive aria-label={`${entry.names.en} class stats`}><thead><tr><th>Stats</th>{classStatLabels.map(([, label]) => <th key={label}>{label}</th>)}<th>Con</th><th>Mov</th></tr></thead><tbody><tr><th scope="row">Base</th>{classStatLabels.map(([key]) => <td key={key}>{entry.baseStats[key]}</td>)}<td>{entry.constitution}</td><td>{entry.movement}</td></tr><tr><th scope="row">Max</th>{classStatLabels.map(([key]) => <td key={key}>{entry.maximumStats[key]}</td>)}<td>{entry.maximumStats.constitution}</td><td>{entry.maximumStats.movement}</td></tr>{entry.promotion ? <tr className="fe6-class-promotion-gain-row"><th scope="row">Promotion</th>{classStatLabels.map(([key]) => <td key={key}>+{entry.promotion!.statGains[key]}</td>)}<td>+{entry.promotion.constitutionGain}</td><td>+{entry.promotion.movementGain}</td></tr> : null}</tbody></Table>; }

function ClassSpriteFallback({ name }: { name: string }) { return <div className="fe6-class-sprite-fallback" aria-hidden="true">{name.slice(0, 1)}</div>; }

export function Fe6WeaponItemDirectoryPage() {
  const [view, setView] = useState<"weapons" | "items">("weapons"); const [tab, setTab] = useState<(typeof weaponTabs)[number]>("sword");
  const rows = fe6Weapons.filter((weapon) => weapon.weaponTypeId === tab);
  return <main><Container className="data-main" fluid="lg"><header className="data-page-heading"><div><p className="eyebrow">Fire Emblem: The Binding Blade</p><h1>FE6 Weapons &amp; Items</h1></div><span>{view === "weapons" ? `${fe6Weapons.length} weapons & staves` : `${fe6Items.length} items`}</span></header><Nav className="weapon-directory-view-tabs" variant="tabs"><Nav.Item><Nav.Link active={view === "weapons"} onClick={() => setView("weapons")}>Weapons</Nav.Link></Nav.Item><Nav.Item><Nav.Link active={view === "items"} onClick={() => setView("items")}>Items</Nav.Link></Nav.Item></Nav>{view === "weapons" ? <><Nav className="weapon-directory-tabs" variant="pills" aria-label="FE6 weapon type">{weaponTabs.map((id) => <Nav.Item key={id}><Nav.Link active={tab === id} onClick={() => setTab(id)}>{weaponTabLabels[id]}</Nav.Link></Nav.Item>)}</Nav><WeaponTable rows={rows} staff={tab === "staff"} /></> : <ItemTable />}</Container></main>;
}

function WeaponTable({ rows, staff }: { rows: typeof fe6Weapons; staff: boolean }) { return <section className="weapon-directory-section"><h2>{weaponTabLabels[staff ? "staff" : rows[0]?.weaponTypeId as keyof typeof weaponTabLabels] ?? "Weapons"}</h2><Table className="weapon-directory-table fe6-weapon-table" responsive hover><thead><tr><th>Name</th><th>Rank</th><th>Rng</th>{staff ? <><th>Uses</th><th>Worth</th><th>Staff EXP</th></> : <><th>Wt</th><th>Mt</th><th>Hit</th><th>Crit</th><th>Uses</th><th>Worth</th></>}<th>Effect</th></tr></thead><tbody>{rows.map((weapon) => <tr key={weapon.id}><th scope="row"><WeaponItemName kind="weapon" id={weapon.id} name={weapon.names.en} />{weapon.availabilityFlags.map((flag) => <Badge key={flag} bg="secondary" className="fe6-flag">{flag.replaceAll("_", " ")}</Badge>)}</th><td>{displayValue(weapon.rank)}</td><td>{weapon.range.display}</td>{staff ? <><td>{displayValue(weapon.uses)}</td><td>{formatWorth(weapon.worth)}</td><td>{displayValue(weapon.staffExperience)}</td></> : <><td>{displayValue(weapon.weight)}</td><td>{displayValue(weapon.might)}</td><td>{displayValue(weapon.hit)}</td><td>{displayValue(weapon.critical)}</td><td>{displayValue(weapon.uses)}</td><td>{formatWorth(weapon.worth)}</td></>}<td>{displayValue(weapon.effect)}</td></tr>)}</tbody></Table></section>; }

function ItemTable() { return <section className="weapon-directory-section"><h2>Items</h2><Table className="weapon-directory-table fe6-item-table" responsive hover><thead><tr><th>Name</th><th>Uses</th><th>Worth</th><th>Effect</th></tr></thead><tbody>{fe6Items.map((item) => <tr key={item.id}><th scope="row"><WeaponItemName kind="item" id={item.id} name={item.names.en} />{item.availabilityFlags.map((flag) => <Badge key={flag} bg="secondary" className="fe6-flag">{flag.replaceAll("_", " ")}</Badge>)}</th><td>{displayValue(item.uses)}</td><td>{formatWorth(item.worth)}</td><td>{displayValue(item.effect)}</td></tr>)}</tbody></Table></section>; }

function WeaponItemName({ kind, id, name }: { kind: "weapon" | "item"; id: string; name: string }) { const icon = getFe6WeaponItemIconUrl(kind, id); return <span className="fe6-weapon-item-name">{icon ? <img src={icon} alt="" loading="lazy" /> : null}<span>{name}</span></span>; }

function ViewToolbar({ view, onChange, label }: { view: "overview" | "json"; onChange: (view: "overview" | "json") => void; label: string }) { return <div className="unit-view-toolbar"><ButtonGroup aria-label={label}><Button variant={view === "overview" ? "dark" : "outline-secondary"} onClick={() => onChange("overview")} aria-pressed={view === "overview"}><LayoutList aria-hidden="true" size={17} />Overview</Button><Button variant={view === "json" ? "dark" : "outline-secondary"} onClick={() => onChange("json")} aria-pressed={view === "json"}><Braces aria-hidden="true" size={17} />JSON</Button></ButtonGroup><span>Curated FE6 data</span></div>; }

function SourceList({ value }: { value: unknown }) { const references = collectFe6SourceRefs(value); const sources = references.map((reference) => findFe6Source(reference.sourceId)).filter((source): source is NonNullable<typeof source> => Boolean(source)); return <section className="unit-references" aria-labelledby="fe6-sources"><h2 id="fe6-sources">Sources</h2><ol className="source-list">{sources.map((source) => <li key={source.id}><a href={source.location} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ol></section>; }

function RankList({ ranks, empty }: { ranks: Record<string, string>; empty: string }) { const entries = Object.entries(ranks); return entries.length ? <dl className="fe6-rank-list">{entries.map(([weapon, rank]) => <div key={weapon}><dt>{weapon}</dt><dd>{rank}</dd></div>)}</dl> : <p>{empty}</p>; }
function formatWeaponLevels(ranks: Record<string, string>): string { const entries = Object.entries(ranks); return entries.length ? entries.map(([weapon, rank]) => `${weapon} ${rank}`).join(" · ") : "—"; }
function PortraitFallback({ name }: { name: string }) { return <div className="fe6-portrait-fallback" aria-hidden="true">{name.slice(0, 1)}</div>; }
function tierLabel(tier: Fe6Class["tier"]): string { return tier.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function displayValue(value: string | number | null): string | number { return value === null || value === "" ? "—" : value; }
function formatWorth(value: number | null): string { return value === null ? "—" : `${value.toLocaleString()} G`; }
