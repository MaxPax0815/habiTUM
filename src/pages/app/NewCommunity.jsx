import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, InputBase, Paper, Typography } from '@mui/material'
import { useCommunities } from '../../hooks/useCommunites'
import { colors } from '../../styles/tokens'
import PageContainer from '../../components/layout/PageContainer'
import PageHeader from '../../components/layout/PageHeader'

// One selectable visibility card (Public / Private). Highlights when active.
const VisibilityCard = ({ icon, title, subtitle, active, onClick }) => (
  <Paper
    variant="outlined"
    onClick={onClick}
    sx={{
      flex: 1, p: 2, borderRadius: 3, cursor: 'pointer',
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
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{label}</Typography>
    {children}
  </Box>
)

const inputSx = {
  border: `1px solid ${colors.border}`, borderRadius: 2, px: 2, py: 1.25, width: '100%',
}

const NewCommunity = () => {
  const { createCommunity } = useCommunities()
  const navigate = useNavigate()

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
    if (ok) navigate(`/communities/${data._id}`)
    else setError(data.error)
  }

  return (
    <PageContainer maxWidth={640} sx={{ textAlign: 'left' }}>
      <Button
        onClick={() => navigate('/communities')}
        sx={{ color: 'text.secondary', mb: 1, px: 0 }}
        startIcon={<span className="material-symbols-outlined">arrow_back</span>}
      >
        Back to Communities
      </Button>

      <PageHeader
        title="New Community"
        description="Start your own accountability community."
        sx={{ mb: 3 }}
      />

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }} component="form" onSubmit={handleSubmit}>
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
          <Button variant="outlined" onClick={() => navigate('/communities')}>Cancel</Button>
        </Box>

        {error && <Typography sx={{ color: 'crimson', mt: 2 }}>{error}</Typography>}
      </Paper>
    </PageContainer>
  )
}

export default NewCommunity
