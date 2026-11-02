
import { useCallback, useEffect, useState } from 'react'
import './Notifications.css'

const API_URL = 'http://localhost:5000/api'

const notificationIcons = {
  like: '♥',
  comment: '💬',
  follow: '＋',
  message: '✉',
}

const avatarColors = {
  like: 'teal',
  comment: 'pink',
  follow: 'gold',
  message: 'purple',
}

function getTimeAgo(date) {
  if (!date) return ''

  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  )

  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'Just now'
  }

  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return new Date(date).toLocaleDateString()
}

function Notifications({ token }) {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  // Fetch real notifications from MongoDB
  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([])
      setLoading(false)
      setError('Please log in to view your notifications.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_URL}/notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to load notifications.'
        )
      }

      setNotifications(
        Array.isArray(data.notifications)
          ? data.notifications
          : []
      )
    } catch (err) {
      console.error('Fetch notifications error:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length

  // Filter notifications
  const visibleNotifications =
    filter === 'unread'
      ? notifications.filter(
          (notification) => !notification.isRead
        )
      : notifications

  // Mark one notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not update notification.'
        )
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (err) {
      console.error('Mark as read error:', err)
      setError(err.message || 'Could not mark notification as read.')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (unreadCount === 0 || updating) return

    try {
      setUpdating(true)
      setError('')

      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not mark notifications as read.'
        )
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      )
    } catch (err) {
      console.error('Mark all as read error:', err)
      setError(err.message || 'Could not update notifications.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <main className="notifications-page">

      {/* Page heading */}
      <header className="notifications-heading">
        <div>
          <p className="notifications-eyebrow">
            STAY IN THE LOOP
          </p>

          <h1>Notifications</h1>

          <p className="notifications-subtitle">
            See what is happening in your community.
          </p>
        </div>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount} new
          </span>
        )}
      </header>

      {/* Notifications card */}
      <section className="notifications-card">

        {/* Filters and actions */}
        <div className="notifications-toolbar">

          <div className="notification-filters">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>

            <button
              type="button"
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              Unread

              {unreadCount > 0 && (
                <span className="filter-count">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            className="mark-all-read"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || updating}
          >
            {updating ? 'Updating...' : 'Mark all as read'}
          </button>

        </div>

        {/* Error message */}
        {error && (
          <div className="notifications-error" role="alert">
            {error}

            <button
              type="button"
              onClick={fetchNotifications}
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">♡</div>
            <h2>Loading notifications...</h2>
            <p>Please wait while we fetch your notifications.</p>
          </div>
        ) : visibleNotifications.length > 0 ? (

          /* Real notification list */
          <div className="notification-list">

            {visibleNotifications.map((notification) => {
              const username =
                notification.actor?.username || 'Someone'

              const avatar =
                notification.actor?.profilePicture

              const initial =
                username.charAt(0).toUpperCase()

              const color =
                avatarColors[notification.type] || 'purple'

              return (
                <article
                  className={`notification-item ${
                    !notification.isRead ? 'is-unread' : ''
                  }`}
                  key={notification._id}
                >

                  {/* User avatar */}
                  <div
                    className={`notification-avatar avatar-${color}`}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={`${username}'s profile`}
                      />
                    ) : (
                      initial
                    )}

                    <span
                      className={`notification-type-icon type-${notification.type}`}
                    >
                      {notificationIcons[notification.type] || '•'}
                    </span>
                  </div>

                  {/* Notification details */}
                  <div className="notification-content">

                    <p>
                      <strong>{username}</strong>{' '}
                      {notification.message ||
                        'interacted with your profile.'}
                    </p>

                    <span className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </span>

                  </div>

                  {/* Read status */}
                  <div className="notification-controls">

                    {!notification.isRead && (
                      <>
                        <span
                          className="unread-dot"
                          aria-label="Unread notification"
                        />

                        <button
                          type="button"
                          className="mark-read-button"
                          onClick={() =>
                            markAsRead(notification._id)
                          }
                          aria-label={`Mark notification from ${username} as read`}
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      </>
                    )}

                  </div>

                </article>
              )
            })}

          </div>

        ) : (

          /* Empty state */
          <div className="notifications-empty">

            <div className="notifications-empty-icon">♡</div>

            <h2>
              {filter === 'unread'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </h2>

            <p>
              {filter === 'unread'
                ? 'You have no unread notifications. Enjoy your day!'
                : 'When people interact with your posts or profile, you will see it here.'}
            </p>

            {filter === 'unread' && (
              <button
                type="button"
                className="show-all-button"
                onClick={() => setFilter('all')}
              >
                View all notifications
              </button>
            )}

          </div>
        )}

      </section>

      <p className="notifications-footer">
        You're all set to stay connected with your community.
      </p>

    </main>
  )
}

export default Notifications
