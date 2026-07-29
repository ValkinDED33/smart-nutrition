import { useId, useState, type MouseEvent } from "react";
import { Globe2 } from "lucide-react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  useTheme,
  type ButtonProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { languageLabels as defaultLanguageLabels } from "@shared/i18n";
import type { AppLanguage } from "@shared/types/i18n";

const languageOptions: Array<{
  value: AppLanguage;
  flag: string;
  shortCode: string;
}> = [
  { value: "pl", flag: "🇵🇱", shortCode: "PL" },
  { value: "uk", flag: "🇺🇦", shortCode: "UA" },
  { value: "en", flag: "🇬🇧", shortCode: "GB" },
];

type LanguageMenuButtonProps = {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
  ariaLabel: string;
  id?: string;
  labels?: Record<AppLanguage, string>;
  size?: ButtonProps["size"];
  sx?: SxProps<Theme>;
  disabled?: boolean;
};

const getSafeDomId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

export const LanguageMenuButton = ({
  value,
  onChange,
  ariaLabel,
  id,
  labels = defaultLanguageLabels,
  size = "small",
  sx,
  disabled = false,
}: LanguageMenuButtonProps) => {
  const theme = useTheme();
  const generatedId = useId();
  const customSx = sx ? (Array.isArray(sx) ? sx : [sx]) : [];
  const buttonId = id ?? `language-menu-button-${getSafeDomId(generatedId)}`;
  const menuId = `${buttonId}-menu`;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);
  const activeLanguageOption =
    languageOptions.find((option) => option.value === value) ??
    languageOptions[1]!;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    const trigger = event.currentTarget;

    trigger.blur();
    setAnchorEl(trigger);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (nextLanguage: AppLanguage) => {
    handleClose();

    if (nextLanguage !== value) {
      onChange(nextLanguage);
    }
  };

  return (
    <>
      <Tooltip title={ariaLabel}>
        <Button
          id={buttonId}
          aria-controls={isOpen ? menuId : undefined}
          aria-expanded={isOpen ? "true" : undefined}
          aria-haspopup="menu"
          aria-label={ariaLabel}
          onClick={handleOpen}
          disabled={disabled}
          size={size}
          variant="outlined"
          startIcon={<Globe2 size={16} aria-hidden="true" />}
          sx={[
            {
              minWidth: { xs: 76, sm: 84 },
              height: 40,
              px: { xs: 1, sm: 1.15 },
              borderRadius: 999,
              color: "primary.main",
              borderColor: "var(--sn-border-soft)",
              bgcolor: "var(--sn-surface-glass)",
              textTransform: "none",
              fontWeight: 900,
              "& .MuiButton-startIcon": {
                mr: 0.45,
              },
              "&:hover": {
                borderColor: "var(--sn-border-strong)",
                bgcolor: "var(--sn-accent-soft)",
              },
            },
            ...customSx,
          ]}
        >
          <Stack
            component="span"
            direction="row"
            spacing={0.35}
            alignItems="center"
            justifyContent="center"
            sx={{ minWidth: 0 }}
          >
            <Box component="span" aria-hidden="true" sx={{ lineHeight: 1 }}>
              {activeLanguageOption.flag}
            </Box>
            <Box component="span" sx={{ lineHeight: 1, fontSize: 11 }}>
              {activeLanguageOption.shortCode}
            </Box>
          </Stack>
        </Button>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        disableRestoreFocus
        MenuListProps={{
          "aria-labelledby": buttonId,
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 180,
              borderRadius: 1,
              border: "1px solid var(--sn-border-soft)",
              bgcolor: "var(--sn-surface-elevated)",
              boxShadow: "var(--sn-shadow-card)",
            },
          },
        }}
      >
        {languageOptions.map((option) => {
          const selected = option.value === value;

          return (
            <MenuItem
              key={option.value}
              selected={selected}
              onClick={() => handleSelect(option.value)}
              sx={{
                gap: 1,
                minHeight: 42,
                color: "text.primary",
                fontWeight: selected ? 900 : 800,
                "&.Mui-selected": {
                  color: theme.palette.primary.contrastText,
                  bgcolor: "primary.main",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              <Stack
                component="span"
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Box component="span" aria-hidden="true" sx={{ lineHeight: 1 }}>
                  {option.flag}
                </Box>
                <Box component="span" sx={{ lineHeight: 1 }}>
                  {labels[option.value]}
                </Box>
              </Stack>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
