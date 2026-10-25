
import { useState } from 'react'

const API_URL = 'http://localhost:5000/api'

function SearchUsers({ token, onFollowChange }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [followLoading, setFollowLoading] = useState([])

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(
        localStorage.getItem('socially_user') || 'null'
      )
      return user?._id || user?.id || ''
    } catch {
      return ''
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()

    if (!query.trim()) {
      setError('Enter a username to search.')
      setUsers([])
      setSearched(false)
      return
    }

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const response = await fetch(
        `${API_URL}/users/search?username=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not search users.')
      }

      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that it is running.'
          : err.message
      )
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (user) => {
    const currentUserId = getCurrentUserId()

    if (user._id === currentUserId) {
      setError("You can't follow your own account.")
      return
    }

    if (followLoading.includes(user._id)) return

    const isFollowing = (user.followers || []).some((follower) => {
      const id = typeof follower === 'string' ? follower : follower?._id
      return id === currentUserId
    })

    setFollowLoading((previous) => [...previous, user._id])
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/users/${user._id}/follow`,
        {
          method: isFollowing ? 'DELETE' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not update follow status.')
      }

      setUsers((previous) =>
        previous.map((item) => {
          if (item._id !== user._id) return item

          const followers = item.followers || []

          return {
            ...item,
            followers: isFollowing
              ? followers.filter((follower) => {
                  const id =
                    typeof follower === 'string'
                      ? follower
                      : follower?._id
                  return id !== currentUserId
                })
              : [...followers, currentUserId],
          }
        })
      )

      if (onFollowChange) onFollowChange()
    } catch (err) {
      setError(err.message || 'Could not update follow status.')
    } finally {
      setFollowLoading((previous) =>
        previous.filter((id) => id !== user._id)
      )
    }
  }

  const currentUserId = getCurrentUserId()

  return (
    <section className="search-users-page">
      <div className="search-users-heading">
        <h2>Find your people</h2>
        <p>Search for people to connect with on Socially.</p>
      </div>

      <form className="user-search-form" onSubmit={handleSearch}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by username..."
          aria-label="Search by username"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="search-status">Searching for users...</p>}

      {!loading && searched && users.length === 0 && !error && (
        <p className="search-status">
          No users found. Try another username.
        </p>
      )}

      {!loading && users.length > 0 && (
        <div className="search-results">
          {users.map((user) => {
            const isSelf = user._id === currentUserId

            const isFollowing = (user.followers || []).some(
              (follower) => {
                const id =
                  typeof follower === 'string'
                    ? follower
                    : follower?._id
                return id === currentUserId
              }
            )

            return (
              <article className="search-user-card" key={user._id}>
                <div className="avatar avatar-purple">
                  {(user.username || '?')[0].toUpperCase()}
                </div>

                <div className="search-user-info">
                  <strong>{user.username}</strong>
                  <span>{user.bio || 'Welcome to Socially!'}</span>
                  <small>
                    {user.followers?.length || 0} followers
                  </small>
                </div>

                {!isSelf && (
                  <button
                    type="button"
                    className={`follow-button ${
                      isFollowing ? 'following' : ''
                    }`}
                    onClick={() => handleFollow(user)}
                    disabled={followLoading.includes(user._id)}
                  >
                    {followLoading.includes(user._id)
                      ? 'Please wait...'
                      : isFollowing
                        ? 'Following'
                        : 'Follow'}
                  </button>
                )}

                {isSelf && (
                  <span className="you-label">You</span>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SearchUsers
