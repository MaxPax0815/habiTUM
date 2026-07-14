import { useState } from 'react'
import { Box, Button, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { colors } from '../styles/tokens'

const ShowFeedButton = ({ onClick }) => (
  <Button
    aria-label="Show feed"
    onClick={onClick}
    size="small"
    variant="outlined"
    startIcon={<span className="material-symbols-outlined">bolt</span>}
    sx={{
      flexShrink: 0,
      borderColor: colors.border,
      color: colors.primary,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      '&:hover': { bgcolor: colors.softBlue, borderColor: colors.primary },
    }}
  >
    Show feed
  </Button>
)

// Sticky desktop feed rail; mobile stacks below, and falsy feed leaves children unchanged.
const FeedRailLayout = ({ feed, feedKey = 'activity-feed', children }) => {
  const theme = useTheme()
  const canToggleFeed = useMediaQuery(theme.breakpoints.up('lg'))
  const hasFeed = Boolean(feed)
  const feedIdentity = hasFeed ? feedKey : null
  const [closedFeedIdentity, setClosedFeedIdentity] = useState(null)
  const isFeedOpen = !canToggleFeed || closedFeedIdentity !== feedIdentity
  const handleCloseFeed = canToggleFeed ? () => setClosedFeedIdentity(feedIdentity) : undefined
  const handleShowFeed = () => setClosedFeedIdentity(null)

  const showFeedButton = canToggleFeed && hasFeed && !isFeedOpen
    ? <ShowFeedButton onClick={handleShowFeed} />
    : null
  const renderedChildren = typeof children === 'function'
    ? children({ showFeedButton })
    : children

  if (!feed) return renderedChildren

  if (!isFeedOpen) return <Box sx={{ minWidth: 0 }}>{renderedChildren}</Box>

  const feedPanel = typeof feed === 'function' ? feed({ onClose: handleCloseFeed }) : feed

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0 }}>{renderedChildren}</Box>
      <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 }, minWidth: 0 }}>{feedPanel}</Box>
    </Box>
  )
}

export default FeedRailLayout
