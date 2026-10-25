
import { useEffect, useState } from 'react'
import Comments from './Comments'

const API_URL = 'http://localhost:5000/api'

function HomeFeed({ token }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likingPosts, setLikingPosts] = useState([])
  const [likeError, setLikeError] = useState('')

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

  return (
    <section className="real-feed">
      {likeError && (
        <p className="form-error" role="alert">
          {likeError}
        </p>
      )}

      {posts.map((post) => {
        const currentUserId = getCurrentUserId()

        const isLiked = (post.likes || []).some((like) => {
          const userId = typeof like === 'string' ? like : like?._id
          return userId === currentUserId
        })

        return (
          <article className="post" key={post._id}>
            <header className="post-header">
              <div className="avatar avatar-purple">
                {(post.user?.username || '?')[0].toUpperCase()}
              </div>

              <div className="post-author">
                <strong>
                  {post.user?.username || 'Unknown user'}
                </strong>
                <span>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : 'Recently'}
                </span>
              </div>
            </header>

            {post.image && (
              <img
                className="real-post-image"
                src={post.image}
                alt={post.caption || 'Post'}
              />
            )}

            <div className="post-details">
              {post.caption && (
                <p>
                  <strong>{post.user?.username || 'User'}</strong>{' '}
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

                <span>{post.likes?.length || 0} likes</span>
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
