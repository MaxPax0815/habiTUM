// FRONTEND/src/pages/app/ManagerDashboard.jsx
// Manager dashboard — the manager-side counterpart to the Progress page.
// Same visual system (pulse gauge, signal cards, selectable card row), but the
// numbers describe the manager's communities instead of personal habits.
// All data comes from one endpoint via useManagerOverview (GET /api/manager/overview).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box, Button, Chip, CircularProgress, Divider,
  IconButton, Paper, Stack, Tooltip, Typography,
} from '@mui/material'

import { useAuthContext } from '../../auth/useAuthContext'
import { useManagerOverview } from '../../hooks/useManagerOverview'
import AppDialog from '../../components/AppDialog'
import PageHeader from '../../components/layout/PageHeader'
import CommunityForm from './CommunityForm'
import { colors } from '../../styles/tokens'
import { sectionTitleSx } from '../../styles/recipes'


// ---------------------------------------------------------------------------
// Shared primitives — same anatomy as their Progress counterparts so the two
// dashboards read as one visual system.
// ---------------------------------------------------------------------------

/** Section heading shown above each dashboard area — uses the app-wide sectionTitleSx. */
const SectionTitle = ({ children }) => (
  <Typography component="h2" sx={sectionTitleSx}>
    {children}
  </Typography>
)

/** Small (i) icon that shows a plain-language explanation when hovered. */
const InfoTooltip = ({ text }) => (
  <Tooltip title={text} placement="top" arrow>
    <IconButton size="small" disableRipple sx={{ p: 0, ml: 0.5, color: 'text.disabled', cursor: 'help' }}>
      <InfoOutlinedIcon sx={{ fontSize: 14 }} />
    </IconButton>
  </Tooltip>
)

/**
 * Summary card for a single portfolio-level metric (mirrors Progress' SignalCard).
 * tone controls the value colour: "good" green, "warning" orange, "bad" red.
 */
const SignalCard = ({ title, value, description, tone = 'neutral', infoText }) => {
  const toneColor =
    tone === 'good'    ? colors.green :
    tone === 'warning' ? colors.orange :
    tone === 'bad'     ? '#e53e3e' :
    colors.primary

  return (
    <Paper sx={{ p: 2.5, flex: 1, minWidth: 160, minHeight: 148 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        {infoText && <InfoTooltip text={infoText} />}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 900, color: toneColor, my: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  )
}


// ---------------------------------------------------------------------------
// Hero Community Pulse — manager counterpart to the Habit Pulse gauge
// ---------------------------------------------------------------------------

/**
 * Circular gauge at the top of the page.
 * Score = % of all members (across the manager's communities) who checked in
 * on a challenge habit during the last 7 days.
 */
const HeroCommunityPulse = ({ pulse }) => {
  const { activeMembers, totalMembers, score } = pulse

  const status =
    score === null ? 'No activity yet' :
    score >= 70 ? 'Thriving' :
    score >= 50 ? 'Healthy' :
    score >= 30 ? 'Building' :
    'Needs attention'

  const scoreColor =
    score === null ? colors.muted :
    score >= 70 ? colors.green :
    score >= 50 ? colors.orange :
    '#e53e3e'

  const insight = totalMembers === 0
    ? 'No members yet. Share your communities to get people on board.'
    : `${activeMembers} of ${totalMembers} members were active in your communities this week.`

  const pulseInfo =
    'Community Pulse (0 to 100) is the share of all your community members ' +
    'who checked in on at least one challenge habit during the last 7 days.'

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: colors.softBlue, borderColor: `${colors.primary}33` }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
        {/* Circular gauge — grey track behind the coloured arc */}
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <CircularProgress
            variant="determinate" value={100} size={120} thickness={5}
            sx={{ color: '#e2e8f0', position: 'absolute' }}
          />
          <CircularProgress
            variant="determinate" value={score ?? 0} size={120} thickness={5}
            sx={{ color: scoreColor }}
          />
          <Box sx={{
            top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {score ?? '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              pulse
            </Typography>
          </Box>
        </Box>

        {/* Status label + insight text */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              This Week's Community Pulse
            </Typography>
            <InfoTooltip text={pulseInfo} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: scoreColor, lineHeight: 1.2, mb: 0.5 }}>
            {status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {insight}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}


// ---------------------------------------------------------------------------
// Community cards row — mirrors the Progress page's HabitHealthRow
// ---------------------------------------------------------------------------

/**
 * Tiny inline line chart of weekly active members (last 7 weeks, oldest left).
 * Pure SVG: the values are scaled into a fixed 100×28 viewBox and drawn as one
 * polyline; preserveAspectRatio="none" stretches it to the card width while
 * vector-effect keeps the stroke width constant.
 */
const TrendSparkline = ({ trend }) => {
  // A line needs at least two points; keep the card layout stable regardless.
  if (trend.length < 2) return <Box sx={{ height: 28, my: 1 }} />

  const max = Math.max(...trend, 1)   // guard: all-zero series still renders flat
  const points = trend
    .map((value, i) => {
      const x = (i / (trend.length - 1)) * 100
      const y = 26 - (value / max) * 24   // 2px padding top and bottom
      return `${x},${y}`
    })
    .join(' ')

  return (
    <Box component="svg"
      viewBox="0 0 100 28" preserveAspectRatio="none"
      sx={{ width: '100%', height: 28, display: 'block', my: 1 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </Box>
  )
}

/**
 * Row of clickable community cards. Each card shows:
 *   - Community name
 *   - Member count + growth this week + active challenge count
 *   - Sparkline of weekly active members (last 7 weeks)
 *   - Weekly engagement bar (green ≥ 70%, orange ≥ 40%, red below)
 * Clicking a card opens the community detail page (/manager/communities/:id).
 */
const CommunityRow = ({ communities, onOpen }) => (
  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
    {communities.map(community => {
      const engagement = community.engagement
      const barColor =
        engagement === null ? colors.muted :
        engagement >= 70 ? colors.green :
        engagement >= 40 ? colors.orange :
        '#e53e3e'

      return (
        <Paper
          key={community._id}
          onClick={() => onOpen(community._id)}
          sx={{
            p: 2, width: 220, height: 190, flexShrink: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            transition: 'all 0.15s',
            '&:hover': { borderColor: colors.primary, bgcolor: colors.softBlue },
          }}
        >
          {/* Community name — clamped to two lines like the habit cards */}
          <Typography variant="caption" sx={{
            fontWeight: 700, lineHeight: 1.3, mb: 1, minHeight: 34,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {community.name}
          </Typography>

          {/* Member count with the unit on the same line (baseline-aligned) */}
          <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primary, lineHeight: 1 }}>
              {community.members}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              member{community.members === 1 ? '' : 's'}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {community.newThisWeek > 0 && (
              <Box component="span" sx={{ color: colors.green, fontWeight: 700 }}>
                ▲ {community.newThisWeek} this week{' · '}
              </Box>
            )}
            {community.activeChallenges} active challenge{community.activeChallenges === 1 ? '' : 's'}
          </Typography>

          {/* Weekly active members over the last 7 weeks */}
          <TrendSparkline trend={community.trend || []} />

          {/* Weekly engagement bar */}
          <Box sx={{ mt: 'auto', bgcolor: colors.progressTrack, borderRadius: 2, overflow: 'hidden', height: 6, flexShrink: 0 }}>
            <Box sx={{
              height: '100%', width: `${engagement ?? 0}%`,
              bgcolor: barColor, borderRadius: 2, transition: 'width 0.6s ease',
            }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ typography: 'micro' }}>
            {engagement === null ? 'no members yet' : `${engagement}% weekly engagement`}
          </Typography>
        </Paper>
      )
    })}
  </Box>
)


// ---------------------------------------------------------------------------
// Header — same Premium chip treatment as the Progress page
// ---------------------------------------------------------------------------

const ManagerHeader = ({ firstName }) => (
  <PageHeader
    title="Manager Dashboard"
    titleAdornment={(
      <Chip
        icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
        label="Premium"
        size="small"
        sx={{ bgcolor: colors.softBlue, color: colors.primary }}
      />
    )}
    description={`Welcome back, ${firstName || 'manager'}. Here's how your communities are doing.`}
  />
)


// ---------------------------------------------------------------------------
// Main Manager Dashboard page
// ---------------------------------------------------------------------------

/**
 * Manager dashboard — fetches the overview on mount, then renders:
 *
 *   1. Community Pulse gauge — weekly active share across all communities
 *   2. Signal cards          — Reach, Challenge adoption, Momentum, Completion rate
 *   3. Community selector    — one card per community (drill-down comes next)
 */
const ManagerDashboard = () => {
  const { user } = useAuthContext()
  const { overview, loading, error, fetchOverview } = useManagerOverview()
  const navigate = useNavigate()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false) // create-community popup

  // Load the overview once on mount — same pattern as Communities.jsx.
  useEffect(() => { fetchOverview() }, [fetchOverview])

  // ---- Loading / error states (route already guarantees a manager account) ----
  if (loading) return (
    <Box>
      <ManagerHeader firstName={user?.firstName} />
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <CircularProgress size={28} />
      </Box>
    </Box>
  )

  if (error || !overview) return (
    <Box>
      <ManagerHeader firstName={user?.firstName} />
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Couldn't load your overview{error ? ` — ${error}` : ''}. Please try again.
        </Typography>
      </Paper>
    </Box>
  )

  const { pulse, kpis, communities } = overview

  // ---- Empty state: manager without communities yet ----
  if (communities.length === 0) return (
    <Box>
      <ManagerHeader firstName={user?.firstName} />
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          No communities yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
          Create your first community and set up challenges to see engagement
          analytics for your members here.
        </Typography>
        <Button variant="contained" onClick={() => setIsCreateDialogOpen(true)}>
          Create a community
        </Button>
      </Paper>

      {/* Create-community popup — same dialog/blur behaviour as the other forms.
          On success, open the new community's manager detail page. */}
      <AppDialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)}>
        <CommunityForm
          onCreated={(community) => navigate(`/manager/communities/${community._id}`)}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      </AppDialog>
    </Box>
  )

  // Percentages that can be null (no data yet) render as "—" with a neutral tone.
  const momentumValue = kpis.momentum === null
    ? '—'
    : `${kpis.momentum > 0 ? '+' : ''}${kpis.momentum}%`

  return (
    <Box>
      <ManagerHeader firstName={user?.firstName} />

      {/* 1. Community Pulse — weekly active members across all communities */}
      <HeroCommunityPulse pulse={pulse} />

      {/* 2. Signal cards — portfolio summary across all communities */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <SignalCard
          title="Reach"
          value={kpis.reach}
          description={(
            <>
              Members across your {communities.length} communit{communities.length === 1 ? 'y' : 'ies'}.{' '}
              <Box component="span" sx={{ color: colors.green, fontWeight: 700 }}>
                +{kpis.reachDeltaMonth}
              </Box>
              {' '}this month.
            </>
          )}
          infoText="Total members across all communities you created. The delta counts members who joined since the 1st of this month."
        />
        <SignalCard
          title="Challenge adoption"
          value={kpis.adoption === null ? '—' : `${kpis.adoption}%`}
          description="Average share of community members who join your active challenges."
          tone={kpis.adoption === null ? 'neutral' : kpis.adoption >= 60 ? 'good' : kpis.adoption >= 30 ? 'warning' : 'bad'}
          infoText="For each community: participants in currently active challenges ÷ members, averaged across your communities."
        />
        <SignalCard
          title="Momentum"
          value={momentumValue}
          description="Week-over-week change in check-ins across all your challenges."
          tone={kpis.momentum === null ? 'neutral' : kpis.momentum > 5 ? 'good' : kpis.momentum < -5 ? 'bad' : 'warning'}
          infoText="This week's total challenge check-ins vs last week's. Positive means your communities are getting more active."
        />
        <SignalCard
          title="Completion rate"
          value={kpis.completionRate === null ? '—' : `${kpis.completionRate}%`}
          description="Participants who finished, across your finalized challenges."
          tone={kpis.completionRate === null ? 'neutral' : kpis.completionRate >= 70 ? 'good' : kpis.completionRate >= 40 ? 'warning' : 'bad'}
          infoText="Completed participations ÷ all participations, counted over challenges with status 'finalized'. Shows — until a challenge finishes."
        />
      </Stack>

      <Divider sx={{ mb: 4 }} />

      {/* 3. Community cards — click one to open its detail page */}
      <Box sx={{ mb: 3 }}>
        <SectionTitle>Your Communities</SectionTitle>
        <CommunityRow
          communities={communities}
          onOpen={(id) => navigate(`/manager/communities/${id}`)}
        />
      </Box>
    </Box>
  )
}

export default ManagerDashboard
