
import { useEffect, useState } from 'react'
import './Stories.css'

const STORAGE_KEY = 'socially_stories'
const STORY_DURATION = 24 * 60 * 60 * 1000
const MAX_IMAGE_SIZE = 1024 * 1024

function getSavedStories() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const now = Date.now()

    return saved.filter((story) => story.expiresAt > now)
  } catch {
    return []
  }
}

function Stories() {
  const [stories, setStories] = useState(getSavedStories)
  const [showComposer, setShowComposer] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedStory, setSelectedStory] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('socially_user') || 'null')
    } catch {
      return null
    }
  })()

  const username = currentUser?.username || 'You'
  const currentUserId = currentUser?._id || currentUser?.id || 'current-user'

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories))
    } catch {
      setError('Browser storage is full. Remove an old story and try again.')
    }
  }, [stories])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStories((previous) => {
        const active = previous.filter(
          (story) => story.expiresAt > Date.now()
        )
        return active.length === previous.length ? previous : active
      })
    }, 60 * 1000)

    return () => window.clearInterval(timer)
  }, [])

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setSuccess('')

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Please choose an image smaller than 1 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result)
      } else {
        setError('Could not read that image. Please try again.')
      }
    }

    reader.onerror = () => {
      setError('Could not open that image. Please try another.')
    }

    reader.readAsDataURL(file)
  }

  const publishStory = (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedImage) {
      setError('Choose a photo before publishing your story.')
      return
    }

    const newStory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId: currentUserId,
      username,
      profilePicture: currentUser?.profilePicture || '',
      image: selectedImage,
      caption: caption.trim(),
      createdAt: Date.now(),
      expiresAt: Date.now() + STORY_DURATION,
    }

    const updatedStories = [newStory, ...stories]

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStories))
      setStories(updatedStories)
      setSelectedImage('')
      setCaption('')
      setShowComposer(false)
      setSuccess('Your story has been published!')
    } catch {
      setError(
        'Could not save this story. Try a smaller image or remove an old story.'
      )
    }
  }

  const closeComposer = () => {
    setShowComposer(false)
    setSelectedImage('')
    setCaption('')
    setError('')
  }

  const openStory = (story) => {
    setSelectedStory(story)
    setError('')
  }

  const deleteOwnStory = () => {
    if (!selectedStory || selectedStory.userId !== currentUserId) return

    const updatedStories = stories.filter(
      (story) => story.id !== selectedStory.id
    )

    setStories(updatedStories)
    setSelectedStory(null)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStories))
    } catch {
      setError('Could not update saved stories.')
    }
  }

  const timeAgo = (timestamp) => {
    const minutes = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 60000)
    )

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return 'Recently'
  }

  return (
    <>
      <section className="stories" aria-label="Stories">
        <button
          type="button"
          className="story story-button"
          onClick={() => {
            setError('')
            setShowComposer(true)
          }}
        >
          <span className="story-ring own-story">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt="" />
            ) : (
              <span className="story-plus">＋</span>
            )}
          </span>
          <span>Your story</span>
        </button>

        {stories.map((story) => (
          <button
            type="button"
            className="story story-button"
            key={story.id}
            onClick={() => openStory(story)}
            aria-label={`View ${story.username}'s story`}
          >
            <span className="story-ring story-ring-published">
              <img src={story.image} alt="" />
            </span>
            <span>{story.username}</span>
          </button>
        ))}
      </section>

      {success && (
        <p className="story-success" role="status">
          {success}
        </p>
      )}

      {showComposer && (
        <div
          className="story-modal-backdrop"
          onClick={closeComposer}
        >
          <section
            className="story-modal story-composer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-composer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="story-modal-header">
              <h2 id="story-composer-title">Create your story</h2>
              <button
                type="button"
                className="story-close-button"
                onClick={closeComposer}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <form onSubmit={publishStory}>
              {selectedImage ? (
                <div className="story-preview">
                  <img src={selectedImage} alt="Story preview" />
                </div>
              ) : (
                <label className="story-upload-area">
                  <span className="story-upload-icon">＋</span>
                  <strong>Add a photo to your story</strong>
                  <span>Choose an image from your device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}

              {selectedImage && (
                <label className="story-change-photo">
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}

              <label className="story-caption-label">
                Caption <span>Optional</span>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Add a little something..."
                  maxLength={150}
                  rows={2}
                />
              </label>

              {error && (
                <p className="story-error" role="alert">{error}</p>
              )}

              <button
                type="submit"
                className="story-publish-button"
                disabled={!selectedImage}
              >
                Publish story
              </button>

              <p className="story-expiry-note">
                Your story will be available for 24 hours.
              </p>
            </form>
          </section>
        </div>
      )}

      {selectedStory && (
        <div
          className="story-modal-backdrop story-view-backdrop"
          onClick={() => setSelectedStory(null)}
        >
          <section
            className="story-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedStory.username}'s story`}
            onClick={(event) => event.stopPropagation()}
          >
            <img
              className="story-viewer-image"
              src={selectedStory.image}
              alt={selectedStory.caption || `${selectedStory.username}'s story`}
            />

            <div className="story-viewer-shade" />

            <header className="story-viewer-header">
              <div className="story-viewer-avatar">
                {selectedStory.profilePicture ? (
                  <img src={selectedStory.profilePicture} alt="" />
                ) : (
                  selectedStory.username[0]?.toUpperCase()
                )}
              </div>

              <div className="story-viewer-user">
                <strong>{selectedStory.username}</strong>
                <span>{timeAgo(selectedStory.createdAt)}</span>
              </div>

              <button
                type="button"
                className="story-close-button story-viewer-close"
                onClick={() => setSelectedStory(null)}
                aria-label="Close story"
              >
                ×
              </button>
            </header>

            {selectedStory.caption && (
              <p className="story-viewer-caption">
                {selectedStory.caption}
              </p>
            )}

            {selectedStory.userId === currentUserId && (
              <button
                type="button"
                className="story-delete-button"
                onClick={deleteOwnStory}
              >
                Delete story
              </button>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default Stories
