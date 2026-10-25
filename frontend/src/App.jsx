
import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import HomeFeed from './pages/HomeFeed'
import CreatePost from './pages/CreatePost'
import SearchUsers from './pages/SearchUsers'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import './App.css'

function Home({ currentUser, setCurrentUser, token, onLogout }) {
  const [activePage, setActivePage] = useState('home')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [feedKey, setFeedKey] = useState(0)

  const openHome = () => {
    setActivePage('home')
    setShowCreatePost(false)
  }

  const openCreatePost = () => {
    setActivePage('home')
    setShowCreatePost(true)
  }

  const handlePostCreated = () => {
    setShowCreatePost(false)
    setActivePage('home')
    setFeedKey((previous) => previous + 1)
  }

  const openPage = (page) => {
    setActivePage(page)
    setShowCreatePost(false)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1
          className="brand"
          onClick={openHome}
          style={{ cursor: 'pointer' }}
        >
          socially.
        </h1>

        <nav className="navigation">
          <button
            className={`nav-item ${activePage === 'home' ? 'active' : ''}`}
            onClick={openHome}
          >
            ⌂ <span>Home</span>
          </button>

          <button
            className={`nav-item ${activePage === 'search' ? 'active' : ''}`}
            onClick={() => openPage('search')}
          >
            ⌕ <span>Search</span>
          </button>

          <button
            className={`nav-item ${activePage === 'messages' ? 'active' : ''}`}
            onClick={() => openPage('messages')}
          >
            ✉ <span>Messages</span>
          </button>

          <button
            className={`nav-item ${
              activePage === 'notifications' ? 'active' : ''
            }`}
            onClick={() => openPage('notifications')}
          >
            ♡ <span>Notifications</span>
          </button>

          <button className="nav-item" onClick={openCreatePost}>
            ＋ <span>Create post</span>
          </button>

          <button
            className={`nav-item ${
              activePage === 'profile' ? 'active' : ''
            }`}
            onClick={() => openPage('profile')}
          >
            ◎ <span>Profile</span>
          </button>
        </nav>

        <button className="nav-item logout-link" onClick={onLogout}>
          ↪ <span>Log out</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="mobile-header">
          <h1 className="brand" onClick={openHome}>
            socially.
          </h1>
          <button onClick={onLogout}>Log out</button>
        </header>

        {activePage === 'home' && (
          <>
            <section className="stories">
              <div className="story">
                <div className="story-ring own-story">＋</div>
                <span>Your story</span>
              </div>

              {['Aarav', 'Priya', 'Rahul', 'Ananya', 'Kiran'].map(
                (name, index) => (
                  <div className="story" key={name}>
                    <div className={`story-ring color-${index}`}>
                      {name[0]}
                    </div>
                    <span>{name}</span>
                  </div>
                )
              )}
            </section>

            <section className="feed">
              <div className="feed-welcome">
                <h2>Welcome, {currentUser?.username || 'to Socially'}!</h2>
                <p>Here's what's happening in your community.</p>
              </div>

              {showCreatePost && (
                <CreatePost
                  token={token}
                  onCancel={() => setShowCreatePost(false)}
                  onPostCreated={handlePostCreated}
                />
              )}

              <HomeFeed key={feedKey} token={token} />
            </section>
          </>
        )}

        {activePage === 'search' && <SearchUsers token={token} />}

        {activePage === 'messages' && <Messages token={token} />}

        {activePage === 'profile' && (
          <Profile
            token={token}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
          />
        )}

        {activePage === 'notifications' && (
          <section className="feed-status">
            <h2>Notifications 🔔</h2>
            <p>Your notifications page will be added next.</p>
          </section>
        )}
      </main>

      <aside className="right-panel">
        <div className="my-profile">
          <div className="avatar avatar-purple">
            {(currentUser?.username || 'D')[0].toUpperCase()}
          </div>

          <div className="profile-text">
            <strong>{currentUser?.username || 'Your profile'}</strong>
            <span>{currentUser?.email || 'Welcome to your space'}</span>
          </div>
        </div>

        <div className="suggestions-heading">
          <strong>Suggested for you</strong>
        </div>

        {[
          ['R', 'rahul.creates'],
          ['A', 'ananya.art'],
          ['K', 'kiran.explores'],
        ].map(([initial, username], index) => (
          <div className="suggestion" key={username}>
            <div className={`avatar avatar-suggest-${index}`}>
              {initial}
            </div>

            <div className="profile-text">
              <strong>{username}</strong>
              <span>Discover someone new</span>
            </div>
          </div>
        ))}
      </aside>
    </div>
  )
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('socially_token') || ''
  )

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('socially_user') || 'null')
    } catch {
      return null
    }
  })

  const [page, setPage] = useState('login')

  const handleLogin = (newToken, user) => {
    localStorage.setItem('socially_token', newToken)

    if (user) {
      localStorage.setItem('socially_user', JSON.stringify(user))
      setCurrentUser(user)
    }

    setToken(newToken)
  }

  const handleRegister = (newToken, user) => {
    handleLogin(newToken, user)
  }

  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser)
    localStorage.setItem('socially_user', JSON.stringify(updatedUser))
  }

  const handleLogout = () => {
    localStorage.removeItem('socially_token')
    localStorage.removeItem('socially_user')

    setToken('')
    setCurrentUser(null)
    setPage('login')
  }

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
