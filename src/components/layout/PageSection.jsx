import { Box, Typography } from '@mui/material'

// Groups a labelled page section with consistent header and content spacing.
const PageSection = ({
  actions,
  children,
  component = 'section',
  contentSx = {},
  description,
  sx = {},
  title,
  titleVariant = 'overline',
}) => (
  <Box component={component} sx={{ mb: 4, ...sx }}>
    {(title || description || actions) && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {title && (
            <Typography component="h2" variant={titleVariant} sx={{ color: 'text.secondary' }}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>
    )}

    <Box sx={contentSx}>{children}</Box>
  </Box>
)

export default PageSection
