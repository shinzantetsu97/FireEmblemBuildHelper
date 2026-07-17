import Table from "react-bootstrap/Table";
import { displayId, type UnitRuntime } from "../../../data/fe14";
import GrowthBar from "./GrowthBar";
import { STAT_KEYS } from "./types";
import { formatSigned } from "./utils";

export default function StatComparison({ unit }: { unit: UnitRuntime }) {
  const growths = unit.growths[0]?.rates;
  const caps = unit.capModifiers?.modifiers;

  return (
    <Table className="stat-table" responsive>
      <thead>
        <tr>
          <th>Stat</th>
          <th>Personal growth</th>
          <th>Cap modifier</th>
        </tr>
      </thead>
      <tbody>
        {STAT_KEYS.map((stat) => (
          <tr key={stat}>
            <th scope="row">{stat === "hp" ? "HP" : displayId(stat)}</th>
            <td><GrowthBar value={growths?.[stat] ?? 0} /></td>
            <td>{stat === "hp" ? "—" : formatSigned(caps?.[stat] ?? 0)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td>{Object.values(growths ?? {}).reduce((sum, value) => sum + value, 0)}%</td>
          <td>—</td>
        </tr>
      </tfoot>
    </Table>
  );
}
