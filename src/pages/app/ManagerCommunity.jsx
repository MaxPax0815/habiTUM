// FRONTEND/src/pages/app/ManagerCommunity.jsx
// Manager community detail — opened by clicking a community card on the
// Manager Dashboard. Shows the summary tile row (like the mockup's
// "SUMMARY · <community>") plus one KPI row per challenge.
// Data comes from GET /api/manager/communities/:id/stats via useManagerCommunityStats.

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import format from 'date-fns/format'

import AddIcon from '@mui/icons-material/Add'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box, Button, Chip, CircularProgress, IconButton, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'

import {
  CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'

import BackButton from '../../components/BackButton'
import AppCard from '../../components/AppCard'
import PageHeader from '../../components/layout/PageHeader'
import AppDialog from '../../components/AppDialog'
import ChallengeForm from '../../challenges/ChallengeForm'
import { useManagerCommunityStats } from '../../hooks/useManagerCommunityStats'
import { useManagerChallengeAdherence } from '../../hooks/useManagerChallengeAdherence'
import { colors } from '../../styles/tokens'
import { sectionTitleSx } from '../../styles/recipes'


// ---------------------------------------------------------------------------
// Shared primitives — same anatomy as the Progress page / Manager Dashboard.
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

/** Summary tile: caption label, fat colored value, small description. */
const StatCard = ({ title, value, description, tone = 'neutral', infoText }) => {
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

/** Maps a percentage to the tone used across the app (green ≥ 70, orange ≥ 40, red below). */
const rateTone = (rate) =>
  rate === null ? 'neutral' : rate >= 70 ? 'good' : rate >= 40 ? 'warning' : 'bad'


// ---------------------------------------------------------------------------
// Challenges table
// ---------------------------------------------------------------------------

/** Coloured status chip per challenge lifecycle state. */
const STATUS_CHIP_STYLES = {
  active:    { bgcolor: colors.softGreen,   color: colors.green },
  draft:     { bgcolor: colors.softNeutral, color: colors.textSecondary },
  finalized: { bgcolor: colors.softBlue,    color: colors.primary },
  cancelled: { bgcolor: '#fff3f3',          color: '#e53e3e' },
}

const StatusChip = ({ status }) => (
  <Chip
    label={status.charAt(0).toUpperCase() + status.slice(1)}
    size="small"
    sx={{ fontWeight: 700, ...(STATUS_CHIP_STYLES[status] || STATUS_CHIP_STYLES.draft) }}
  />
)

/**
 * Percentage table cell. Colour encodes health; "—" (muted) means the value
 * isn't measurable yet (draft challenge, no participants, not finalized...).
 * invert=true flips the scale for metrics where LOW is good (drop-out).
 */
const RateCell = ({ rate, invert = false }) => {
  if (rate === null) {
    return <TableCell sx={{ color: colors.muted }}>—</TableCell>
  }
  const effective = invert ? 100 - rate : rate
  const color = effective >= 70 ? colors.green : effective >= 40 ? colors.orange : '#e53e3e'
  return (
    <TableCell sx={{ color, fontWeight: 700 }}>{rate}%</TableCell>
  )
}

/**
 * One KPI row per challenge: status, participants, adoption, drop-out,
 * completion. Newest challenge first (sorted by the backend).
 * Clicking a row selects the challenge for the adherence chart below.
 */
const ChallengesTable = ({ challenges, members, selectedId, onSelect }) => (
  <Paper sx={{ p: 3, mb: 3 }}>
    <SectionTitle>All Challenges</SectionTitle>

    {challenges.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        No challenges yet. Create one for this community to see participation analytics here.
      </Typography>
    ) : (
      // The table gets its own horizontal scroll container so narrow screens
      // never make the whole page scroll sideways.
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Challenge</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Adoption</TableCell>
              <TableCell>Drop-out</TableCell>
              <TableCell>Completion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challenges.map(ch => (
              <TableRow
                key={ch._id}
                onClick={() => onSelect(ch._id)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: ch._id === selectedId ? colors.softBlue : 'transparent',
                  '&:hover': { bgcolor: colors.softBlue },
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {ch.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(ch.starts), 'MMM d')} – {format(new Date(ch.ends), 'MMM d')} · {ch.difficulty}
                  </Typography>
                </TableCell>
                <TableCell><StatusChip status={ch.status} /></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {ch.status === 'draft' ? '—' : `${ch.joined} / ${members}`}
                </TableCell>
                <RateCell rate={ch.adoption} />
                <RateCell rate={ch.dropout} invert />
                <RateCell rate={ch.completion} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    )}
  </Paper>
)


// ---------------------------------------------------------------------------
// Daily check-in adherence chart (for the challenge selected in the table)
// ---------------------------------------------------------------------------

/**
 * Line chart of the selected challenge's daily adherence: for each elapsed
 * challenge day, the % of joined participants who checked in that day.
 * Mirrors the WeeklyLineChart on the Progress page (same recharts pieces).
 */
const AdherenceChart = ({ adherence, loading, error }) => {
  if (loading) return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
      <CircularProgress size={24} />
    </Box>
  )

  if (error) return (
    <Typography variant="body2" color="text.secondary">
      Couldn't load the adherence data — {error}
    </Typography>
  )

  if (!adherence || adherence.adherence.length === 0) return (
    <Typography variant="body2" color="text.secondary">
      No check-in data yet — this challenge hasn't started (or is still a draft).
    </Typography>
  )

  const { challenge, adherence: data } = adherence
  const stillRunning = challenge.status === 'active' && data.length < challenge.totalDays

  return (
    <Box>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 20, bottom: 4, left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />

          {/* X-axis: challenge day number (1 = start date) */}
          <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={d => `day ${d}`} />

          {/* Y-axis: share of participants who checked in, fixed 0–100% */}
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            unit="%"
            label={{
              value: 'Checked in %',
              angle: -90,
              position: 'insideLeft',
              offset: -8,
              fontSize: 11,
              fill: '#94a3b8',
            }}
          />

          <RTooltip
            labelFormatter={d => `Day ${d}`}
            formatter={v => [v === null ? '—' : `${v}%`, 'Checked in']}
          />

          <Line type="monotone" dataKey="rate"
            stroke={colors.primary} strokeWidth={2.5}
            dot={{ r: 3, fill: colors.primary }} activeDot={{ r: 6 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>

      {stillRunning && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Shown through today (day {data.length} of {challenge.totalDays}). Future days are hidden.
        </Typography>
      )}
    </Box>
  )
}


// ---------------------------------------------------------------------------
// Main community detail page
// ---------------------------------------------------------------------------

const ManagerCommunity = () => {
  const { id } = useParams()
  const { stats, loading, error, fetchStats } = useManagerCommunityStats(id)

  const [selectedChallengeId, setSelectedChallengeId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  // The chart's challenge: the clicked row, or (before any click) the first
  // challenge that can have data — i.e. the newest non-draft one.
  const effectiveChallengeId = selectedChallengeId
    || stats?.challenges.find(ch => ch.status !== 'draft')?._id
    || null

  const {
    adherence, loading: adherenceLoading, error: adherenceError, fetchAdherence,
  } = useManagerChallengeAdherence(effectiveChallengeId)

  // Load once on mount (and again if the id in the URL changes).
  useEffect(() => { fetchStats() }, [fetchStats])

  // (Re)load the chart whenever another challenge is selected.
  useEffect(() => { fetchAdherence() }, [fetchAdherence])

  if (loading) return (
    <Box>
      <BackButton text="Back to Manager Dashboard" to="/manager" sx={{ mb: 0 }} />
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <CircularProgress size={28} />
      </Box>
    </Box>
  )

  if (error || !stats) return (
    <Box>
      <BackButton text="Back to Manager Dashboard" to="/manager" sx={{ mb: 0 }} />
      <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
        <Typography color="text.secondary">
          Couldn't load this community{error ? ` — ${error}` : ''}. Please try again.
        </Typography>
      </Paper>
    </Box>
  )

  const { community, summary, challenges } = stats
  const selectedChallenge = challenges.find(ch => ch._id === effectiveChallengeId)

  // Ignore a series that still belongs to the previously selected challenge —
  // it would briefly render under the new challenge's title while refetching.
  const adherenceForSelected =
    adherence && adherence.challenge._id === effectiveChallengeId ? adherence : null

  return (
    <Box>
      <BackButton text="Back to Manager Dashboard" to="/manager" sx={{ mb: 0 }} />
      <AppCard sx={{ mb: 4 }}>
        <PageHeader
          eyebrow="Community"
          title={community.name}
          description={community.description}
          actions={(
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
              New Challenge
            </Button>
          )}
          sx={{ mb: 0 }}
        />
      </AppCard>

      {/* Summary tile row — mirrors the mockup's "SUMMARY · <community>" */}
      <Box sx={{ mb: 4 }}>
        <SectionTitle>Summary · {community.name}</SectionTitle>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <StatCard
            title="Members"
            value={summary.members}
            description={(
              <>
                <Box component="span" sx={{ color: colors.green, fontWeight: 700 }}>
                  +{summary.newThisMonth}
                </Box>
                {' '}joined this month.
              </>
            )}
          />
          <StatCard
            title="Weekly active"
            value={summary.weeklyActive === null ? '—' : `${summary.weeklyActive}%`}
            description="Members with ≥ 1 check-in in the last 7 days."
            tone={rateTone(summary.weeklyActive)}
            infoText="Distinct members who checked in on any of this community's challenge habits during the last 7 days, divided by all members."
          />
          <StatCard
            title="Challenge adoption"
            value={summary.adoption === null ? '—' : `${summary.adoption}%`}
            description="Members participating in a currently active challenge."
            tone={rateTone(summary.adoption)}
            infoText="Distinct members who joined (and haven't left) an active challenge, divided by all members. Shows — while no challenge is active."
          />
          <StatCard
            title="Retention"
            value={summary.retention === null ? '—' : `${summary.retention}%`}
            description="Participants who stayed in the challenges they joined."
            tone={rateTone(summary.retention)}
            infoText="Across every challenge of this community: participations that did not end in leaving, divided by all participations."
          />
          <StatCard
            title="Check-ins this week"
            value={summary.checkinsThisWeek}
            description={
              summary.checkinsDelta === null ? 'Across all challenge habits.' : (
                <>
                  <Box component="span" sx={{
                    color: summary.checkinsDelta >= 0 ? colors.green : '#e53e3e',
                    fontWeight: 700,
                  }}>
                    {summary.checkinsDelta >= 0 ? '▲' : '▼'} {Math.abs(summary.checkinsDelta)}%
                  </Box>
                  {' '}vs last week, across all challenge habits.
                </>
              )
            }
          />
        </Stack>
      </Box>

      {/* Challenges table — one KPI row per challenge; click a row to chart it */}
      <ChallengesTable
        challenges={challenges}
        members={summary.members}
        selectedId={effectiveChallengeId}
        onSelect={setSelectedChallengeId}
      />

      {/* Daily adherence chart for the selected challenge. Hidden while no
          challenge is selectable (e.g. only drafts exist and none was clicked). */}
      {effectiveChallengeId && (
        <Paper sx={{ p: 3 }}>
          <SectionTitle>
            Daily check-in adherence{selectedChallenge ? ` · ${selectedChallenge.title}` : ''}
          </SectionTitle>
          <AdherenceChart
            adherence={adherenceForSelected}
            loading={adherenceLoading || (!adherenceForSelected && !adherenceError)}
            error={adherenceError}
          />
        </Paper>
      )}

      {/* New challenge dialog — reuses the existing ChallengeForm, which POSTs
          to /api/challenges. On success we refetch so the new draft appears. */}
      <AppDialog open={formOpen} onClose={() => setFormOpen(false)}>
        <ChallengeForm
          communityId={id}
          onChallengeCreated={fetchStats}
          onClose={() => setFormOpen(false)}
        />
      </AppDialog>
    </Box>
  )
}

export default ManagerCommunity
