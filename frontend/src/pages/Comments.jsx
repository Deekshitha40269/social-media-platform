
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/api'

function Comments({ postId, token }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchComments = async () => {
    try {
      setError('')

      const response = await fetch(
        `${API_URL}/comments/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not load comments.')
      }

      // Supports either an array response or { comments: [...] }.
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.comments)
          ? data.comments
          : []

      setComments(list)
    } catch (err) {
      setError(err.message || 'Could not load comments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postId && token) {
      fetchComments()
    }
  }, [postId, token])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!text.trim()) {
      setError('Please write a comment first.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post: postId,
          text: text.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not add comment.')
      }

      setText('')
      await fetchComments()
    } catch (err) {
      setError(err.message || 'Could not add comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments-section">
      <h3>Comments ({comments.length})</h3>

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="comments-empty">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div className="comment-item" key={comment._id}>
              <div className="comment-avatar">
                {(comment.user?.username || '?')[0].toUpperCase()}
              </div>

              <div className="comment-content">
                <strong>
                  {comment.user?.username || 'User'}
                </strong>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a comment..."
          maxLength={1000}
          disabled={submitting}
          aria-label="Write a comment"
        />

        <button type="submit" disabled={submitting || !text.trim()}>
          {submitting ? 'Sending...' : 'Comment'}
        </button>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default Comments
