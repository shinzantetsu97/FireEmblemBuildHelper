import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

export default function IconButton({
  children,
  label,
  onClick,
  variant = "outline-secondary",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: string;
}): React.ReactElement {
  return (
    <OverlayTrigger overlay={<Tooltip>{label}</Tooltip>} placement="top">
      <Button aria-label={label} className="icon-button" onClick={onClick} size="sm" variant={variant}>
        {children}
      </Button>
    </OverlayTrigger>
  );
}
