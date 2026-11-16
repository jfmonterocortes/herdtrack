import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { apiRequest } from './api'

const AuthContext = createContext(null)
const tokenKey = 'herdtrack.token'

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey))
  const [profile, setProfile] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const currentToken = useRef(token)

  function updateToken(nextToken) {
    if (nextToken) {
      sessionStorage.setItem(tokenKey, nextToken)
    } else {
      sessionStorage.removeItem(tokenKey)
    }
    currentToken.current = nextToken
    setProfile(null)
    setToken(nextToken)
  }

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    async function loadProfile() {
      try {
        const user = await apiRequest('/auth/me', { token, signal: controller.signal })
        if (!controller.signal.aborted && currentToken.current === token) {
          setProfile({ user })
        }
      } catch (error) {
        if (controller.signal.aborted || currentToken.current !== token) return
        if (error.status === 401) {
          updateToken(null)
        } else {
          setProfile({ error: error.message })
        }
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [token, attempt])

  async function authenticate(action, body) {
    const result = await apiRequest(`/auth/${action}`, { method: 'POST', body })
    if (typeof result.token !== 'string' || !result.token) {
      throw new Error('HerdTrack did not receive a sign-in token. Please try again.')
    }
    updateToken(result.token)
  }

  async function request(path, options) {
    const requestToken = currentToken.current
    if (!requestToken) throw new Error('Sign in to continue.')

    try {
      return await apiRequest(path, { ...options, token: requestToken })
    } catch (error) {
      if (error.status === 401 && currentToken.current === requestToken) {
        updateToken(null)
      }
      throw error
    }
  }

  function retryProfile() {
    setProfile(null)
    setAttempt((previous) => previous + 1)
  }

  const auth = {
    checking: Boolean(token && !profile),
    profileError: profile?.error,
    user: profile?.user,
    authenticate,
    request,
    retryProfile,
    logout: () => updateToken(null),
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
