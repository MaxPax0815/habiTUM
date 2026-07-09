import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, InputBase, Paper, Typography } from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import { useCommunities } from '../../hooks/useCommunites'
import { colors, radii } from '../../styles/tokens'
import AppDialog from '../../components/AppDialog'
import PageHeader from '../../components/layout/PageHeader'
import PageSection from '../../components/layout/PageSection'
import CommunityForm from './CommunityForm'

// Deterministic avatar colour from the community name so each one looks distinct
// without storing a colour (logo/brand colour are deferred to a later version).
const avatarColors = [colors.primary, '#A21CAF', '#B91C1C', colors.secondary, colors.orange]
const colorFor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

// Small reusable logo slot showing the community logo or the first letter.
const CommunityAvatar = ({ logoUrl, name, size = 44 }) => (
  <Box
    sx={{
      width: size, height: size, borderRadius: 2, flexShrink: 0,
      display: 'grid', placeItems: 'center',
      border: `1px solid ${colors.border}`,
      bgcolor: colors.surface,
      overflow: 'hidden',
    }}
  >
    {logoUrl ? (
      <Box
        component="img"
        src={logoUrl}
        alt={`${name} logo`}
        sx={{ width: '72%', height: '72%', objectFit: 'contain', display: 'block' }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: colorFor(name),
          color: '#fff',
          fontWeight: 800,
        }}
      >
        {(name?.[0] || '?').toUpperCase()}
      </Box>
    )}
  </Box>
)

const Communities = () => {
  const { user } = useAuthContext()
  const { communities, fetchCommunities } = useCommunities()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false) // create-community popup

  const canCreate = user.accountType === 'manager' || user.subscription === 'premium'

  useEffect(() => { fetchCommunities() }, [fetchCommunities])

  const term = search.trim().toLowerCase()
  const matches = (c) => c.name.toLowerCase().includes(term)

  const joined = communities.filter((c) => c.membershipStatus === 'accepted' && matches(c))
  const discover = communities.filter((c) => c.membershipStatus !== 'accepted' && matches(c))

  return (
    <Box sx={{ textAlign: 'left' }}>
      <PageHeader
        title="Communities"
        description="Connect with people building better habits together."
      />

      {/* Search */}
      <Paper
        variant="outlined"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderRadius: radii.button, mb: 4 }}
      >
        <span className="material-symbols-outlined" style={{ color: colors.muted }}>search</span>
        <InputBase
          fullWidth
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      <PageSection
        title="Your communities"
        actions={<Typography variant="caption" color="text.secondary">{joined.length} joined</Typography>}
      >
        {joined.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: colors.muted }}>group</span>
            <Typography sx={{ fontWeight: 700, mt: 1 }}>No communities yet</Typography>
            <Typography variant="body2" color="text.secondary">Join a community below to get started.</Typography>
          </Paper>
        ) : (
          <Box>
            {joined.map((c) => (
              <Paper
                key={c._id}
                variant="outlined"
                onClick={() => navigate(`/communities/${c._id}`)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 1.5,
                  cursor: 'pointer', '&:hover': { borderColor: colors.primary, bgcolor: colors.softBlue },
                }}
              >
                <CommunityAvatar logoUrl={c.logoUrl} name={c.name} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{c.description}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">{c.memberCount} members</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </PageSection>

      {/* CREATE YOUR OWN — always visible. Free users see a locked state
          instead of the active create button (gating is also enforced backend-side). */}
      <PageSection title="Create your own community">
        <Paper
          variant="outlined"
          sx={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 2.5, opacity: canCreate ? 1 : 0.85,
          }}
        >
        {/* lock badge sits on top of the card for free users */}
        {!canCreate && (
          <Box
            sx={{
              position: 'absolute', top: -12, left: 20,
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1, py: 0.25, borderRadius: radii.pill,
              bgcolor: colors.primaryDark, color: '#fff',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Premium</Typography>
          </Box>
        )}

        <Box>
          <Typography sx={{ fontWeight: 700 }}>Start something new</Typography>
          <Typography variant="body2" color="text.secondary">
            {canCreate
              ? 'Build your own accountability community.'
              : 'Upgrade to premium to create your own community.'}
          </Typography>
        </Box>

        {canCreate ? (
          <Button variant="outlined" onClick={() => setIsCreateDialogOpen(true)}>
            + Create Community
          </Button>
        ) : (
          <Button
            variant="outlined"
            disabled
            startIcon={<span className="material-symbols-outlined">lock</span>}
          >
            Premium only
          </Button>
        )}
        </Paper>
      </PageSection>

      <PageSection
        title="Discover communities"
        actions={<Typography variant="caption" color="text.secondary">{discover.length} available</Typography>}
        sx={{ mb: 0 }}
      >
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {discover.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            No communities to discover right now.
          </Typography>
        )}
        {discover.map((c, i) => (
          <Box
            key={c._id}
            sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2,
              borderTop: i === 0 ? 'none' : `1px solid ${colors.border}`,
            }}
          >
            <CommunityAvatar logoUrl={c.logoUrl} name={c.name} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{c.name}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{c.description}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {c.memberCount} members
            </Typography>
            <Button
              variant="outlined"
              startIcon={<span className="material-symbols-outlined">visibility</span>}
              onClick={() => navigate(`/communities/${c._id}`)}
            >
              View
            </Button>
          </Box>
        ))}
        </Paper>
      </PageSection>

      {/* Create-community popup — same dialog/blur behaviour as the habit and
          challenge forms. On success, open the new community's page. */}
      <AppDialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <CommunityForm
          onCreated={(community) => navigate(`/communities/${community._id}`)}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      </AppDialog>
    </Box>
  )
}

export default Communities
