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
  textDecoration: 'none',
  border: 'none',
  borderBottom: 'none',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  '&:hover': {
    textDecoration: 'none',
  },
  '&:focus-visible': {
    outline: `2px solid ${colors.primary}`,
    outlineOffset: 4,
    borderRadius: radii.small,
  },
}

// Styles compact uppercase headings used to introduce sections within a page.
export const sectionTitleSx = {
  typography: 'sectionTitle',
  mb: 2,
  color: colors.textSecondary,
  textAlign: 'left',
}

export const fieldLabelSx = {
  typography: 'fieldLabel',
  color: colors.textPrimary,
  mb: 0.5,
  textAlign: 'left',
}

export const finePrintSx = {
  typography: 'finePrint',
}

export const tooltipContentSx = {
  typography: 'body1',
  px: 2,
  py: 1.25,
  maxWidth: 320,
}

export const compactCardTitleSx = {
  typography: 'h6',
  fontWeight: 800,
  lineHeight: 1.25,
  color: colors.textPrimary,
}

export const compactCardBodySx = {
  typography: 'body2',
  lineHeight: 1.55,
  color: colors.textSecondary,
}

export const compactCardMetaSx = {
  typography: 'caption',
  color: colors.muted,
}

// Keeps progress indicators visually identical wherever they appear in cards.
export const progressTrackSx = {
  height: 6,
  borderRadius: radii.pill,
  overflow: 'hidden',
  backgroundColor: colors.progressTrack,
  '& .MuiLinearProgress-bar': {
    borderRadius: radii.pill,
  },
}

// Reserves a stable action column in repeated card rows and prevents label wrapping.
export const cardActionButtonSx = {
  minWidth: 112,
  flexShrink: 0,
  whiteSpace: 'nowrap',
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
