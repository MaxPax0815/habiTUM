import { Box } from '@mui/material'

// Sticky desktop feed rail; mobile stacks below, and falsy feed leaves children unchanged.
const FeedRailLayout = ({ feed, children }) => {
  if (!feed) return children

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0 }}>{children}</Box>
      <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 }, minWidth: 0 }}>{feed}</Box>
    </Box>
  )
}

export default FeedRailLayout
