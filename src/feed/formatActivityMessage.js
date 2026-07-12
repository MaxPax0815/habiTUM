// Pure meta formatter: returns styled text segments without fetching or raw HTML.

const streakUnit = (frequency) => (frequency === 'weekly' ? 'week' : 'day')

export const formatActivityMessage = (activity) => {
  const { actorName = 'Someone', habitTitle = 'a habit', streak = 0, frequency } = activity.meta || {}
  const unit = streakUnit(frequency)

  // Legacy milestone docs still render, though new milestones are checkin variants.
  if (activity.type === 'streak_milestone') {
    return [
      { text: '🔥 ' },
      { text: actorName, bold: true },
      { text: ` hit a ${streak} ${unit} streak on ` },
      { text: habitTitle, italic: true },
    ]
  }

  // Every 7th streak step gets a celebratory variant, not a second feed post.
  const isMilestone = streak > 0 && streak % 7 === 0

  const segments = [
    ...(isMilestone ? [{ text: '🔥 ' }] : []),
    { text: actorName, bold: true },
    { text: ' just checked into ' },
    { text: habitTitle, italic: true },
  ]

  // Hide "1 day in a row"; the suffix starts once streak > 1.
  if (streak > 1) {
    segments.push({ text: ` for ${streak} ${unit}s in a row`, bold: isMilestone })
  }

  return segments
}
