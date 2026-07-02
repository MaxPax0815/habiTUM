import { colors, radii } from './tokens'

// Provides the shared shape, spacing, and typography for pill-shaped buttons.
export const pillButtonSx = {
  borderRadius: radii.pill,
  px: 2,
  py: 1,
  fontWeight: 800,
}

// Extends the pill button style with the standard outlined colors and hover state.
export const outlinedPillButtonSx = {
  ...pillButtonSx,
  color: colors.textPrimary,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  '&:hover': {
    border: '1px solid',
    borderColor: colors.primary,
    backgroundColor: colors.softBlue,
  },
}

// Removes default link decoration while preserving the surrounding text color.
export const linkResetSx = {
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    color: 'inherit',
    textDecoration: 'none',
  },
}

// Styles compact uppercase headings used to introduce sections within a page.
export const sectionTitleSx = {
  mb: 2,
  fontSize: '0.95rem',
  fontWeight: 900,
  letterSpacing: '0.14em',
  color: colors.textSecondary,
  textTransform: 'uppercase',
  textAlign: 'left',
}

// Centers a page vertically and horizontally with responsive outer spacing.
export const centeredPageSx = {
  minHeight: 'calc(100vh - 48px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  px: { xs: 2, sm: 3 },
  pt: { xs: 4, md: 6 },
  pb: 6,
}

// Centers content within a reduced-height area, such as loading or empty states.
export const centeredContentSx = {
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 2,
}
