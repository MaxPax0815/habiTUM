import { Alert, Box, Button, Chip, CircularProgress, GlobalStyles, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { colors } from '../styles/tokens'
import PageSection from '../components/layout/PageSection'
import { useCommunityFeed } from './useCommunityFeed'
import { formatActivityMessage } from './formatActivityMessage'

const avatarColors = [colors.primary, '#A21CAF', '#B91C1C', colors.secondary, colors.orange]

// Stable avatar color from the actor name's first character.
const colorFor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

// Global keyframes used by the one-time flash on newly polled items.
const feedAnimations = (
  <GlobalStyles
    styles={{
      '@keyframes habitumFeedFlash': {
        from: { backgroundColor: colors.softBlue },
        to: { backgroundColor: 'transparent' },
      },
    }}
  />
)

// Poll-loop status indicator only appears while loading or retrying.
const statusChip = (status) => {
  if (status === 'live') return null

  return (
    <Chip
      size="small"
      label={status === 'connecting' ? 'Loading…' : 'Retrying…'}
      sx={{ bgcolor: colors.softOrange, color: colors.orange, fontWeight: 700 }}
    />
  )
}

const feedActions = (status, onClose) => {
  const chip = statusChip(status)

  if (!chip && !onClose) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {chip}
      {onClose && (
        <Tooltip title="Hide activity">
          <IconButton
            aria-label="Hide activity"
            onClick={onClose}
            size="small"
            sx={{ color: colors.muted }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </IconButton>
        </Tooltip>
      )}
    </Box>
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
          bgcolor: colorFor(actorName), color: '#fff', typography: 'body2', fontWeight: 700,
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
const ActivityFeed = ({ communityId, challengeId = null, title = 'Community feed', enabled = true, onClose }) => {
  const { activities, hasMore, loading, error, status, loadMore } = useCommunityFeed(communityId, { challengeId, enabled })

  return (
    // Mobile stacks with spacing; desktop rail top-aligns and scrolls within the viewport.
    <PageSection
      title={title}
      titleSx={{ typography: 'feedTitle', mb: 1, letterSpacing: 0, textTransform: 'none' }}
      actions={feedActions(status, onClose)}
      sx={{ mt: { xs: 4, lg: 0 }, mb: 0 }}
    >
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
                <Button size="small" onClick={loadMore}>Load More</Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </PageSection>
  )
}

export default ActivityFeed
