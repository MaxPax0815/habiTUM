import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import BackButton from '../../components/BackButton'
import CommunityPostCard from '../../components/CommunityPostCard'
import CommunityPostDialog from '../../components/CommunityPostDialog'
import PageContainer from '../../components/layout/PageContainer'
import PageHeader from '../../components/layout/PageHeader'
import PageSection from '../../components/layout/PageSection'
import { colors } from '../../styles/tokens'

const sortCommunityPosts = (a, b) =>
  Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.createdAt) - new Date(a.createdAt)

const CommunityUpdatesPage = () => {
  const { id } = useParams()
  const { user } = useAuthContext()

  const [community, setCommunity] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState(null)
  const [error, setError] = useState(null)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [postDialogKey, setPostDialogKey] = useState(0)
  const [postSubmitting, setPostSubmitting] = useState(false)

  const token = user.token

  const fetchCommunity = useCallback(async () => {
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}`, { headers: authHeader })
    const json = await res.json()

    if (res.ok) setCommunity(json)
    else setError(json.error || 'Could not load community.')
  }, [id, token])

  const fetchCommunityChallenges = useCallback(async () => {
    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/challenges`, { headers: authHeader })
    const json = await res.json()

    if (res.ok) setChallenges(json)
    else setChallenges([])
  }, [id, token])

  const fetchCommunityPosts = useCallback(async () => {
    setPostsLoading(true)
    setPostsError(null)

    const authHeader = { 'Authorization': `Bearer ${token}` }
    const res = await fetch(`/api/communities/${id}/posts`, { headers: authHeader })
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

  const handleCreatePost = async (postForm) => {
    setPostSubmitting(true)
    setPostsError(null)

    console.debug('Creating community post', { communityId: id, postForm })

    try {
      const authHeader = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
      const res = await fetch(`/api/communities/${id}/posts`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(postForm),
      })

      const body = await res.text()
      let json = null
      if (body) {
        try {
          json = JSON.parse(body)
        } catch {
          console.error('Invalid JSON from create post response', body)
          throw new Error('Server returned an invalid response.')
        }
      }

      console.debug('Create post response', { status: res.status, body: json })

      if (res.ok) {
        setPosts((currentPosts) => [json, ...currentPosts].sort(sortCommunityPosts))
        setIsPostDialogOpen(false)
      } else {
        setPostsError(json?.error || 'Could not create post.')
      }
    } catch (error) {
      console.error('Failed to create community post', error)
      setPostsError(error.message || 'Could not create post.')
    } finally {
      setPostSubmitting(false)
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
      setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId))
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
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) => currentPost._id === json._id ? json : currentPost).sort(sortCommunityPosts)
      )
    } else {
      setPostsError(json.error || 'Could not update post.')
    }
  }

  if (error) return <PageContainer maxWidth={760}><Typography color="error">{error}</Typography></PageContainer>
  if (!community) return <PageContainer maxWidth={760}><Typography>Loading...</Typography></PageContainer>

  const canManageCommunity = community.myRole === 'creator' || community.myRole === 'admin'

  return (
    <Box sx={{ textAlign: 'left' }}>
      <BackButton text={`Back to ${community.name}`} to={`/communities/${id}`} sx={{ mb: 0 }} />

      <PageHeader
        title="Community Updates"
        description={community.name}
        actions={canManageCommunity && (
          <Button
            variant="outlined"
            onClick={() => {
              setPostDialogKey((current) => current + 1)
              setIsPostDialogOpen(true)
            }}
            startIcon={<span className="material-symbols-outlined">add</span>}
          >
            New Post
          </Button>
        )}
      />

      <PageSection sx={{ mb: 0 }}>
        {postsLoading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : postsError ? (
          <Alert severity="error">{postsError}</Alert>
        ) : posts.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2.5,
            }}
          >
            {posts.map((post) => (
              <CommunityPostCard
                key={post._id}
                post={post}
                canManage={canManageCommunity}
                onDelete={handleDeletePost}
                onTogglePin={handleTogglePostPinned}
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

      <CommunityPostDialog
        key={postDialogKey}
        open={isPostDialogOpen}
        onClose={() => setIsPostDialogOpen(false)}
        onSubmit={handleCreatePost}
        submitting={postSubmitting}
        challenges={challenges}
      />
    </Box>
  )
}

export default CommunityUpdatesPage
