import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { compactCardBodySx, compactCardMetaSx, compactCardTitleSx } from '../styles/recipes'

const formatDateTime = (value) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getAuthorName = (author) => {
  if (!author) return 'Community team'

  const fullName = [author.firstName, author.lastName].filter(Boolean).join(' ')
  return fullName || author.username || 'Community team'
}

const CommunityPostCard = ({ bodyLineClamp, canManage, onDelete, onTogglePin, post }) => {
  const createdAt = formatDateTime(post.createdAt)
  const eventDate = formatDateTime(post.eventDate)

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', height: '100%' }}>
      {post.imageUrl && (
        <Box
          component="img"
          src={post.imageUrl}
          alt={post.title}
          sx={{
            width: '100%',
            height: { xs: 180, md: 220 },
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
              {post.pinned && <Chip label="Pinned" size="small" color="primary" />}
              {post.challenge && <Chip label={post.challenge.title} size="small" variant="outlined" />}
              {eventDate && <Chip label={eventDate} size="small" variant="outlined" />}
            </Stack>

            <Typography component="h3" sx={compactCardTitleSx}>
              {post.title}
            </Typography>
          </Box>

          {canManage && (
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Tooltip title={post.pinned ? 'Unpin post' : 'Pin post'}>
                <IconButton
                  aria-label={post.pinned ? 'Unpin post' : 'Pin post'}
                  onClick={() => onTogglePin(post)}
                  size="small"
                  color={post.pinned ? 'primary' : 'default'}
                >
                  <span className="material-symbols-outlined">push_pin</span>
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete post">
                <IconButton aria-label="Delete post" onClick={() => onDelete(post._id)} size="small">
                  <span className="material-symbols-outlined">delete</span>
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>

        {post.body && (
          <Typography
            sx={{
              ...compactCardBodySx,
              mt: 1,
              ...(bodyLineClamp
                ? {
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: bodyLineClamp,
                  }
                : {}),
            }}
          >
            {post.body}
          </Typography>
        )}

        <Typography sx={{ ...compactCardMetaSx, display: 'block', mt: 2 }}>
          {getAuthorName(post.author)}{createdAt ? ` · ${createdAt}` : ''}
        </Typography>
      </Box>
    </Paper>
  )
}

export default CommunityPostCard
