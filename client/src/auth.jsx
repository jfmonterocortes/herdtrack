import { Component, createContext, useContext } from 'react'
import { apiRequest } from './api'

const AuthContext = createContext(null)
const tokenKey = 'herdtrack.token'

export function useAuth() {
  return useContext(AuthContext)
}

export class AuthProvider extends Component {
  constructor(props) {
    super(props)
    this.state = {
      checking: Boolean(sessionStorage.getItem(tokenKey)),
      profileError: '',
      user: null,
    }
  }

  componentDidMount() {
    this.loadProfile()
  }

  componentWillUnmount() {
    this.profileRequest?.abort()
  }

  loadProfile = async () => {
    const token = sessionStorage.getItem(tokenKey)
    if (!token) return

    this.profileRequest?.abort()
    const controller = new AbortController()
    this.profileRequest = controller
    this.setState({ checking: true, profileError: '', user: null })

    try {
      const user = await apiRequest('/auth/me', { token, signal: controller.signal })
      if (!controller.signal.aborted) {
        this.setState({ checking: false, user })
      }
    } catch (error) {
      if (controller.signal.aborted) return
      if (error.status === 401) {
        this.logout()
      } else {
        this.setState({ checking: false, profileError: error.message })
      }
    }
  }

  authenticate = async (action, body, signal) => {
    const result = await apiRequest(`/auth/${action}`, { method: 'POST', body, signal })
    if (signal?.aborted) return
    if (typeof result.token !== 'string' || !result.token) {
      throw new Error('HerdTrack did not receive a sign-in token. Please try again.')
    }
    sessionStorage.setItem(tokenKey, result.token)
    this.loadProfile()
  }

  request = async (path, options) => {
    const requestToken = sessionStorage.getItem(tokenKey)
    if (!requestToken) throw new Error('Sign in to continue.')

    try {
      return await apiRequest(path, { ...options, token: requestToken })
    } catch (error) {
      if (error.status === 401 && sessionStorage.getItem(tokenKey) === requestToken) {
        this.logout()
      }
      throw error
    }
  }

  logout = () => {
    this.profileRequest?.abort()
    sessionStorage.removeItem(tokenKey)
    this.setState({ checking: false, profileError: '', user: null })
  }

  render() {
    const auth = {
      ...this.state,
      authenticate: this.authenticate,
      request: this.request,
      retryProfile: this.loadProfile,
      logout: this.logout,
    }

    return <AuthContext.Provider value={auth}>{this.props.children}</AuthContext.Provider>
  }
}
