// LEGACY SSE bus: in-process pub/sub from activityService to open streamFeed clients.
// Single-process only; horizontal scaling would replace this with Redis/pub-sub.
const { EventEmitter } = require('events')

const bus = new EventEmitter()
// 0 removes Node's default 10-listener warning; each SSE viewer is one listener.
bus.setMaxListeners(0)

const publish = (event) => {
    bus.emit('activity', event)
}

// Returns unsubscribe so streamFeed can remove its listener on connection close.
const subscribe = (listener) => {
    bus.on('activity', listener)
    return () => bus.off('activity', listener)
}

const listenerCount = () => bus.listenerCount('activity')

module.exports = { publish, subscribe, listenerCount }
