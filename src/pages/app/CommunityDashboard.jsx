import { useEffect, useState, useCallback } from 'react'
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import ChallengeCard from '../../challenges/Challenges'
import { colors } from '../../styles/tokens'
import BackButton from '../../components/BackButton'
import CommunityPostCard from '../../components/CommunityPostCard'
import CommunityPostDialog from '../../components/CommunityPostDialog'
import PageContainer from '../../components/layout/PageContainer'
import PageHeader from '../../components/layout/PageHeader'
import PageSection from '../../components/layout/PageSection'

const avatarColors = [colors.primary, '#A21CAF', '#B91C1C', colors.secondary, colors.orange]
const colorFor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

const CommunityLogo = ({ community }) => (
  <Box
    sx={{
      width: 76,
      height: 76,
      borderRadius: 3,
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${colors.border}`,
      bgcolor: colors.surface,
      overflow: 'hidden',
    }}
  >
    {community.logoUrl ? (
      <Box
        component="img"
        src={community.logoUrl}
        alt={`${community.name} logo`}
        sx={{
          width: '74%',
          height: '74%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: colorFor(community.name),
          color: '#fff',
          fontWeight: 800,
          fontSize: 30,
        }}
      >
        {(community.name?.[0] || '?').toUpperCase()}
      </Box>
    )}
  </Box>
)

const CommunityDashboard = () => {
  const { id } = useParams()
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [community, setCommunity] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [posts, setPosts] = useState([])
  const [challengesLoading, setChallengesLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [challengesError, setChallengesError] = useState(null)
  const [postsError, setPostsError] = useState(null)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [postSubmitting, setPostSubmitting] = useState(false)
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

  const fetchCommunityPosts = useCallback(async () => {
    setPostsLoading(true)
    setPostsError(null)

    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/posts?limit=3`, { headers: authHeader })
    const json = await res.json()

    if (res.ok) {
      setPosts(json)
    } else {
      setPosts([])
      setPostsError(json.error || 'Could not load community updates.')
    }

    setPostsLoading(false)
  }, [id, token])

  useEffect(() => {
    fetchCommunity()
    fetchCommunityChallenges()
    fetchCommunityPosts()
  }, [fetchCommunity, fetchCommunityChallenges, fetchCommunityPosts])

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

  const handleClosePostDialog = () => {
    setIsPostDialogOpen(false)
  }

  const handleCreatePost = async (postForm) => {
    setPostSubmitting(true)
    setPostsError(null)

    const authHeader = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
    const res = await fetch(`/api/communities/${id}/posts`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        ...postForm,
        challenge: postForm.challenge || null,
        eventDate: postForm.eventDate || null,
      }),
    })
    const json = await res.json()

    setPostSubmitting(false)

    if (res.ok) {
      setPosts((currentPosts) => [json, ...currentPosts].sort((a, b) =>
        Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 3))
      handleClosePostDialog()
    } else {
      setPostsError(json.error || 'Could not create post.')
    }
  }

  const handleDeletePost = async (postId) => {
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/posts/${postId}`, {
      method: 'DELETE',
      headers: authHeader,
    })
    const json = await res.json()

    if (res.ok) {
      fetchCommunityPosts()
    } else {
      setPostsError(json.error || 'Could not delete post.')
    }
  }

  const handleTogglePostPinned = async (post) => {
    setPostsError(null)

    const authHeader = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
    const res = await fetch(`/api/communities/${id}/posts/${post._id}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ pinned: !post.pinned }),
    })
    const json = await res.json()

    if (res.ok) {
      fetchCommunityPosts()
    } else {
      setPostsError(json.error || 'Could not update post.')
    }
  }

  if (error) return <PageContainer maxWidth={760}><Typography color="error">{error}</Typography></PageContainer>
  if (!community) return <PageContainer maxWidth={760}><Typography>Loading…</Typography></PageContainer>

  const isMember = community.membershipStatus === 'accepted'
  const isCreator = community.myRole === 'creator'
  const canManageCommunity = isCreator || community.myRole === 'admin'
  const previewPosts = posts.slice(0, 2)
  const hasMorePosts = posts.length > 2

  return (

    <Box sx={{ textAlign: 'left' }}>
      <BackButton text="Back to Communities" to="/communities" sx={{ mb: 0 }} />
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
        <PageHeader
          title={community.name}
          description={`${community.memberCount} members`}
          sx={{ mb: 0 }}
          titleAdornment={(
            <span className="material-symbols-outlined" style={{ color: colors.muted, fontSize: 20 }}>
              {community.isPrivate ? 'lock' : 'public'}
            </span>
          )}
          leading={<CommunityLogo community={community} />}
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
      </Paper>

      {community.description && (
        <PageSection title="About" sx={{ mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography sx={{ mt: 0.5 }}>{community.description}</Typography>
          </Paper>
        </PageSection>
      )}

      <PageSection
        title="Community Updates"
        actions={(hasMorePosts || canManageCommunity) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
            {hasMorePosts && (
              <Button
                component={RouterLink}
                to={`/communities/${id}/updates`}
                variant="text"
                endIcon={<span className="material-symbols-outlined">arrow_forward</span>}
              >
                View all
              </Button>
            )}
            {canManageCommunity && (
              <Button
                variant="outlined"
                onClick={() => setIsPostDialogOpen(true)}
                startIcon={<span className="material-symbols-outlined">add</span>}
              >
                New Post
              </Button>
            )}
          </Stack>
        )}
      >
        {postsLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : postsError ? (
          <Alert severity="error">{postsError}</Alert>
        ) : previewPosts.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2.5,
            }}
          >
            {previewPosts.map((post) => (
              <CommunityPostCard
                key={post._id}
                post={post}
                canManage={canManageCommunity}
                onDelete={handleDeletePost}
                onTogglePin={handleTogglePostPinned}
                bodyLineClamp={3}
              />
            ))}
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: colors.muted }}>campaign</span>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No community updates yet.
            </Typography>
          </Paper>
        )}
      </PageSection>

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

      <CommunityPostDialog
        open={isPostDialogOpen}
        onClose={handleClosePostDialog}
        onSubmit={handleCreatePost}
        submitting={postSubmitting}
        challenges={challenges}
      />
    </Box>
  )
}

export default CommunityDashboard
