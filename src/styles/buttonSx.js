import { colors } from "../theme";

export const pillButtonSx = {
    borderRadius: 999,
    px: 2,
    py: 1,
    fontWeight: 800,
}

export const outlinedPillButtonSx = {
  ...pillButtonSx,
  color: colors.textPrimary,
  borderColor: colors.border,
  backgroundColor: colors.surface,

  "&:hover": {
    border: "1px solid",
    borderColor: colors.primary,
    backgroundColor: colors.softBlue,
  },
};