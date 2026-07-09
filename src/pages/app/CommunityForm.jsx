import { useState } from 'react'
import { Box, Button, InputBase, Paper, Typography } from '@mui/material'
import { useAuthContext } from '../../auth/useAuthContext'
import { useCommunities } from '../../hooks/useCommunites'
import { colors, radii } from '../../styles/tokens'
import { sectionTitleSx } from '../../styles/recipes'

// ---------------------------------------------------------------------------
// CommunityForm.jsx
// Create-community form, rendered inside an AppDialog (same popup behaviour as
// the habit and challenge forms). The caller controls open/close and is told
// about a successful create via onCreated(community).
// ---------------------------------------------------------------------------

// One selectable visibility card (Public / Private). Highlights when active.
const VisibilityCard = ({ icon, title, subtitle, active, onClick }) => (
  <Paper
    variant="outlined"
    onClick={onClick}
    sx={{
      flex: 1, p: 2, cursor: onClick ? 'pointer' : 'default',
      borderColor: active ? colors.primary : colors.border,
      bgcolor: active ? colors.softBlue : colors.surface,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <span className="material-symbols-outlined" style={{ color: active ? colors.primary : colors.muted }}>{icon}</span>
      <Typography sx={{ fontWeight: 700, color: active ? colors.primary : colors.textPrimary }}>{title}</Typography>
    </Box>
    <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
  </Paper>
)

// Reusable labelled field used for both the name input and the goal textarea.
const Field = ({ label, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography component="h2" sx={sectionTitleSx}>{label}</Typography>
    {children}
  </Box>
)

const inputSx = {
  border: `1px solid ${colors.border}`, borderRadius: radii.button, px: 2, py: 1.25, width: '100%',
}

const CommunityForm = ({ onCreated, onClose }) => {
  const { user } = useAuthContext()
  const { createCommunity } = useCommunities()

  // Only managers may create public communities; premium users are limited to
  // private, invite-only ones (also enforced on the backend).
  const canCreatePublic = user?.accountType === 'manager'

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoError, setLogoError] = useState(false)
  const [isPrivate, setIsPrivate] = useState(!canCreatePublic)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const trimmedLogoUrl = logoUrl.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    // logoUrl is optional; send undefined when blank so the schema default applies.
    const { ok, data } = await createCommunity({
      name,
      description,
      isPrivate,
      logoUrl: trimmedLogoUrl || undefined,
    })
    setSubmitting(false)
    if (ok) {
      onCreated?.(data)
      onClose?.()
    } else {
      setError(data.error)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" sx={{ color: colors.textPrimary, fontWeight: 900 }}>
        New Community
      </Typography>
      <Typography sx={{ mt: 0.5, mb: 3, color: colors.muted, fontWeight: 700 }}>
        Start your own accountability community.
      </Typography>

      <Field label="Community name">
        <InputBase sx={inputSx} placeholder="e.g. TUM Running Club"
          value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Community goal">
        <InputBase sx={inputSx} multiline minRows={3}
          placeholder="What is this community about? What shared goal brings members together?"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <Field label="Logo URL (optional)">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Live preview: the linked image, or the community's first letter as a
              fallback (also used when the URL is empty or fails to load). */}
          <Box
            sx={{
              width: 48, height: 48, borderRadius: radii.button, flexShrink: 0,
              border: `1px solid ${colors.border}`, overflow: 'hidden',
              display: 'grid', placeItems: 'center',
              bgcolor: colors.softBlue, color: colors.primary, fontWeight: 800,
            }}
          >
            {trimmedLogoUrl && !logoError ? (
              <Box component="img" src={trimmedLogoUrl} alt="Logo preview"
                onError={() => setLogoError(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              (name.trim()[0] || '?').toUpperCase()
            )}
          </Box>
          <InputBase
            sx={inputSx}
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => { setLogoUrl(e.target.value); setLogoError(false) }}
          />
        </Box>
        {trimmedLogoUrl && logoError && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: colors.orange }}>
            Couldn't load an image from that URL. You can still create the community and change it later.
          </Typography>
        )}
      </Field>

      <Field label="Visibility">
        {canCreatePublic ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <VisibilityCard icon="public" title="Public"
              subtitle="Anyone can find and join this community."
              active={!isPrivate} onClick={() => setIsPrivate(false)} />
            <VisibilityCard icon="lock" title="Private"
              subtitle="Hidden from Discover — members join via an invite link."
              active={isPrivate} onClick={() => setIsPrivate(true)} />
          </Box>
        ) : (
          <>
            <VisibilityCard icon="lock" title="Private"
              subtitle="Hidden from Discover — members join via an invite link."
              active />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: colors.muted }}>
              Premium communities are always private. Share an invite link to add members.
            </Typography>
          </>
        )}
      </Field>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button type="submit" variant="contained" disabled={!name.trim() || submitting}
          endIcon={<span className="material-symbols-outlined">arrow_forward</span>}>
          Create Community
        </Button>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
      </Box>

      {error && <Typography sx={{ color: 'crimson', mt: 2 }}>{error}</Typography>}
    </Box>
  )
}

export default CommunityForm
