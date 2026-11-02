
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import HomeFeed from './pages/HomeFeed'
import CreatePost from './pages/CreatePost'
import SearchUsers from './pages/SearchUsers'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Stories from './pages/Stories'
import './App.css'

function Home({ currentUser, setCurrentUser, token, onLogout }) {
  const [activePage, setActivePage] = useState('home')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [feedKey, setFeedKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const isMessagesPage = activePage === 'messages'

  // Close menu when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Navigation functions
  const openHome = () => {
    setActivePage('home')
    setShowCreatePost(false)
    setMenuOpen(false)
  }

  const openCreatePost = () => {
    setActivePage('home')
    setShowCreatePost(true)
    setMenuOpen(false)
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
    setActivePage('home')
    setMenuOpen(false)
    setFeedKey((previous) => previous + 1)
  }

  const openPage = (page) => {
    setActivePage(page)
    setShowCreatePost(false)
    setMenuOpen(false)
  }

  const handleLogout = () => {
    setMenuOpen(false)
    onLogout()
  }

  // Current user avatar
  const renderCurrentUserAvatar = () => (
    <div className="avatar avatar-purple">
      {currentUser?.profilePicture ? (
        <img
          src={currentUser.profilePicture}
          alt={`${currentUser.username || 'Your'} profile`}
        />
      ) : (
        (currentUser?.username || 'D')[0].toUpperCase()
      )}
    </div>
  )

  return (
    <div className={`app ${isMessagesPage ? 'messages-mode' : ''}`}>

      {/* Hamburger menu */}
      <button
        type="button"
        className={`menu-toggle ${menuOpen ? 'menu-toggle-open' : ''}`}
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="socially-sidebar"
      >
        {menuOpen ? '×' : '☰'}
      </button>

      {/* Menu backdrop */}
      {menuOpen && (
        <button
          type="button"
          className="menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar */}
      <aside
        id="socially-sidebar"
        className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <h1
          className="brand"
          onClick={openHome}
          style={{ cursor: 'pointer' }}
        >
          Socially<span className="brand-dot">.</span>
        </h1>

        <div className="sidebar-label">MENU</div>

        <nav className="navigation" aria-label="Main navigation">

          <button
            className={`nav-item ${activePage === 'home' ? 'active' : ''}`}
            onClick={openHome}
            aria-current={activePage === 'home' ? 'page' : undefined}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="nav-icon" aria-hidden="true">⌂</span>
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${activePage === 'search' ? 'active' : ''}`}
            onClick={() => openPage('search')}
            aria-current={activePage === 'search' ? 'page' : undefined}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="nav-icon" aria-hidden="true">⌕</span>
            <span>Search people</span>
          </button>

          <button
            className={`nav-item ${isMessagesPage ? 'active' : ''}`}
            onClick={() => openPage('messages')}
            aria-current={isMessagesPage ? 'page' : undefined}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="nav-icon" aria-hidden="true">✉</span>
            <span>Messages</span>
          </button>

          <button
            className={`nav-item ${
              activePage === 'notifications' ? 'active' : ''
            }`}
            onClick={() => openPage('notifications')}
            aria-current={
              activePage === 'notifications' ? 'page' : undefined
            }
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="nav-icon" aria-hidden="true">♡</span>
            <span>Notifications</span>
          </button>

          <button
            className={`nav-item ${showCreatePost ? 'active' : ''}`}
            onClick={openCreatePost}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="nav-icon" aria-hidden="true">＋</span>
            <span>Create post</span>
          </button>

          <button
            className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
            onClick={() => openPage('profile')}
            aria-current={activePage === 'profile' ? 'page' : undefined}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="nav-icon" aria-hidden="true">◎</span>
            <span>My profile</span>
          </button>

        </nav>

        <div className="sidebar-spacer" />

        <button
          className="nav-item logout-link"
          onClick={handleLogout}
          tabIndex={menuOpen ? 0 : -1}
        >
          <span className="nav-icon" aria-hidden="true">↪</span>
          <span>Log out</span>
        </button>
      </aside>

      {/* Main content */}
      <main
        className={`main-content ${
          isMessagesPage ? 'messages-main-content' : ''
        }`}
      >

        {/* Mobile header */}
        <header className="mobile-header">
          <h1 className="brand" onClick={openHome}>
            Socially<span className="brand-dot">.</span>
          </h1>

          <button
            className="mobile-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            ↪
          </button>
        </header>

        {/* Home feed */}
        {activePage === 'home' && (
          <>
            <Stories />

            <section className="feed-welcome">
              <div className="welcome-content">
                <span className="welcome-eyebrow">
                  YOUR COMMUNITY, YOUR SPACE
                </span>

                <h2>
                  Welcome back, {currentUser?.username || 'friend'}!
                  <span className="welcome-sparkle" aria-hidden="true">
                    {' '}✦
                  </span>
                </h2>

                <p>
                  Discover what&apos;s happening in your community today.
                </p>
              </div>

              <button
                className="welcome-create-button"
                onClick={openCreatePost}
              >
                <span aria-hidden="true">＋</span>
                Create post
              </button>
            </section>

            <section className="feed" aria-label="Community feed">

              {showCreatePost && (
                <CreatePost
                  token={token}
                  onCancel={() => setShowCreatePost(false)}
                  onPostCreated={handlePostCreated}
                />
              )}

              <HomeFeed
                key={feedKey}
                token={token}
              />

            </section>
          </>
        )}

        {/* Search people */}
        {activePage === 'search' && (
          <SearchUsers token={token} />
        )}

        {/* Messages */}
        {isMessagesPage && (
          <Messages token={token} />
        )}

        {/* Profile */}
        {activePage === 'profile' && (
          <Profile
            token={token}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
          />
        )}

        {/* Notifications */}
        {activePage === 'notifications' && (
          <Notifications token={token} />
        )}

      </main>

      {/* Right panel */}
      {!isMessagesPage && (
        <aside className="right-panel">

          {/* Account information */}
          <section className="right-panel-card">

            <div className="panel-heading">
              <span className="panel-heading-icon" aria-hidden="true">
                ✦
              </span>
              <h2>Your account</h2>
            </div>

            <div className="my-profile">
              {renderCurrentUserAvatar()}

              <div className="profile-text">
                <strong>
                  {currentUser?.username || 'Your profile'}
                </strong>

                <span>
                  {currentUser?.email || 'Welcome to your space'}
                </span>
              </div>
            </div>

            <button
              className="view-profile-button"
              onClick={() => openPage('profile')}
            >
              View my profile <span aria-hidden="true">→</span>
            </button>

          </section>

          {/* People suggestions */}
          <section className="right-panel-card suggestions-card">

            <div className="suggestions-heading">
              <div>
                <h2>People to discover</h2>
                <p>Find your next connection</p>
              </div>
            </div>

            {[
              ['R', 'rahul.creates', 'Creative explorer'],
              ['A', 'ananya.art', 'Art & inspiration'],
              ['K', 'kiran.explores', 'Sharing adventures'],
            ].map(([initial, username, description], index) => (
              <div className="suggestion" key={username}>

                <div className={`avatar avatar-suggest-${index}`}>
                  {initial}
                </div>

                <div className="profile-text">
                  <strong>{username}</strong>
                  <span>{description}</span>
                </div>

              </div>
            ))}

            <button
              className="discover-button"
              onClick={() => openPage('search')}
            >
              Discover more people <span aria-hidden="true">→</span>
            </button>

          </section>

          <footer className="socially-footer" />

        </aside>
      )}

    </div>
  )
}

// ==========================================
// MAIN APP
// ==========================================
function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('socially_token') || ''
  )

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('socially_user') || 'null'
      )
    } catch {
      return null
    }
  })

  const [page, setPage] = useState('login')

  // Login
  const handleLogin = (newToken, user) => {
    localStorage.setItem('socially_token', newToken)

    if (user) {
      localStorage.setItem('socially_user', JSON.stringify(user))
      setCurrentUser(user)
    }

    setToken(newToken)
  }

  // Register
  const handleRegister = (newToken, user) => {
    handleLogin(newToken, user)
  }

  // Update user profile
  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser)

    localStorage.setItem(
      'socially_user',
      JSON.stringify(updatedUser)
    )
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('socially_token')
    localStorage.removeItem('socially_user')

    setToken('')
    setCurrentUser(null)
    setPage('login')
  }

  // Login and registration pages
  if (!token) {

    if (page === 'register') {
      return (
        <Register
          onRegister={handleRegister}
          onShowLogin={() => setPage('login')}
        />
      )
    }

    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => setPage('register')}
      />
    )
  }

  // Logged-in application
  return (
    <Home
      currentUser={currentUser}
      setCurrentUser={handleUserUpdated}
      token={token}
      onLogout={handleLogout}
    />
  )
}

export default App
