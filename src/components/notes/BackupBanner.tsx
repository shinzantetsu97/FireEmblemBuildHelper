import type { ChangeEvent, RefObject } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { Download, FileText, ShieldAlert, Upload } from "lucide-react";
import type { Workspace } from "../../types";
import IconButton from "./IconButton";
import { formatDateTime } from "./utils";

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
  return (
    <Alert className="data-warning" variant="warning">
      <div className="warning-copy">
        <ShieldAlert aria-hidden="true" size={22} />
        <div>
          <strong>Back up this browser-local workspace.</strong>
          <p>
            Clearing site data, using private browsing, or switching browsers or devices can
            remove your notes. JSON backups restore data; text summaries are for reading.
          </p>
          {activeWorkspace?.lastExportedAt ? (
            <span>Last JSON backup: {formatDateTime(activeWorkspace.lastExportedAt)}</span>
          ) : (
            <span>No JSON backup recorded yet.</span>
          )}
        </div>
      </div>
      <div className="warning-actions">
        <Button variant="dark" size="sm" onClick={onBackup}>
          <Download aria-hidden="true" size={16} />
          Backup JSON
        </Button>
        <Button variant="outline-dark" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload aria-hidden="true" size={16} />
          Restore backup
        </Button>
        <IconButton label="Download readable text summary" onClick={onTextExport}>
          <FileText aria-hidden="true" size={18} />
        </IconButton>
        <input
          ref={fileInputRef}
          accept="application/json,.json"
          aria-label="Choose JSON backup file"
          className="visually-hidden"
          type="file"
          onChange={onImport}
        />
      </div>
    </Alert>
  );
}
