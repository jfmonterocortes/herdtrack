import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from './auth'

export default function AuthPage({ mode }) {
  const registering = mode === 'register'
  const submitLabel = registering ? 'Create account' : 'Sign in'
  const pendingLabel = registering ? 'Creating account…' : 'Signing in…'
  const { authenticate } = useAuth()
  const { state } = useLocation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return

    const fields = new FormData(event.currentTarget)
    const credentials = {
      email: fields.get('email').trim().toLowerCase(),
      password: fields.get('password'),
    }

    if (registering) {
      credentials.farmName = fields.get('farmName').trim()
      if (!credentials.farmName) {
        setError('Enter your farm name.')
        return
      }
    }

    setError('')
    setPending(true)
    try {
      await authenticate(mode, credentials)
    } catch (requestError) {
      setError(requestError.message)
      setPending(false)
    }
  }

  return (
    <main className="auth-main">
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">{registering ? 'Create your account' : 'Sign in'}</h1>
        <p className="intro">
          {registering ? 'Set up HerdTrack for your farm.' : 'Sign in to manage your herd.'}
        </p>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={pending}>
            {registering && (
              <div className="field">
                <label htmlFor="farmName">Farm name</label>
                <input id="farmName" name="farmName" autoComplete="organization" required />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={registering ? 'new-password' : 'current-password'}
                minLength={registering ? 8 : undefined}
                aria-describedby={registering ? 'password-hint' : undefined}
                required
              />
              {registering && <small id="password-hint">Use at least 8 characters.</small>}
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="primary-button">
              {pending ? pendingLabel : submitLabel}
            </button>
          </fieldset>
        </form>

        <p className="auth-switch">
          {registering ? 'Already have an account?' : 'New to HerdTrack?'}{' '}
          <Link to={registering ? '/login' : '/register'} state={state}>
            {registering ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  )
}
