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
}: LanguageMenuButtonProps) => {
  const theme = useTheme();
  const generatedId = useId();
  const customSx = sx ? (Array.isArray(sx) ? sx : [sx]) : [];
  const buttonId = id ?? `language-menu-button-${getSafeDomId(generatedId)}`;
  const menuId = `${buttonId}-menu`;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isDarkMode = theme.palette.mode === "dark";
  const isOpen = Boolean(anchorEl);
  const activeLanguageOption =
    languageOptions.find((option) => option.value === value) ??
    languageOptions[1]!;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
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
          size={size}
          variant="outlined"
          startIcon={<Globe2 size={16} aria-hidden="true" />}
          sx={[
            {
              minWidth: { xs: 76, sm: 84 },
              height: 40,
              px: { xs: 1, sm: 1.15 },
              borderRadius: 999,
              color: isDarkMode ? "#e2e8f0" : "#0f766e",
              borderColor: isDarkMode
                ? "rgba(148, 163, 184, 0.32)"
                : "rgba(15, 118, 110, 0.24)",
              bgcolor: isDarkMode
                ? "rgba(15, 23, 42, 0.9)"
                : "rgba(255,255,255,0.9)",
              textTransform: "none",
              fontWeight: 900,
              "& .MuiButton-startIcon": {
                mr: 0.45,
              },
              "&:hover": {
                borderColor: isDarkMode
                  ? "rgba(94, 234, 212, 0.42)"
                  : "rgba(15, 118, 110, 0.38)",
                bgcolor: isDarkMode
                  ? "rgba(20, 184, 166, 0.16)"
                  : "rgba(240,253,250,0.96)",
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
        MenuListProps={{
          "aria-labelledby": buttonId,
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 180,
              borderRadius: 2,
              border: "1px solid",
              borderColor: isDarkMode
                ? "rgba(148, 163, 184, 0.22)"
                : "rgba(15, 118, 110, 0.14)",
              bgcolor: isDarkMode ? "#0f172a" : "#ffffff",
              boxShadow: isDarkMode
                ? "0 18px 50px rgba(0,0,0,0.34)"
                : "0 18px 50px rgba(15,23,42,0.14)",
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
                color: isDarkMode ? "#e2e8f0" : "#14213d",
                fontWeight: selected ? 900 : 800,
                "&.Mui-selected": {
                  color: "#ffffff",
                  bgcolor: "#0f766e",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "#115e59",
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
