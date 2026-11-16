import { startTransition } from 'react'
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router'
import AuthPage from './AuthPage'
import { useAuth } from './auth'

function SignOutButton({ className }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    startTransition(() => {
      logout()
      navigate('/login', { replace: true })
    })
  }

  return (
    <button className={className} type="button" onClick={handleSignOut}>
      Sign out
    </button>
  )
}

function Header({ signedIn = false }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to={signedIn ? '/dashboard' : '/login'} className="brand">
          HerdTrack
        </Link>
        {signedIn && (
          <>
            <nav className="main-nav" aria-label="Main navigation">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/herd">Herd</NavLink>
              <NavLink to="/health">Health</NavLink>
            </nav>
            <SignOutButton className="sign-out" />
          </>
        )}
      </div>
    </header>
  )
}

function SignedInLayout() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header signedIn />
      <main id="main-content" className="page-main">
        <Outlet />
      </main>
    </>
  )
}

function GuestLayout() {
  const { user } = useAuth()
  const { state } = useLocation()
  const from = state?.from

  if (user) {
    return <Navigate to={from || '/dashboard'} replace />
  }

  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

function Dashboard() {
  const { user } = useAuth()

  return (
    <>
      <h1>{user.farmName || 'Farm dashboard'}</h1>
      <p className="intro">{user.email}</p>
      <div className="dashboard-links">
        <Link className="dashboard-link" to="/herd">
          <h2>Herd</h2>
          <span>Browse animal records</span>
        </Link>
        <Link className="dashboard-link" to="/health">
          <h2>Health</h2>
          <span>View herd health events</span>
        </Link>
      </div>
    </>
  )
}

function AnimalDetail() {
  const { animalId } = useParams()

  return (
    <>
      <Link className="back-link" to="/herd">Back to herd</Link>
      <h1>Animal details</h1>
      <p className="intro">Animal ID {animalId}</p>
      <p className="empty-state">Animal records are coming soon.</p>
    </>
  )
}

function PlaceholderPage({ title, message }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="empty-state">{message}</p>
    </>
  )
}

export default function App() {
  const { checking, profileError, retryProfile } = useAuth()

  if (checking || profileError) {
    return (
      <>
        <Header />
        <main className="auth-main">
          <section className="auth-card" aria-labelledby="session-title">
            <h1 id="session-title">{checking ? 'Signing you in…' : 'Could not load your account'}</h1>
            {profileError && (
              <>
                <p className="intro" role="alert">{profileError}</p>
                <div className="session-actions">
                  <button className="primary-button" type="button" onClick={retryProfile}>
                    Try again
                  </button>
                  <SignOutButton className="text-button" />
                </div>
              </>
            )}
          </section>
        </main>
      </>
    )
  }

  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="/login" element={<AuthPage key="login" mode="login" />} />
        <Route path="/register" element={<AuthPage key="register" mode="register" />} />
      </Route>
      <Route element={<SignedInLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/herd" element={<PlaceholderPage title="Herd" message="Herd records are coming soon." />} />
        <Route path="/herd/:animalId" element={<AnimalDetail />} />
        <Route path="/health" element={<PlaceholderPage title="Health" message="Health events are coming soon." />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" message="Use the navigation to return to HerdTrack." />} />
      </Route>
    </Routes>
  )
}
