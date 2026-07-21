import Alert from "react-bootstrap/Alert";
import { TriangleAlert } from "lucide-react";
import { useLocale } from "../../../../../i18n/LocaleContext";

export function ScarletDepartureAlert() {
  const { t } = useLocale();
  return (
    <Alert className="unit-danger-alert scarlet-departure-alert" variant="danger">
      <TriangleAlert aria-hidden="true" size={28} />
      <div>
        <strong>{t("alert.scarlet.title")}</strong>
        <p>{t("alert.scarlet.body")}</p>
      </div>
    </Alert>
  );
}
