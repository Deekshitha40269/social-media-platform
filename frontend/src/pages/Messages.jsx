import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import './Messages.css'

const API_URL = 'https://socially-backend-v5ux.onrender.com/api'
const MAX_MEDIA_SIZE = 4 * 1024 * 1024

const EMOJIS = [
  '😀', '😂', '🥹', '😍', '🥰', '😘', '😊', '😉',
  '😭', '😎', '🥳', '🤗', '❤️', '💕', '💖', '🔥',
  '✨', '👍', '👏', '🙌', '🙏', '🎉', '💯', '😅',
  '🤔', '🥺', '💗', '🌸',
]

function Messages({ token }) {
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Edit and unsend states
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editText, setEditText] = useState('')
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [unsendingMessageId, setUnsendingMessageId] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const requestIdRef = useRef(0)

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(
        localStorage.getItem('socially_user') || 'null'
      )
      return user?._id || user?.id || null
    } catch {
      return null
    }
  }

  const getUserId = (user) => {
    if (!user) return null
    if (typeof user === 'string') return user
    return user._id || user.id || null
  }

  const getAvatar = (user) => {
    if (user?.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={`${user.username || 'User'} profile`}
          className="message-avatar-image"
        />
      )
    }

    return (user?.username || '?').charAt(0).toUpperCase()
  }

  const readResponse = async (response) => {
    const raw = await response.text()
    let data = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {
        message: raw || 'The server returned an unreadable response.',
      }
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed (${response.status}).`
      )
    }

    return data
  }

  const getConversationUser = (conversation) => {
    if (conversation?.user && typeof conversation.user === 'object') {
      return conversation.user
    }

    if (Array.isArray(conversation?.participants)) {
      const currentId = getCurrentUserId()

      return (
        conversation.participants.find(
          (user) => String(getUserId(user)) !== String(currentId)
        ) || null
      )
    }

    return null
  }

  const getLastMessageText = (conversation) => {
    const last = conversation?.lastMessage

    if (typeof last === 'string') return last
    if (!last) return 'Start chatting'

    if (last.messageType === 'image') {
      return `📷 ${last.text || 'Photo'}`
    }

    if (last.messageType === 'video') {
      return `🎥 ${last.text || 'Video'}`
    }

    if (last.messageType === 'file') {
      return `📎 ${last.text || 'Attachment'}`
    }

    return last.text || 'Start chatting'
  }

  const loadConversations = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await readResponse(response)

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.conversations)
          ? data.conversations
          : []

      setConversations(list)
    } catch (err) {
      setError(err.message || 'Could not load conversations.')
    }
  }, [token])

  const loadMessages = useCallback(
    async (userId) => {
      if (!userId || !token) return

      const requestId = ++requestIdRef.current

      setLoading(true)
      setError('')
      setMessages([])

      try {
        const response = await fetch(`${API_URL}/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await readResponse(response)

        if (requestId !== requestIdRef.current) return

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.messages)
            ? data.messages
            : []

        setMessages(list)
        await loadConversations()
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err.message || 'Could not load messages.')
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [token, loadConversations]
  )

  useEffect(() => {
    if (token) {
      loadConversations()
    } else {
      setConversations([])
      setMessages([])
      setSelectedUser(null)
      setShowUserSearch(true)
    }
  }, [token, loadConversations])

  useEffect(() => {
    const userId = getUserId(selectedUser)

    if (userId) {
      loadMessages(userId)
    } else {
      requestIdRef.current += 1
      setMessages([])
      setLoading(false)
    }
  }, [selectedUser, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages])

  const searchUsers = async (event) => {
    event.preventDefault()

    if (!search.trim()) {
      setError('Enter a username to search.')
      setSearchResults([])
      return
    }

    setSearching(true)
    setError('')
    setSearchResults([])

    try {
      const response = await fetch(
        `${API_URL}/users/search?username=${encodeURIComponent(search.trim())}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const data = await readResponse(response)

      const users = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
          ? data.users
          : []

      const currentId = getCurrentUserId()

      const filtered = users.filter(
        (user) => String(getUserId(user)) !== String(currentId)
      )

      setSearchResults(filtered)

      if (!filtered.length) {
        setError('No other users found for that username.')
      }
    } catch (err) {
      setError(err.message || 'Could not search for users.')
    } finally {
      setSearching(false)
    }
  }

  const handleAttachment = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (
      !file.type.startsWith('image/') &&
      !file.type.startsWith('video/')
    ) {
      setError('Please select an image or video.')
      return
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setError('Attachments must be 4 MB or smaller.')
      return
    }

    setError('')

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('Could not read the selected file.')
        return
      }

      setAttachment({
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        dataUrl: reader.result,
      })
    }

    reader.onerror = () => {
      setError('Could not read the selected file.')
    }

    reader.readAsDataURL(file)
  }

  const sendMessage = async (event) => {
    event.preventDefault()

    const receiverId = getUserId(selectedUser)
    const trimmedText = text.trim()

    if (!receiverId || (!trimmedText && !attachment) || sending) return

    setSending(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver: receiverId,
          text: trimmedText,
          messageType: attachment ? attachment.type : 'text',
          mediaUrl: attachment ? attachment.dataUrl : '',
        }),
      })

      const data = await readResponse(response)
      const sent = data.messageRecord || data.messageData || data

      setText('')
      setAttachment(null)
      setShowEmojiPicker(false)

      if (sent?._id) {
        setMessages((previous) => [...previous, sent])
        await loadConversations()
      } else {
        await loadMessages(receiverId)
      }
    } catch (err) {
      setError(
        err.message || 'Could not send your message. Please try again.'
      )
    } finally {
      setSending(false)
    }
  }

  // Start editing a message
  const startEditingMessage = (message) => {
    setEditingMessageId(message._id)
    setEditText(message.text || '')
    setOpenMessageMenuId(null)
    setError('')
  }

  // Cancel editing
  const cancelEditingMessage = () => {
    setEditingMessageId(null)
    setEditText('')
  }

  // Save edited message
  const saveEditedMessage = async (messageId) => {
    const cleanText = editText.trim()

    if (!cleanText) {
      setError('Message text cannot be empty.')
      return
    }

    if (cleanText.length > 2000) {
      setError('Message cannot exceed 2000 characters.')
      return
    }

    setSavingEdit(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      })

      const updatedMessage = await readResponse(response)

      setMessages((previous) =>
        previous.map((message) =>
          message._id === messageId ? updatedMessage : message
        )
      )

      setEditingMessageId(null)
      setEditText('')
      setOpenMessageMenuId(null)

      await loadConversations()
    } catch (err) {
      setError(err.message || 'Could not edit your message.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Unsend a message
  const unsendMessage = async (messageId) => {
    const confirmed = window.confirm(
      'Unsend this message? It will be removed from the conversation for both people.'
    )

    if (!confirmed) return

    setUnsendingMessageId(messageId)
    setError('')

    try {
      const response = await fetch(`${API_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await readResponse(response)

      setMessages((previous) =>
        previous.filter((message) => message._id !== messageId)
      )

      if (editingMessageId === messageId) {
        setEditingMessageId(null)
        setEditText('')
      }

      setOpenMessageMenuId(null)
      await loadConversations()
    } catch (err) {
      setError(err.message || 'Could not unsend your message.')
    } finally {
      setUnsendingMessageId(null)
    }
  }

  const selectUser = (user) => {
    setError('')
    setSelectedUser(user)
    setShowUserSearch(false)
    setSearchResults([])
    setSearch('')
    setAttachment(null)
    setShowEmojiPicker(false)
    setEditingMessageId(null)
    setEditText('')
    setOpenMessageMenuId(null)
  }

  const backToConversations = () => {
    setSelectedUser(null)
    setShowUserSearch(true)
    setSearchResults([])
    setSearch('')
    setMessages([])
    setError('')
    setAttachment(null)
    setShowEmojiPicker(false)
    setEditingMessageId(null)
    setEditText('')
    setOpenMessageMenuId(null)
  }

  // Format the time displayed below each message.
  const formatTime = (date) => {
    if (!date) return ''

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return ''

    return parsed.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Create a consistent date key to identify messages from the same day.
  const getDateKey = (date) => {
    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return ''

    const year = parsed.getFullYear()
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // Display TODAY, YESTERDAY, or a date in DD-MM-YYYY format.
  const formatDateLabel = (date) => {
    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return ''

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const messageDate = new Date(parsed)
    messageDate.setHours(0, 0, 0, 0)

    if (messageDate.getTime() === today.getTime()) return 'TODAY'
    if (messageDate.getTime() === yesterday.getTime()) return 'YESTERDAY'

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replaceAll('/', '-')
  }

  const currentUserId = getCurrentUserId()

  return (
    <section className="messages-page">
      {showUserSearch && (
        <div className="messages-heading">
          <h2>Messages</h2>
          <p>Your private conversations on Socially</p>
        </div>
      )}

      {error && (
        <div className="messages-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {showUserSearch && (
        <form className="message-search" onSubmit={searchUsers}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find someone by username..."
            aria-label="Search users"
            disabled={searching}
          />

          <button type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      )}

      {showUserSearch && searchResults.length > 0 && (
        <div className="message-search-results">
          {searchResults.map((user) => (
            <button
              type="button"
              key={getUserId(user)}
              onClick={() => selectUser(user)}
            >
              <span className="message-avatar">{getAvatar(user)}</span>
              <span>{user.username || 'User'}</span>
              <span className="message-start">Message →</span>
            </button>
          ))}
        </div>
      )}

      <div className={`messages-layout ${selectedUser ? 'chat-open' : ''}`}>
        {!selectedUser && (
          <aside className="conversation-list">
            <div className="conversation-list-heading">
              <h3>Your conversations</h3>
            </div>

            {conversations.length === 0 ? (
              <p className="messages-empty">
                No conversations yet. Search for someone to start chatting!
              </p>
            ) : (
              conversations.map((conversation, index) => {
                const user = getConversationUser(conversation)
                const userId = getUserId(user)

                if (!userId) return null

                return (
                  <button
                    type="button"
                    key={userId || conversation._id || index}
                    className="conversation-item"
                    onClick={() => selectUser(user)}
                  >
                    <span className="message-avatar">
                      {getAvatar(user)}
                    </span>

                    <span className="conversation-details">
                      <strong>{user.username || 'User'}</strong>
                      <small>{getLastMessageText(conversation)}</small>
                    </span>

                    {conversation.unreadCount > 0 && (
                      <span className="unread-count">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </aside>
        )}

        <div className="chat-panel">
          {!selectedUser ? (
            <div className="chat-placeholder">
              <span>💬</span>
              <h3>Your conversations, all in one place</h3>
              <p>
                Search for a user or choose a conversation to get started.
              </p>
            </div>
          ) : (
            <>
              <header className="chat-header">
                <button
                  type="button"
                  className="back-to-conversations chat-back-button"
                  onClick={backToConversations}
                  aria-label="Back to conversations"
                  title="Back to conversations"
                >
                  ←
                </button>

                <span className="message-avatar">
                  {getAvatar(selectedUser)}
                </span>

                <div className="chat-user-details">
                  <strong>{selectedUser.username || 'User'}</strong>
                  <small>Chat on Socially</small>
                </div>
              </header>

              <div className="chat-messages" aria-live="polite">
                {loading ? (
                  <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="messages-empty">
                    No messages yet. Say hello! 👋
                  </p>
                ) : (
                  messages.map((message, index) => {
                    const senderId = getUserId(message.sender)
                    const mine =
                      String(senderId) === String(currentUserId)
                    const type = message.messageType || 'text'

                    const currentDateKey = getDateKey(message.createdAt)
                    const previousDateKey =
                      index > 0
                        ? getDateKey(messages[index - 1].createdAt)
                        : null

                    const showDateSeparator =
                      currentDateKey !== previousDateKey

                    return (
                      <Fragment key={message._id || `${senderId}-${index}`}>
                        {showDateSeparator && currentDateKey && (
                          <div className="message-date-separator">
                            <span>
                              {formatDateLabel(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`message-bubble ${mine ? 'mine' : 'theirs'}`}
                        >
                          {mine && type === 'text' && (
                            <div className="message-actions">
                              <button
                                type="button"
                                className="message-menu-trigger"
                                aria-label="Message options"
                                title="Message options"
                                onClick={() =>
                                  setOpenMessageMenuId((previous) =>
                                    previous === message._id
                                      ? null
                                      : message._id
                                  )
                                }
                                disabled={
                                  savingEdit || Boolean(unsendingMessageId)
                                }
                              >
                                ⋯
                              </button>

                              {openMessageMenuId === message._id && (
                                <div className="message-actions-menu">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditingMessage(message)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="message-unsend-option"
                                    onClick={() =>
                                      unsendMessage(message._id)
                                    }
                                    disabled={
                                      unsendingMessageId === message._id
                                    }
                                  >
                                    {unsendingMessageId === message._id
                                      ? 'Unsending...'
                                      : 'Unsend'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {message.mediaUrl && type === 'image' && (
                            <img
                              src={message.mediaUrl}
                              alt="Shared attachment"
                              className="message-media-image"
                              loading="lazy"
                            />
                          )}

                          {message.mediaUrl && type === 'video' && (
                            <video
                              src={message.mediaUrl}
                              className="message-media-video"
                              controls
                              preload="metadata"
                            />
                          )}

                          {message.mediaUrl && type === 'file' && (
                            <a
                              href={message.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📎 Open attachment
                            </a>
                          )}

                          {editingMessageId === message._id ? (
                            <div className="message-edit-box">
                              <textarea
                                value={editText}
                                onChange={(event) =>
                                  setEditText(event.target.value)
                                }
                                maxLength={2000}
                                aria-label="Edit message"
                                autoFocus
                              />

                              <div className="message-edit-buttons">
                                <button
                                  type="button"
                                  onClick={cancelEditingMessage}
                                  disabled={savingEdit}
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    saveEditedMessage(message._id)
                                  }
                                  disabled={!editText.trim() || savingEdit}
                                >
                                  {savingEdit ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            message.text && (
                              <p className="message-text">{message.text}</p>
                            )
                          )}

                          <small className="message-time">
                            {message.edited ? 'Edited · ' : ''}
                            {formatTime(message.createdAt)}
                            {mine && message.read ? ' · Seen' : ''}
                          </small>
                        </div>
                      </Fragment>
                    )
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {attachment && (
                <div className="message-attachment-preview">
                  <div>
                    <strong>
                      {attachment.type === 'image' ? '📷 Photo' : '🎥 Video'}
                    </strong>
                    <small>{attachment.name}</small>
                  </div>

                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.dataUrl}
                      alt="Attachment preview"
                    />
                  ) : (
                    <video
                      src={attachment.dataUrl}
                      controls
                      preload="metadata"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    aria-label="Remove attachment"
                    disabled={sending}
                  >
                    ✕
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="message-emoji-picker">
                  {EMOJIS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() =>
                        setText((previous) => previous + emoji)
                      }
                      aria-label={`Insert ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form className="chat-compose" onSubmit={sendMessage}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleAttachment}
                  hidden
                />

                <button
                  type="button"
                  className="chat-tool-button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach a photo or video"
                  title="Attach photo or video"
                  disabled={sending}
                >
                  📎
                </button>

                <button
                  type="button"
                  className="chat-tool-button"
                  onClick={() =>
                    setShowEmojiPicker((previous) => !previous)
                  }
                  aria-label="Toggle emoji picker"
                  title="Emojis"
                  disabled={sending}
                >
                  😊
                </button>

                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write a message..."
                  maxLength={2000}
                  aria-label="Write a message"
                  disabled={sending}
                />

                <button
                  type="submit"
                  disabled={(!text.trim() && !attachment) || sending}
                >
                  {sending ? 'Sending...' : 'Send ➤'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default Messages