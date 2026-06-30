import { colors, radii } from './tokens'

export const pillButtonSx = {
  borderRadius: radii.pill,
  px: 2,
  py: 1,
  fontWeight: 800,
}

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

export const linkResetSx = {
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    color: 'inherit',
    textDecoration: 'none',
  },
}

export const sectionTitleSx = {
  mb: 2,
  fontSize: '0.95rem',
  fontWeight: 900,
  letterSpacing: '0.14em',
  color: colors.textSecondary,
  textTransform: 'uppercase',
  textAlign: 'left',
}

export const cardSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 'none',
  backgroundColor: 'background.paper',
}

export const centeredPageSx = {
  minHeight: 'calc(100vh - 48px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  px: { xs: 2, sm: 3 },
  pt: { xs: 4, md: 6 },
  pb: 6,
}

export const centeredContentSx = {
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 2,
}
