import { Alert, Box, Button, Chip, CircularProgress, GlobalStyles, Paper, Typography } from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { colors } from '../styles/tokens'
import PageSection from '../components/layout/PageSection'
import { useCommunityFeed } from './useCommunityFeed'
import { formatActivityMessage } from './formatActivityMessage'

const avatarColors = [colors.primary, '#A21CAF', '#B91C1C', colors.secondary, colors.orange]

// Stable avatar color from the actor name's first character.
const colorFor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

// Global keyframes used by live-item flash and the status chip pulse.
const feedAnimations = (
  <GlobalStyles
    styles={{
      '@keyframes habitumFeedFlash': {
        from: { backgroundColor: colors.softBlue },
        to: { backgroundColor: 'transparent' },
      },
      '@keyframes habitumLivePulse': {
        '0%': { boxShadow: `0 0 0 0 ${colors.green}66` },
        '70%': { boxShadow: `0 0 0 6px ${colors.green}00` },
        '100%': { boxShadow: `0 0 0 0 ${colors.green}00` },
      },
    }}
  />
)

// Poll-loop status indicator: live, connecting, or retrying.
const statusChip = (status) => {
  if (status === 'live') {
    return (
      <Chip
        size="small"
        label="Auto-refresh"
        icon={
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%', bgcolor: colors.green,
            ml: 1, animation: 'habitumLivePulse 2s infinite',
          }} />
        }
        sx={{ bgcolor: colors.softGreen, color: colors.green, fontWeight: 700 }}
      />
    )
  }
  return (
    <Chip
      size="small"
      label={status === 'connecting' ? 'Loading…' : 'Retrying…'}
      sx={{ bgcolor: colors.softOrange, color: colors.orange, fontWeight: 700 }}
    />
  )
}

const ActivityItem = ({ activity }) => {
  const segments = formatActivityMessage(activity)
  const actorName = activity.meta?.actorName || '?'

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        px: 2,
        py: 1.5,
        borderRadius: 2,
        // isLive comes from mergeUpdates and flashes newly polled items once.
        ...(activity.isLive && { animation: 'habitumFeedFlash 2.5s ease-out' }),
      }}
    >
      <Box
        sx={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          display: 'grid', placeItems: 'center',
          bgcolor: colorFor(actorName), color: '#fff', fontWeight: 700, fontSize: 15,
        }}
      >
        {actorName[0].toUpperCase()}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
          {segments.map((segment, index) => (
            <Box
              key={index}
              component="span"
              sx={{
                ...(segment.bold && { fontWeight: 700 }),
                ...(segment.italic && { fontStyle: 'italic' }),
              }}
            >
              {segment.text}
            </Box>
          ))}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </Typography>
      </Box>
    </Box>
  )
}

// Self-contained feed panel: hook state, status chip, loading/error/empty/list, and load more.
const ActivityFeed = ({ communityId, challengeId = null, title = 'Activity', enabled = true }) => {
  const { activities, hasMore, loading, error, status, loadMore } = useCommunityFeed(communityId, { challengeId, enabled })

  return (
    // Mobile stacks with spacing; desktop rail top-aligns and scrolls within the viewport.
    <PageSection title={title} actions={statusChip(status)} sx={{ mt: { xs: 4, lg: 0 }, mb: 0 }}>
      {feedAnimations}
      {/* aria-live lets screen readers announce polled-in items politely. */}
      <Paper
        variant="outlined"
        aria-live="polite"
        sx={{
          p: 1,
          maxHeight: { xs: 480, lg: 'calc(100vh - 160px)' },
          overflowY: 'auto',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>
        ) : activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: colors.muted }}>
              bolt
            </span>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {challengeId
                ? 'No activity yet. When someone checks into this challenge, it shows up here automatically.'
                : 'No activity yet. When someone checks into one of this community’s challenges, it shows up here automatically.'}
            </Typography>
          </Box>
        ) : (
          <>
            {activities.map((activity) => (
              <ActivityItem key={activity._id} activity={activity} />
            ))}
            {hasMore && (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 1 }}>
                <Button size="small" onClick={loadMore}>Load more</Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </PageSection>
  )
}

export default ActivityFeed
