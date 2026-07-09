import { useState } from 'react'
import { Box, Button, InputBase, Paper, Typography } from '@mui/material'
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
      flex: 1, p: 2, cursor: 'pointer',
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
  const { createCommunity } = useCommunities()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { ok, data } = await createCommunity({ name, description, isPrivate })
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

      <Field label="Visibility">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <VisibilityCard icon="public" title="Public"
            subtitle="Anyone can find and join this community."
            active={!isPrivate} onClick={() => setIsPrivate(false)} />
          <VisibilityCard icon="lock" title="Private"
            subtitle="Only invited members can join."
            active={isPrivate} onClick={() => setIsPrivate(true)} />
        </Box>
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
