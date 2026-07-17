import Table from "react-bootstrap/Table";
import type { PairupTableBonuses } from "./types";
import { formatBonuses } from "./utils";

export default function PairupTable({ bonuses }: { bonuses: PairupTableBonuses }) {
  return (
    <Table className="pairup-table" responsive>
      <thead><tr><th>Rank</th><th>Attack Stance / Tag Team</th><th>Guard Stance / Pair Up</th></tr></thead>
      <tbody>
        <tr>
          <th scope="row">No support</th>
          <td>{formatBonuses(bonuses.attackStance.baseBonus)}</td>
          <td>{formatBonuses(bonuses.guardStance.baseBonus)}</td>
        </tr>
        {(["C", "B", "A", "S"] as const).map((rank) => (
          <tr key={rank}>
            <th scope="row">{rank}</th>
            <td>{formatBonuses(bonuses.attackStance.rankDeltas[rank])}</td>
            <td>{formatBonuses(bonuses.guardStance.rankDeltas[rank])}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
