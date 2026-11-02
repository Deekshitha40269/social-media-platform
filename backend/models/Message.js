
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'file'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Require either text or an attachment.
messageSchema.pre('validate', function () {
  if (!this.text?.trim() && !this.mediaUrl?.trim()) {
    this.invalidate(
      'text',
      'A message must contain text or an attachment.'
    )
  }
})

module.exports = mongoose.model('Message', messageSchema)
