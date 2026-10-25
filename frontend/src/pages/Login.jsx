
import { useState } from 'react'
import './Login.css'

function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to log in.')
      }

      if (!data.token) {
        throw new Error('Login succeeded, but the server did not return a token.')
      }

      onLogin(data.token, data.user)
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
          <span className="auth-eyebrow">YOUR WORLD, YOUR PEOPLE</span>
          <h1>Life is better<br />when we share it.</h1>
          <p>A little space for your everyday moments, favorite people, and new discoveries.</p>
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
          <p className="auth-kicker">WELCOME BACK</p>
          <h2>Sign in to your world</h2>
          <p className="auth-subtitle">Pick up right where you left off.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            New to Socially?{' '}
            <button type="button" onClick={onShowRegister}>Create an account</button>
          </p>

          <p className="auth-legal">By continuing, you agree to use Socially kindly and respectfully.</p>
        </div>
      </section>
    </main>
  )
}

export default Login
