import Alert from "react-bootstrap/Alert";
import { TriangleAlert } from "lucide-react";

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
