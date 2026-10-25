
import { useCallback, useEffect, useState } from 'react'
import './Messages.css'

const API_URL = 'http://localhost:5000/api'

function Messages({ token }) {
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const getCurrentUserId = () => {
    try {
      return JSON.parse(
        localStorage.getItem('socially_user') || 'null'
      )?._id
    } catch {
      return null
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const readResponse = async (response) => {
    const raw = await response.text()

    let data
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { message: raw || 'The server returned an unreadable response.' }
    }

    if (!response.ok) {
      throw new Error(
        `Request failed (${response.status}): ${
          data.message || data.error || 'Unknown server error'
        }`
      )
    }

    return data
  }

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/messages`, { headers })
      const data = await readResponse(response)

      setConversations(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  const loadMessages = useCallback(async (userId) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/messages/${userId}`, {
        headers,
      })

      const data = await readResponse(response)
      setMessages(Array.isArray(data) ? data : [])

      await loadConversations()
    } catch (err) {
      setMessages([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, loadConversations])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedUser?._id) {
      loadMessages(selectedUser._id)
    } else {
      setMessages([])
    }
  }, [selectedUser?._id, loadMessages])

  const searchUsers = async (event) => {
    event.preventDefault()

    if (!search.trim()) {
      setError('Enter a username to search.')
      return
    }

    setError('')
    setSearchResults([])

    try {
      const response = await fetch(
        `${API_URL}/users/search?username=${encodeURIComponent(search.trim())}`,
        { headers }
      )

      const data = await readResponse(response)
      const users = Array.isArray(data) ? data : data.users || []
      const currentUserId = getCurrentUserId()

      const filteredUsers = users.filter(
        (user) => user._id !== currentUserId
      )

      setSearchResults(filteredUsers)

      if (filteredUsers.length === 0) {
        setError('No other users found for that username.')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()

    if (!selectedUser?._id) {
      setError('Choose a user before sending a message.')
      return
    }

    if (!text.trim()) return

    setSending(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          receiver: selectedUser._id,
          text: text.trim(),
        }),
      })

      const sentMessage = await readResponse(response)

      setMessages((previous) => [...previous, sentMessage])
      setText('')

      await loadConversations()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const selectUser = (user) => {
    setError('')
    setSelectedUser(user)
    setSearchResults([])
    setSearch('')
  }

  return (
    <section className="messages-page">
      <header className="messages-heading">
        <div>
          <h2>Messages</h2>
          <p>Your private conversations on Socially</p>
        </div>
      </header>

      {error && (
        <div className="messages-error" role="alert">
          {error}
        </div>
      )}

      <form className="message-search" onSubmit={searchUsers}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find someone by username..."
          aria-label="Search users"
        />
        <button type="submit">Search</button>
      </form>

      {searchResults.length > 0 && (
        <div className="message-search-results">
          {searchResults.map((user) => (
            <button
              type="button"
              key={user._id}
              onClick={() => selectUser(user)}
            >
              <span className="message-avatar">
                {(user.username || '?')[0].toUpperCase()}
              </span>
              <span>{user.username}</span>
              <span className="message-start">Message</span>
            </button>
          ))}
        </div>
      )}

      <div className="messages-layout">
        <aside className="conversation-list">
          <h3>Your conversations</h3>

          {conversations.length === 0 ? (
            <p className="messages-empty">
              No conversations yet. Search for someone to start chatting!
            </p>
          ) : (
            conversations.map((conversation) => {
              const user = conversation.user

              if (!user?._id) return null

              return (
                <button
                  type="button"
                  key={user._id}
                  className={`conversation-item ${
                    selectedUser?._id === user._id ? 'selected' : ''
                  }`}
                  onClick={() => selectUser(user)}
                >
                  <span className="message-avatar">
                    {(user.username || '?')[0].toUpperCase()}
                  </span>

                  <span className="conversation-details">
                    <strong>{user.username}</strong>
                    <small>
                      {conversation.lastMessage?.text || 'Start chatting'}
                    </small>
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

        <div className="chat-panel">
          {!selectedUser ? (
            <div className="chat-placeholder">
              <span>💬</span>
              <h3>Your conversations, all in one place</h3>
              <p>Search for a user or choose a conversation to get started.</p>
            </div>
          ) : (
            <>
              <header className="chat-header">
                <span className="message-avatar">
                  {(selectedUser.username || '?')[0].toUpperCase()}
                </span>
                <strong>{selectedUser.username}</strong>
              </header>

              <div className="chat-messages">
                {loading ? (
                  <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="messages-empty">
                    No messages yet. Say hello! 👋
                  </p>
                ) : (
                  messages.map((message) => {
                    const senderId =
                      message.sender?._id || message.sender

                    const mine = senderId === getCurrentUserId()

                    return (
                      <div
                        key={message._id}
                        className={`message-bubble ${
                          mine ? 'mine' : 'theirs'
                        }`}
                      >
                        <p>{message.text}</p>
                        <small>
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )
                            : ''}
                        </small>
                      </div>
                    )
                  })
                )}
              </div>

              <form className="chat-compose" onSubmit={sendMessage}>
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
                  disabled={!text.trim() || sending}
                >
                  {sending ? 'Sending...' : 'Send'}
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
