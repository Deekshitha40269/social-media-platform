
import { useEffect, useRef, useState } from 'react'

const API_URL = 'https://socially-backend-v5ux.onrender.com/api'
const MAX_IMAGE_SIZE = 2 * 1024 * 1024

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

  const fileInputRef = useRef(null)

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

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setMessage('')

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Please choose an image smaller than 2 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePicture(reader.result)
      } else {
        setError('Could not preview this image. Please try another.')
      }
    }

    reader.onerror = () => {
      setError('Could not read this image. Please try again.')
    }

    reader.readAsDataURL(file)
  }

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
          profilePicture,
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

      if (onUserUpdated) {
        onUserUpdated(updatedUser)
      }

      setEditing(false)
      setMessage('Your profile was updated successfully!')
    } catch (err) {
      setError(
        err.message ||
          'Could not update your profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const cancelEditing = () => {
    setEditing(false)
    setUsername(profile?.username || '')
    setBio(profile?.bio || '')
    setProfilePicture(profile?.profilePicture || '')
    setError('')
    setMessage('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
              <img
                src={profilePicture}
                alt={`${profile?.username || 'Your'} profile`}
              />
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
                {profile?.bio ||
                  'Add a little introduction about yourself.'}
              </p>
            </>
          ) : (
            <form className="edit-profile-form" onSubmit={handleSave}>
              <div className="profile-photo-editor">
                <div className="profile-photo-preview">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile picture preview"
                    />
                  ) : (
                    <span>
                      {(username || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="profile-photo-controls">
                  <strong>Profile picture</strong>
                  <p>Choose a photo to personalize your profile.</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="profile-photo-input"
                    aria-label="Choose profile picture"
                  />

                  <button
                    type="button"
                    className="choose-photo-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose photo
                  </button>

                  {profilePicture && (
                    <button
                      type="button"
                      className="remove-photo-button"
                      onClick={() => {
                        setProfilePicture('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Remove photo
                    </button>
                  )}

                  <small>JPG, PNG, GIF or WebP · Maximum 2 MB</small>
                </div>
              </div>

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

              <div className="profile-form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="form-success" role="status">
              {message}
            </p>
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
                    <p>
                      {post.caption || 'A moment shared on Socially.'}
                    </p>
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
