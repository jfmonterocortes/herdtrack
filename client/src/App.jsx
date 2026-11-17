import { startTransition } from 'react'
import HerdPage from './HerdPage'
import AnimalDetailPage from './AnimalDetailPage'
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
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
    <button className={`btn ${className}`} type="button" onClick={handleSignOut}>
      Sign out
    </button>
  )
}

function Header({ signedIn = false }) {
  return (
    <header className="navbar site-header py-0">
      <div className="container header-inner">
        <Link to={signedIn ? '/dashboard' : '/login'} className="navbar-brand brand m-0">
          HerdTrack
        </Link>
        {signedIn && (
          <>
            <nav className="nav main-nav gap-1" aria-label="Main navigation">
              <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
              <NavLink className="nav-link" to="/herd">Herd</NavLink>
              <NavLink className="nav-link" to="/health">Health</NavLink>
            </nav>
            <SignOutButton className="sign-out ms-auto" />
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
      <main id="main-content" className="container page-main">
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
      <div className="row row-cols-1 row-cols-sm-2 g-3 mt-3">
        <div className="col">
          <Link className="card card-body dashboard-link h-100" to="/herd">
            <h2>Herd</h2>
            <span>Browse animal records</span>
          </Link>
        </div>
        <div className="col">
          <Link className="card card-body dashboard-link h-100" to="/health">
            <h2>Health</h2>
            <span>View herd health events</span>
          </Link>
        </div>
      </div>
    </>
  )
}

function PlaceholderPage({ title, message }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="card card-body empty-state">{message}</p>
    </>
  )
}

export default function App() {
  const { checking, profileError, retryProfile } = useAuth()

  if (checking || profileError) {
    return (
      <>
        <Header />
        <main className="container auth-main px-0">
          <section className="card auth-card" aria-labelledby="session-title">
            <h1 id="session-title">{checking ? 'Signing you in…' : 'Could not load your account'}</h1>
            {profileError && (
              <>
                <p className="intro" role="alert">{profileError}</p>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  <button className="btn primary-button" type="button" onClick={retryProfile}>
                    Try again
                  </button>
                  <SignOutButton className="btn-link text-button" />
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
        <Route path="/herd" element={<HerdPage />} />
        <Route path="/herd/:animalId" element={<AnimalDetailPage />} />
        <Route path="/health" element={<PlaceholderPage title="Health" message="Health events are coming soon." />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" message="Use the navigation to return to HerdTrack." />} />
      </Route>
    </Routes>
  )
}
