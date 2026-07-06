import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import ChallengeCard from '../../challenges/Challenges'
import { colors } from '../../styles/tokens'
import BackButton from '../../components/BackButton'
import PageContainer from '../../components/layout/PageContainer'
import PageHeader from '../../components/layout/PageHeader'
import PageSection from '../../components/layout/PageSection'

const avatarColors = [colors.primary, '#A21CAF', '#B91C1C', colors.secondary, colors.orange]
const colorFor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

const CommunityDashboard = () => {
  const { id } = useParams()
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [community, setCommunity] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [challengesLoading, setChallengesLoading] = useState(true)
  const [challengesError, setChallengesError] = useState(null)
  const [error, setError] = useState(null)

  const token = user.token

  const fetchCommunity = useCallback(async () => {
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}`, { headers: authHeader })
    const json = await res.json()
    if (res.ok) setCommunity(json)
    else setError(json.error)
  }, [id, token])

  const fetchCommunityChallenges = useCallback(async () => {
    setChallengesLoading(true)
    setChallengesError(null)

    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/challenges`, { headers: authHeader })
    const json = await res.json()

    if (res.ok) {
      setChallenges(json)
    } else {
      setChallenges([])
      setChallengesError(json.error || 'Could not load challenges.')
    }

    setChallengesLoading(false)
  }, [id, token])

  useEffect(() => {
    fetchCommunity()
    fetchCommunityChallenges()
  }, [fetchCommunity, fetchCommunityChallenges])

  const handleJoin = async () => {
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/join`, { method: 'POST', headers: authHeader })
    if (res.ok) fetchCommunity() // refresh so the button flips to "Leave"
  }

  const handleLeave = async () => {
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/leave`, { method: 'DELETE', headers: authHeader })
    if (res.ok) {
      fetchCommunity() // refresh so the button flips back to "Join"
      fetchCommunityChallenges() // refresh challenge cards after automatic challenge leave
    }
  }

  const handleJoinChallenge = async (challengeId) => {
    if (community?.membershipStatus !== 'accepted') {
      setChallengesError('Join this community before joining its challenges.')
      return
    }

    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/challenges/${challengeId}/join`, { method: 'POST', headers: authHeader })

    if (res.ok) {
      fetchCommunityChallenges()
    } else {
      const json = await res.json()
      setChallengesError(json.error || 'Could not join challenge.')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this community? This cannot be undone.')) return
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}`, { method: 'DELETE', headers: authHeader })
    if (res.ok) navigate('/communities')
    else {
      const json = await res.json()
      setError(json.error)
    }
  }

  if (error) return <PageContainer maxWidth={760}><Typography color="error">{error}</Typography></PageContainer>
  if (!community) return <PageContainer maxWidth={760}><Typography>Loading…</Typography></PageContainer>

  const isMember = community.membershipStatus === 'accepted'
  const isCreator = community.myRole === 'creator'

  return (

    <Box sx={{ textAlign: 'left' }}>
      <BackButton text="Back to Communities" to="/communities" sx={{ mb: 0 }} />
      <PageHeader
        title={community.name}
        description={`${community.memberCount} members`}
        titleAdornment={(
          <span className="material-symbols-outlined" style={{ color: colors.muted, fontSize: 20 }}>
            {community.isPrivate ? 'lock' : 'public'}
          </span>
        )}
        leading={(
          <Box
            sx={{
              width: 64, height: 64, borderRadius: 3, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              bgcolor: colorFor(community.name), color: '#fff', fontWeight: 800, fontSize: 28,
            }}
          >
            {(community.name?.[0] || '?').toUpperCase()}
          </Box>
        )}
        actions={isCreator ? (
          <Button
            variant="outlined" color="error" onClick={handleDelete}
            startIcon={<span className="material-symbols-outlined">delete</span>}
          >
            Delete
          </Button>
        ) : isMember ? (
          <Button
            variant="outlined" onClick={handleLeave}
            startIcon={<span className="material-symbols-outlined">logout</span>}
          >
            Leave
          </Button>
        ) : (
          <Button variant="contained" onClick={handleJoin}>Join</Button>
        )}
      />

      {community.description && (
        <PageSection title="About" sx={{ mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography sx={{ mt: 0.5 }}>{community.description}</Typography>
          </Paper>
        </PageSection>
      )}

      <PageSection title="Challenges" sx={{ mb: 0 }}>
        {challengesLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : challengesError ? (
          <Alert severity="error">{challengesError}</Alert>
        ) : challenges.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2.5,
            }}
          >
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                onJoin={isMember ? () => handleJoinChallenge(challenge._id) : undefined}
              />
            ))}
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: colors.muted }}>emoji_events</span>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No challenges yet. Challenges for this community will appear here.
            </Typography>
          </Paper>
        )}
      </PageSection>
    </Box>
  )
}

export default CommunityDashboard
