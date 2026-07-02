import { Box, Typography, Paper } from '@mui/material'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import { useAuthContext } from '../../auth/useAuthContext' // reads user from AuthContext to personalize the greeting
import { colors } from '../../styles/tokens'
import PageHeader from '../../components/layout/PageHeader'

// preview cards for features not yet implemented; replace with real components when ready
const placeholderCards = [
  {
    icon: <GroupsOutlinedIcon sx={{ fontSize: 32, color: colors.primary }} />,
    title: 'Habit Communities',
    description: 'Create and manage communities for users to join and track habits together.',
    bg: colors.softBlue,
  },
  {
    icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 32, color: colors.orange }} />,
    title: 'Challenges',
    description: 'Set up habit challenges with goals and deadlines for your communities.',
    bg: colors.softOrange,
  },
]

const ManagerDashboard = () => {
  const { user } = useAuthContext()

  return (
    <Box>
      <PageHeader
        title="Manager Dashboard"
        description={`Welcome back, ${user?.firstName || 'manager'}. Here's your manager overview.`}
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {placeholderCards.map((card) => (
          <Paper
            key={card.title}
            elevation={0}
            sx={{
              flex: '1 1 240px',
              p: 3,
              borderRadius: 3,
              border: `1px solid ${colors.border}`,
              backgroundColor: card.bg,
              opacity: 0.7,
            }}
          >
            <Box sx={{ mb: 1.5 }}>{card.icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: colors.textPrimary, mb: 0.5 }}>
              {card.title}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              {card.description}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 2, color: colors.muted, fontStyle: 'italic' }}
            >
              Coming soon
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

export default ManagerDashboard
