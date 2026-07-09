import { Box } from '@mui/material'

// Puts the live activity feed in a sticky right rail on desktop — always in
// view next to the page content, which makes live arrivals far more
// noticeable than a section at the bottom. On mobile the feed stacks below
// the content instead.
//
// All layout logic lives HERE on purpose: the pages that use it
// (CommunityDashboard, ChallengePage) are under active rework by teammates,
// so they only wrap their existing JSX in this component and pass the feed
// as a prop — the smallest possible merge-conflict surface. When `feed` is
// falsy (e.g. non-members), the children render exactly as before.
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
