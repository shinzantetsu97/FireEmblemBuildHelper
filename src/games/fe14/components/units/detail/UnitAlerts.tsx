import Alert from "react-bootstrap/Alert";
import { TriangleAlert } from "lucide-react";

export function CastleRecruitDataAlert({ unitName }: { unitName: string }) {
  return (
    <Alert className="unit-danger-alert castle-recruit-data-alert" variant="danger">
      <TriangleAlert aria-hidden="true" size={28} />
      <div>
        <strong>Sharing is caring.</strong>
        <p>
          The more you care about {unitName}, the more reliable this table becomes. This game has been out for more than
          10 years, and no one has produced a concrete, accurate data table for {unitName} yet, FFS. If you know a verified
          source or have personally verified this data, I would be most obliged.
        </p>
        <p className="castle-recruit-table-flip">Until then, (╯‵□′)╯︵┻━┻</p>
      </div>
    </Alert>
  );
}

export function ScarletDepartureAlert() {
  return (
    <Alert className="unit-danger-alert scarlet-departure-alert" variant="danger">
      <TriangleAlert aria-hidden="true" size={28} />
      <div>
        <strong>WARNING for Revelation player</strong>
        <p>
          Scarlet permanently leaves the playable army at the end of Revelation Chapter 18. This warning does not apply
          to Birthright.
        </p>
      </div>
    </Alert>
  );
}
