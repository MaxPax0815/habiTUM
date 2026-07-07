// Pure formatter: turns an Activity document into renderable text segments.
// Everything comes from activity.meta — the snapshot taken at write time —
// so this never needs to fetch users or habits.
//
// Returned shape: [{ text, bold?, italic? }, ...] so the component can render
// the actor bold and the habit title italic without dangerouslySetInnerHTML.

const streakUnit = (frequency) => (frequency === 'weekly' ? 'week' : 'day')

export const formatActivityMessage = (activity) => {
  const { actorName = 'Someone', habitTitle = 'a habit', streak = 0, frequency } = activity.meta || {}
  const unit = streakUnit(frequency)

  // Legacy only: separate milestone items are no longer created (the checkin
  // message itself turns celebratory instead), but documents from older
  // seeds/databases may still carry this type — keep rendering them.
  if (activity.type === 'streak_milestone') {
    return [
      { text: '🔥 ' },
      { text: actorName, bold: true },
      { text: ` hit a ${streak} ${unit} streak on ` },
      { text: habitTitle, italic: true },
    ]
  }

  // Milestone-as-message-variant: every 7th streak step gets a fire prefix
  // instead of being an extra feed item — one post per checkin, always.
  const isMilestone = streak > 0 && streak % 7 === 0

  const segments = [
    ...(isMilestone ? [{ text: '🔥 ' }] : []),
    { text: actorName, bold: true },
    { text: ' just checked into ' },
    { text: habitTitle, italic: true },
  ]

  // "for 1 day in a row" reads like a bug, so the suffix starts at streak 2.
  if (streak > 1) {
    segments.push({ text: ` for ${streak} ${unit}s in a row`, bold: isMilestone })
  }

  return segments
}
