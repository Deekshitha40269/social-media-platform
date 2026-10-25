
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/api'

function Profile({ token, currentUser, onUserUpdated }) {
  const [profile, setProfile] = useState(currentUser || null)
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(currentUser?.username || '')
  const [bio, setBio] = useState(currentUser?.bio || '')
  const [profilePicture, setProfilePicture] = useState(
    currentUser?.profilePicture || ''
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        }

        const [profileResponse, postsResponse] = await Promise.all([
          fetch(`${API_URL}/users/me`, { headers }),
          fetch(`${API_URL}/posts/me`, { headers }),
        ])

        const profileData = await profileResponse.json()
        const postsData = await postsResponse.json()

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || 'Could not load your profile.'
          )
        }

        if (!postsResponse.ok) {
          throw new Error(
            postsData.message || 'Could not load your posts.'
          )
        }

        const user = profileData.user || profileData
        setProfile(user)
        setUsername(user.username || '')
        setBio(user.bio || '')
        setProfilePicture(user.profilePicture || '')
        setPosts(Array.isArray(postsData.posts) ? postsData.posts : [])
      } catch (err) {
        setError(err.message || 'Could not load your profile.')
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchProfile()
  }, [token])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim(),
          profilePicture: profilePicture.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not update your profile.')
      }

      const updatedUser = data.user || data
      setProfile(updatedUser)
      setUsername(updatedUser.username || username)
      setBio(updatedUser.bio || '')
      setProfilePicture(updatedUser.profilePicture || '')

      localStorage.setItem('socially_user', JSON.stringify(updatedUser))

      if (onUserUpdated) onUserUpdated(updatedUser)

      setEditing(false)
      setMessage('Your profile was updated successfully!')
    } catch (err) {
      setError(err.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="feed-status">Loading your profile...</p>
  }

  if (error && !profile) {
    return (
      <div className="feed-status" role="alert">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-cover" />

        <div className="profile-main">
          <div className="profile-avatar-large">
            {profilePicture ? (
              <img src={profilePicture} alt={profile?.username || 'Profile'} />
            ) : (
              (profile?.username || '?')[0].toUpperCase()
            )}
          </div>

          {!editing ? (
            <>
              <div className="profile-heading">
                <div>
                  <h2>{profile?.username || 'Your profile'}</h2>
                  <p>{profile?.email || currentUser?.email || ''}</p>
                </div>

                <button
                  type="button"
                  className="edit-profile-button"
                  onClick={() => {
                    setError('')
                    setMessage('')
                    setEditing(true)
                  }}
                >
                  Edit profile
                </button>
              </div>

              <p className="profile-bio">
                {profile?.bio || 'Add a little introduction about yourself.'}
              </p>
            </>
          ) : (
            <form className="edit-profile-form" onSubmit={handleSave}>
              <label>
                Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                />
              </label>

              <label>
                Bio
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={300}
                  placeholder="Tell people a little about yourself..."
                  rows={3}
                />
              </label>

              <label>
                Profile picture URL
                <input
                  type="url"
                  value={profilePicture}
                  onChange={(event) => setProfilePicture(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </label>

              <div className="profile-form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={() => {
                    setEditing(false)
                    setUsername(profile?.username || '')
                    setBio(profile?.bio || '')
                    setProfilePicture(profile?.profilePicture || '')
                    setError('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {error && (
            <p className="form-error" role="alert">{error}</p>
          )}

          {message && (
            <p className="form-success" role="status">{message}</p>
          )}

          <div className="profile-stats">
            <div>
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{profile?.followers?.length || 0}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{profile?.following?.length || 0}</strong>
              <span>Following</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-posts-section">
        <h3>Your posts</h3>

        {posts.length === 0 ? (
          <div className="profile-empty-posts">
            <h4>No posts yet ✨</h4>
            <p>When you publish a post, it will appear here.</p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <article className="profile-post-card" key={post._id}>
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.caption || 'Your post'}
                  />
                ) : (
                  <div className="profile-post-text">
                    <p>{post.caption || 'A moment shared on Socially.'}</p>
                  </div>
                )}

                <div className="profile-post-meta">
                  <span>❤️ {post.likes?.length || 0}</span>
                  <time>
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : ''}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Profile
