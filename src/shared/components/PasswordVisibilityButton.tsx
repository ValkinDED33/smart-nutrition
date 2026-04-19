import { IconButton, SvgIcon } from "@mui/material";

const EyeIcon = ({ crossed = false }: { crossed?: boolean }) => (
  <SvgIcon fontSize="small" viewBox="0 0 24 24">
    <path
      d="M12 5C6.5 5 2.1 8.4 1 12c1.1 3.6 5.5 7 11 7s9.9-3.4 11-7c-1.1-3.6-5.5-7-11-7Zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4Zm0-2A2.2 2.2 0 1 0 12 9.8a2.2 2.2 0 0 0 0 4.4Z"
      fill="currentColor"
    />
    {crossed && (
      <path
        d="M4.2 3 3 4.2l16.8 16.8 1.2-1.2L4.2 3Z"
        fill="currentColor"
      />
    )}
  </SvgIcon>
);

interface PasswordVisibilityButtonProps {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}

export const PasswordVisibilityButton = ({
  visible,
  onToggle,
  showLabel,
  hideLabel,
}: PasswordVisibilityButtonProps) => (
  <IconButton
    edge="end"
    onClick={onToggle}
    aria-label={visible ? hideLabel : showLabel}
    size="small"
  >
    <EyeIcon crossed={!visible} />
  </IconButton>
);
