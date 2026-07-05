import { Box, Stack, Typography } from '@mui/material'

// Aligns a page title, supporting text, adornment, and actions responsively.
const PageHeader = ({
  actions,
  description,
  eyebrow,
  headingComponent = 'h1',
  sx = {},
  title,
  titleAdornment,
}) => (
  <Box
    component="header"
    sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: { xs: 'stretch', sm: 'flex-start' },
      justifyContent: 'space-between',
      gap: 2,
      mb: 4,
      textAlign: 'left',
      ...sx,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      {eyebrow && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          {eyebrow}
        </Typography>
      )}

      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" component={headingComponent}>
          {title}
        </Typography>
        {titleAdornment}
      </Stack>

      {description && (
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.75 }}>
          {description}
        </Typography>
      )}
    </Box>

    {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
  </Box>
)

export default PageHeader
