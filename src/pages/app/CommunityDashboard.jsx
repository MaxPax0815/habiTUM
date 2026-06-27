import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Paper, Typography } from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import { colors } from '../../theme'

const avatarColors = [colors.primary, '#A21CAF', '#B91C1C', colors.secondary, colors.orange]
const colorFor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

const CommunityDashboard = () => {
  const { id } = useParams()
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [community, setCommunity] = useState(null)
  const [error, setError] = useState(null)

  const authHeader = { 'Authorization': `Bearer ${user.token}` }

  const fetchCommunity = useCallback(async () => {
    const res = await fetch(`/api/communities/${id}`, { headers: authHeader })
    const json = await res.json()
    if (res.ok) setCommunity(json)
    else setError(json.error)
  }, [id, user])

  useEffect(() => { fetchCommunity() }, [fetchCommunity])

  const handleJoin = async () => {
    const res = await fetch(`/api/communities/${id}/join`, { method: 'POST', headers: authHeader })
    if (res.ok) fetchCommunity() // refresh so the button flips to "Joined"
  }

  if (error) return <Box sx={{ maxWidth: 760, mx: 'auto' }}><Typography color="error">{error}</Typography></Box>
  if (!community) return <Box sx={{ maxWidth: 760, mx: 'auto' }}><Typography>Loading…</Typography></Box>

  const isMember = community.membershipStatus === 'accepted'

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', textAlign: 'left' }}>
      <Button
        onClick={() => navigate('/communities')}
        sx={{ color: 'text.secondary', mb: 2, px: 0 }}
        startIcon={<span className="material-symbols-outlined">arrow_back</span>}
      >
        Back to Communities
      </Button>

      {/* Header card */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box
          sx={{
            width: 64, height: 64, borderRadius: 3, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            bgcolor: colorFor(community.name), color: '#fff', fontWeight: 800, fontSize: 28,
          }}
        >
          {(community.name?.[0] || '?').toUpperCase()}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{community.name}</Typography>
            <span className="material-symbols-outlined" style={{ color: colors.muted, fontSize: 20 }}>
              {community.isPrivate ? 'lock' : 'public'}
            </span>
          </Box>
          <Typography color="text.secondary">{community.memberCount} members</Typography>
        </Box>
        {isMember ? (
          <Button variant="outlined" disabled startIcon={<span className="material-symbols-outlined">check</span>}>
            Joined
          </Button>
        ) : (
          <Button variant="contained" onClick={handleJoin}>Join</Button>
        )}
      </Paper>

      {community.description && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="overline" color="text.secondary">About</Typography>
          <Typography sx={{ mt: 0.5 }}>{community.description}</Typography>
        </Paper>
      )}

      {/* Challenges placeholder — the real feature comes later */}
      <Typography variant="overline" color="text.secondary">Challenges</Typography>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center', mt: 1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: colors.muted }}>emoji_events</span>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No challenges yet. Challenges for this community will appear here.
        </Typography>
      </Paper>
    </Box>
  )
}

export default CommunityDashboard
