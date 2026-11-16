import { Component } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from './auth'

export default function AuthPage({ mode }) {
  const { authenticate } = useAuth()
  const { state } = useLocation()
  return <AuthForm mode={mode} authenticate={authenticate} returnLocation={state} />
}

class AuthForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      farmName: '',
      email: '',
      password: '',
      pending: false,
      error: '',
    }
  }

  componentWillUnmount() {
    this.submitRequest?.abort()
  }

  handleChange = (event) => {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  handleSubmit = async (event) => {
    event.preventDefault()
    if (this.state.pending) return

    const { mode, authenticate } = this.props
    const { email, password, farmName } = this.state
    const credentials = {
      email: email.trim().toLowerCase(),
      password,
    }

    if (mode === 'register') {
      credentials.farmName = farmName.trim()
      if (!credentials.farmName) {
        this.setState({ error: 'Enter your farm name.' })
        return
      }
    }

    const controller = new AbortController()
    this.submitRequest = controller
    this.setState({ error: '', pending: true })
    try {
      await authenticate(mode, credentials, controller.signal)
    } catch (requestError) {
      if (!controller.signal.aborted) {
        this.setState({ error: requestError.message, pending: false })
      }
    }
  }

  render() {
    const { mode, returnLocation } = this.props
    const { farmName, email, password, pending, error } = this.state
    const registering = mode === 'register'
    const submitLabel = registering ? 'Create account' : 'Sign in'
    const pendingLabel = registering ? 'Creating account…' : 'Signing in…'

    return (
      <main className="container auth-main px-0">
        <section className="card auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title">{registering ? 'Create your account' : 'Sign in'}</h1>
          <p className="intro">
            {registering ? 'Set up HerdTrack for your farm.' : 'Sign in to manage your herd.'}
          </p>

          <form onSubmit={this.handleSubmit}>
            <fieldset className="d-grid gap-3 mt-4" disabled={pending}>
              {registering && (
                <div className="field">
                  <label className="form-label mb-0" htmlFor="farmName">Farm name</label>
                  <input
                    className="form-control"
                    id="farmName"
                    name="farmName"
                    value={farmName}
                    onChange={this.handleChange}
                    autoComplete="organization"
                    required
                  />
                </div>
              )}
              <div className="field">
                <label className="form-label mb-0" htmlFor="email">Email address</label>
                <input
                  className="form-control"
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={this.handleChange}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="field">
                <label className="form-label mb-0" htmlFor="password">Password</label>
                <input
                  className="form-control"
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={this.handleChange}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  minLength={registering ? 8 : undefined}
                  aria-describedby={registering ? 'password-hint' : undefined}
                  required
                />
                {registering && (
                  <small className="form-text mt-0" id="password-hint">Use at least 8 characters.</small>
                )}
              </div>

              {error && <p className="alert alert-danger mb-0" role="alert">{error}</p>}
              <button type="submit" className="btn primary-button">
                {pending ? pendingLabel : submitLabel}
              </button>
            </fieldset>
          </form>

          <p className="auth-switch">
            {registering ? 'Already have an account?' : 'New to HerdTrack?'}{' '}
            <Link to={registering ? '/login' : '/register'} state={returnLocation}>
              {registering ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </section>
      </main>
    )
  }
}
