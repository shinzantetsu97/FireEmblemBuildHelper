import type { ChangeEvent, RefObject } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { Download, FileText, ShieldAlert, Upload } from "lucide-react";
import type { Workspace } from "../../types";
import IconButton from "./IconButton";
import { formatDateTime } from "./utils";
import { useLocale } from "../../i18n/LocaleContext";

export default function BackupBanner({
  activeWorkspace,
  fileInputRef,
  onBackup,
  onImport,
  onTextExport,
}: {
  activeWorkspace: Workspace | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onBackup: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onTextExport: () => void;
}) {
  const { t } = useLocale();
  return (
    <Alert className="data-warning" variant="warning">
      <div className="warning-copy">
        <ShieldAlert aria-hidden="true" size={22} />
        <div>
          <strong>{t("notes.backup.title")}</strong>
          <p>{t("notes.backup.body")}</p>
          {activeWorkspace?.lastExportedAt ? (
            <span>{t("notes.backup.last", { date: formatDateTime(activeWorkspace.lastExportedAt) })}</span>
          ) : (
            <span>{t("notes.backup.none")}</span>
          )}
        </div>
      </div>
      <div className="warning-actions">
        <Button variant="dark" size="sm" onClick={onBackup}>
          <Download aria-hidden="true" size={16} />
          {t("notes.backup.backupBtn")}
        </Button>
        <Button variant="outline-dark" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload aria-hidden="true" size={16} />
          {t("notes.backup.restoreBtn")}
        </Button>
        <IconButton label={t("notes.backup.textExportAria")} onClick={onTextExport}>
          <FileText aria-hidden="true" size={18} />
        </IconButton>
        <input
          ref={fileInputRef}
          accept="application/json,.json"
          aria-label={t("notes.backup.fileAria")}
          className="visually-hidden"
          type="file"
          onChange={onImport}
        />
      </div>
    </Alert>
  );
}
