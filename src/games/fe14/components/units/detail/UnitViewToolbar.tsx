import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { Braces, LayoutList } from "lucide-react";
import { fe14Data } from "../../../data";
import { useLocale } from "../../../../../i18n/LocaleContext";

export type UnitView = "overview" | "json";

export default function UnitViewToolbar({ onChange, view }: { onChange: (view: UnitView) => void; view: UnitView }) {
  const { t } = useLocale();
  return (
    <div className="unit-view-toolbar">
      <ButtonGroup aria-label={t("unit.view.aria")}>
        <Button
          variant={view === "overview" ? "dark" : "outline-secondary"}
          onClick={() => onChange("overview")}
          aria-pressed={view === "overview"}
        >
          <LayoutList aria-hidden="true" size={17} />
          {t("unit.view.overview")}
        </Button>
        <Button
          variant={view === "json" ? "dark" : "outline-secondary"}
          onClick={() => onChange("json")}
          aria-pressed={view === "json"}
        >
          <Braces aria-hidden="true" size={17} />
          {t("unit.view.json")}
        </Button>
      </ButtonGroup>
      <span>{t("unit.lastUpdated", { date: fe14Data.lastUpdated })}</span>
    </div>
  );
}
