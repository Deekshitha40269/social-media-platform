
import { useEffect, useState } from 'react'
import Comments from './Comments'

const API_URL = 'http://localhost:5000/api'

function HomeFeed({ token }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likingPosts, setLikingPosts] = useState([])
  const [deletingPosts, setDeletingPosts] = useState([])
  const [likeError, setLikeError] = useState('')
  const [deleteError, setDeleteError] = useState('')

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

  const fetchPosts = async () => {
    try {
      setError('')

      const response = await fetch(`${API_URL}/posts/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not load posts.')
      }

      setPosts(Array.isArray(data.posts) ? data.posts : [])
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that it is running on port 5000.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true)
      fetchPosts()
    } else {
      setPosts([])
      setLoading(false)
    }
  }, [token])

  const handleLike = async (post) => {
    if (likingPosts.includes(post._id)) return

    setLikeError('')
    setLikingPosts((previous) => [...previous, post._id])

    const currentUserId = getCurrentUserId()

    const alreadyLiked = (post.likes || []).some((like) => {
      const userId = typeof like === 'string' ? like : like?._id
      return userId === currentUserId
    })

    try {
      const response = await fetch(
        `${API_URL}/posts/${post._id}/like`,
        {
          method: alreadyLiked ? 'DELETE' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not update like.')
      }

      await fetchPosts()
    } catch (err) {
      setLikeError(err.message || 'Could not update like.')
    } finally {
      setLikingPosts((previous) =>
        previous.filter((id) => id !== post._id)
      )
    }
  }

  const handleDelete = async (post) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post? This action cannot be undone.'
    )

    if (!confirmed) return

    setDeleteError('')
    setDeletingPosts((previous) => [...previous, post._id])

    try {
      const response = await fetch(`${API_URL}/posts/${post._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete post.')
      }

      setPosts((previous) =>
        previous.filter((item) => item._id !== post._id)
      )
    } catch (err) {
      setDeleteError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Please try again.'
          : err.message
      )
    } finally {
      setDeletingPosts((previous) =>
        previous.filter((id) => id !== post._id)
      )
    }
  }

  const openComments = (postId) => {
    document
      .getElementById(`comments-${postId}`)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
  }

  if (loading) {
    return <p className="feed-status">Loading your feed...</p>
  }

  if (error) {
    return (
      <div className="feed-status" role="alert">
        <p>{error}</p>
        <button type="button" onClick={fetchPosts}>
          Try again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="feed-status">
        <h2>Your feed is waiting for its first post ✨</h2>
        <p>When posts are available, they'll appear here.</p>
      </div>
    )
  }

  const currentUserId = getCurrentUserId()

  return (
    <section className="real-feed">
      {likeError && (
        <p className="form-error" role="alert">
          {likeError}
        </p>
      )}

      {deleteError && (
        <p className="form-error" role="alert">
          {deleteError}
        </p>
      )}

      {posts.map((post) => {
        const isLiked = (post.likes || []).some((like) => {
          const userId = typeof like === 'string' ? like : like?._id
          return userId === currentUserId
        })

        const authorName = post.user?.username || 'Unknown user'
        const authorPicture = post.user?.profilePicture

        const authorId =
          typeof post.user === 'string'
            ? post.user
            : post.user?._id || post.user?.id

        const isOwner =
          Boolean(currentUserId) &&
          Boolean(authorId) &&
          String(authorId) === String(currentUserId)

        return (
          <article className="post" key={post._id}>
            <header className="post-header">
              <div className="avatar avatar-purple post-author-avatar">
                {authorPicture ? (
                  <img
                    src={authorPicture}
                    alt={`${authorName}'s profile`}
                  />
                ) : (
                  authorName[0].toUpperCase()
                )}
              </div>

              <div className="post-author">
                <strong>{authorName}</strong>
                <span>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : 'Recently'}
                </span>
              </div>

              {isOwner && (
                <button
                  type="button"
                  className="delete-post-button"
                  onClick={() => handleDelete(post)}
                  disabled={deletingPosts.includes(post._id)}
                  aria-label={`Delete post by ${authorName}`}
                >
                  {deletingPosts.includes(post._id)
                    ? 'Deleting...'
                    : '🗑 Delete'}
                </button>
              )}
            </header>

            {post.image && (
              <img
                className="real-post-image"
                src={post.image}
                alt={post.caption || 'Post image'}
              />
            )}

            <div className="post-details">
              {post.caption && (
                <p>
                  <strong>{authorName}</strong>{' '}
                  {post.caption}
                </p>
              )}

              <div className="post-actions">
                <button
                  type="button"
                  className={`like-button ${isLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post)}
                  disabled={likingPosts.includes(post._id)}
                  aria-label={isLiked ? 'Unlike post' : 'Like post'}
                >
                  {likingPosts.includes(post._id)
                    ? 'Updating...'
                    : isLiked
                      ? '❤️ Unlike'
                      : '♡ Like'}
                </button>

                <span className="likes-count">
                  {post.likes?.length || 0} likes
                </span>

                <button
                  type="button"
                  className="open-comments-button"
                  onClick={() => openComments(post._id)}
                  aria-label="View comments"
                >
                  💬 Comments
                </button>
              </div>
            </div>

            <Comments postId={post._id} token={token} />
          </article>
        )
      })}
    </section>
  )
}

export default HomeFeed
