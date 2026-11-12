
const express = require('express')
const mongoose = require('mongoose')
const Message = require('../models/Message')
const User = require('../models/User')
const Notification = require('../models/Notification')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

// Log requests before authentication to diagnose failures
router.use((req, res, next) => {
  console.log(`[Messages] ${req.method} ${req.originalUrl}`)
  next()
})

// Send a text or media message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const senderId = req.userId
    const { receiver, text, messageType, mediaUrl } = req.body || {}

    const cleanText =
      typeof text === 'string' ? text.trim() : ''

    const cleanMediaUrl =
      typeof mediaUrl === 'string' ? mediaUrl.trim() : ''

    const type = messageType || 'text'

    if (!senderId) {
      return res.status(401).json({
        message: 'Authentication failed: user ID not found.',
      })
    }

    if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({
        message: 'Please provide a valid receiver ID.',
      })
    }

    if (senderId.toString() === receiver.toString()) {
      return res.status(400).json({
        message: 'You cannot send a message to yourself.',
      })
    }

    if (!['text', 'image', 'video', 'file'].includes(type)) {
      return res.status(400).json({
        message: 'Invalid message type.',
      })
    }

    if (cleanText.length > 2000) {
      return res.status(400).json({
        message: 'Message cannot exceed 2000 characters.',
      })
    }

    if (!cleanText && !cleanMediaUrl) {
      return res.status(400).json({
        message: 'Add text or an attachment before sending.',
      })
    }

    if (type === 'text' && !cleanText) {
      return res.status(400).json({
        message: 'Text messages cannot be empty.',
      })
    }

    if (type !== 'text' && !cleanMediaUrl) {
      return res.status(400).json({
        message: 'The attachment is missing.',
      })
    }

    const recipient = await User.findById(receiver)

    if (!recipient) {
      return res.status(404).json({
        message: 'Recipient not found.',
      })
    }

    const message = await Message.create({
      sender: senderId,
      receiver,
      text: cleanText,
      messageType: type,
      mediaUrl: cleanMediaUrl,
    })

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')

    // Create notification for the recipient
    try {
      await Notification.create({
        recipient: receiver,
        actor: senderId,
        type: 'message',
        message: 'sent you a message',
      })
    } catch (notificationError) {
      console.error(
        'Message notification error:',
        notificationError
      )
    }

    return res.status(201).json(populatedMessage)
  } catch (error) {
    console.error('Send message error:', error.stack || error)

    return res.status(500).json({
      message: 'Failed to send message.',
    })
  }
})

// Edit an existing text message
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId
    const { id } = req.params
    const { text } = req.body || {}

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Authentication failed: user ID not found.',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid message ID.',
      })
    }

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        message: 'Message text cannot be empty.',
      })
    }

    const cleanText = text.trim()

    if (cleanText.length > 2000) {
      return res.status(400).json({
        message: 'Message cannot exceed 2000 characters.',
      })
    }

    const message = await Message.findOne({
      _id: id,
      sender: currentUserId,
      messageType: 'text',
    })

    if (!message) {
      return res.status(404).json({
        message: 'Message not found or you cannot edit this message.',
      })
    }

    message.text = cleanText
    message.edited = true

    await message.save()

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')

    return res.json(updatedMessage)
  } catch (error) {
    console.error('Edit message error:', error.stack || error)

    return res.status(500).json({
      message: 'Failed to edit message.',
    })
  }
})

// Unsend an existing message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId
    const { id } = req.params

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Authentication failed: user ID not found.',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid message ID.',
      })
    }

    const deletedMessage = await Message.findOneAndDelete({
      _id: id,
      sender: currentUserId,
    })

    if (!deletedMessage) {
      return res.status(404).json({
        message: 'Message not found or you cannot unsend this message.',
      })
    }

    return res.json({
      message: 'Message unsent successfully.',
      messageId: id,
    })
  } catch (error) {
    console.error('Unsend message error:', error.stack || error)

    return res.status(500).json({
      message: 'Failed to unsend message.',
    })
  }
})

// Get conversation with another user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId
    const { userId } = req.params

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Authentication failed: user ID not found.',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID.',
      })
    }

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        message: 'You cannot open a conversation with yourself.',
      })
    }

    const otherUser = await User.findById(userId)

    if (!otherUser) {
      return res.status(404).json({
        message: 'User not found.',
      })
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')

    // Mark incoming messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        read: false,
      },
      { $set: { read: true } }
    )

    return res.json(messages)
  } catch (error) {
    console.error('Load conversation error:', error.stack || error)

    return res.status(500).json({
      message: 'Failed to load conversation.',
    })
  }
})

// Get all conversations for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Authentication failed: user ID not found.',
      })
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')

    const conversations = new Map()
    const currentId = currentUserId.toString()

    for (const message of messages) {
      if (!message.sender || !message.receiver) continue

      const senderId = message.sender._id.toString()
      const receiverId = message.receiver._id.toString()

      const otherUser =
        senderId === currentId
          ? message.receiver
          : message.sender

      const otherUserId = otherUser._id.toString()

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
        })
      }

      if (receiverId === currentId && !message.read) {
        conversations.get(otherUserId).unreadCount += 1
      }
    }

    return res.json(Array.from(conversations.values()))
  } catch (error) {
    console.error('Load conversations error:', error.stack || error)

    return res.status(500).json({
      message: 'Failed to load conversations.',
    })
  }
})

module.exports = router
