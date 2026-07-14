// LEGACY SSE tickets: EventSource cannot send Bearer headers, so use short single-use tokens.
const crypto = require('crypto')

const TICKET_TTL_MS = 30 * 1000

const tickets = new Map()

// 32 random bytes = 256-bit ticket; stored only in memory for 30 seconds.
const createTicket = (userId) => {
    const ticket = crypto.randomBytes(32).toString('hex')
    tickets.set(ticket, {
        userId: userId.toString(),
        expiresAt: Date.now() + TICKET_TTL_MS
    })
    return ticket
}

// Single use: delete before expiry check so a replayed/expired ticket cannot be reused.
const consumeTicket = (ticket) => {
    const entry = tickets.get(ticket)
    if (!entry) return null

    tickets.delete(ticket)
    if (entry.expiresAt < Date.now()) return null

    return entry.userId
}

// Sweep unused expired tickets; unref lets tests/shutdown exit despite the timer.
const sweep = setInterval(() => {
    const now = Date.now()
    for (const [ticket, entry] of tickets) {
        if (entry.expiresAt < now) tickets.delete(ticket)
    }
}, 60 * 1000)
sweep.unref()

module.exports = { createTicket, consumeTicket, TICKET_TTL_MS }
