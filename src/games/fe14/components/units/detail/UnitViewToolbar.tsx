import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { Braces, LayoutList } from "lucide-react";
import { fe14Data } from "../../../data";

export type UnitView = "overview" | "json";

export default function UnitViewToolbar({ onChange, view }: { onChange: (view: UnitView) => void; view: UnitView }) {
  return (
    <div className="unit-view-toolbar">
      <ButtonGroup aria-label="Unit data view">
        <Button
          variant={view === "overview" ? "dark" : "outline-secondary"}
          onClick={() => onChange("overview")}
          aria-pressed={view === "overview"}
        >
          <LayoutList aria-hidden="true" size={17} />
          Overview
        </Button>
        <Button
          variant={view === "json" ? "dark" : "outline-secondary"}
          onClick={() => onChange("json")}
          aria-pressed={view === "json"}
        >
          <Braces aria-hidden="true" size={17} />
          JSON
        </Button>
      </ButtonGroup>
      <span>Last updated {fe14Data.lastUpdated}</span>
    </div>
  );
}
