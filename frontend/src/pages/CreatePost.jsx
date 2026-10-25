
import { useState } from 'react'

const API_URL = 'http://localhost:5000/api'

function CreatePost({ token, onPostCreated, onCancel }) {
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!caption.trim()) {
      setError('Please write something before publishing.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caption: caption.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create post.')
      }

      setCaption('')
      setSuccess('Your post was published successfully! 🎉')

      if (onPostCreated) {
        onPostCreated(data.post)
      }
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that it is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="create-post-form" onSubmit={handleSubmit}>
      <h2>Create a post</h2>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        maxLength={2000}
        disabled={loading}
      />

      <div className="create-post-footer">
        <span>{caption.length}/2000</span>

        <div className="create-post-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish post'}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
    </form>
  )
}

export default CreatePost
