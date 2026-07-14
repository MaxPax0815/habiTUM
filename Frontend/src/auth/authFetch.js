// Fetch wrapper for authenticated API calls: pass { token } to set the
// Authorization header; any 401 (expired/invalid session) triggers a global logout.

let onUnauthorized = null

// Registered once by AuthContextProvider; dispatches LOGOUT on session expiry.
export const registerUnauthorizedHandler = (handler) => {
    onUnauthorized = handler
}

// Drop-in fetch replacement; returns the raw Response for the caller's own handling.
export const authFetch = async (url, options = {}) => {
    const { token, headers, ...rest } = options

    const response = await fetch(url, {
        ...rest,
        headers: {
            ...(headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    })

    // Only requireAuth produces 401; permission denials use 403 and must not log out.
    if (response.status === 401) {
        onUnauthorized?.()
    }

    return response
}
