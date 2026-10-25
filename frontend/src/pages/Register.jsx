
import { useState } from 'react'
import './Login.css'

function Register({ onRegister, onShowLogin }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (username.trim().length < 3) {
      setError('Username must contain at least 3 characters.')
      return
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create your account.')
      }

      // Some APIs return a token at registration; others require login.
      if (data.token) {
        onRegister(data.token, data.user)
      } else {
        onShowLogin(email.trim())
      }
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Make sure your backend is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="auth-art-content">
          <span className="auth-eyebrow">A LITTLE SPACE TO BE YOU</span>
          <h1>Your moments.<br />Your people.<br />Your story.</h1>
          <p>Join a community where you can share everyday moments and stay connected.</p>
          <div className="auth-art-orbit">
            <span>✳</span>
            <span>♡</span>
            <span>✦</span>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <a className="auth-brand" href="/">socially.</a>
          <p className="auth-kicker">LET'S GET STARTED</p>
          <h2>Create your account</h2>
          <p className="auth-subtitle">Your corner of Socially is waiting.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              required
            />

            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Already a member?{' '}
            <button type="button" onClick={onShowLogin}>Sign in</button>
          </p>

          <p className="auth-legal">
            By joining, you agree to use Socially kindly and respectfully.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register
