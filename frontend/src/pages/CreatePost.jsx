
import { useRef, useState } from 'react'

const API_URL = 'https://socially-backend-v5ux.onrender.com/api'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

function CreatePost({ token, onPostCreated, onCancel }) {
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setSuccess('')

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must be 5 MB or less.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setImage(reader.result)
    }

    reader.onerror = () => {
      setError('Could not read this image. Please try another one.')
    }

    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!caption.trim() && !image) {
      setError('Please write something or select a picture.')
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
          image: image || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not create post.')
      }

      setCaption('')
      setImage('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

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
      </div>

      <div className="create-post-image-tools">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={loading}
          aria-label="Choose a picture for your post"
        />

        {image && (
          <div className="create-post-image-preview">
            <img src={image} alt="Preview of your post" />

            <button
              type="button"
              onClick={removeImage}
              disabled={loading}
              className="remove-post-image"
            >
              Remove picture ✕
            </button>
          </div>
        )}
      </div>

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

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="form-success">
          {success}
        </p>
      )}
    </form>
  )
}

export default CreatePost
