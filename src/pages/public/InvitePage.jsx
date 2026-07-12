import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import { authFetch } from '../../auth/authFetch'
import { colors } from '../../styles/tokens'

// ---------------------------------------------------------------------------
// InvitePage.jsx — landing page for a community invite link (/invite/:code).
//
// Invite links only work for logged-in users: if nobody is logged in we send
// them to the login page with ?redirect back here, so they land straight back
// on the invite once they're in. When a user IS logged in we redeem the code
// immediately and drop them on the community page.
// ---------------------------------------------------------------------------

const InvitePage = () => {
  const { code } = useParams()
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [error, setError] = useState(null)

  // Redeem the code as soon as we have a logged-in user. Idempotent on the
  // backend, so a double-run (React strict mode) is harmless.
  useEffect(() => {
    if (!user) return undefined

    let isActive = true

    const redeemInvite = async () => {
      try {
        // authFetch: an expired session 401s and logs out globally, which drops
        // us into the !user branch below — i.e. straight to login, and back here.
        const response = await authFetch(`/api/communities/invite/${code}/join`, {
          method: 'POST',
          token: user.token,
        })
        const json = await response.json()
        if (!isActive) return

        if (response.ok) {
          // Already a member or newly joined — either way, show the community.
          navigate(`/communities/${json.community._id}`, { replace: true })
        } else {
          setError(json.error || 'This invite link is not valid.')
        }
      } catch {
        if (isActive) setError('Could not reach the server. Please try again.')
      }
    }

    redeemInvite()

    return () => { isActive = false }
  }, [code, user, navigate])

  // Not logged in: send them to log in, remembering where they were headed.
  if (!user) {
    return <Navigate to={`/login?redirect=/invite/${code}`} replace />
  }

  if (error) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', maxWidth: 420 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: colors.muted }}>
            link_off
          </span>
          <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, mb: 1 }}>
            Invite not valid
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/communities')}>
            Browse Communities
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', gap: 2 }}>
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        Joining community…
      </Typography>
    </Box>
  )
}

export default InvitePage
