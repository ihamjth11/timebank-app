const mongoose = require('mongoose')

// Attachments are stored as base64 data URLs and shown to OTHER users as links,
// images and audio. Only well-formed data URLs with safe types are accepted.
// This blocks javascript: links and HTML/SVG payloads that could run code in
// another person's browser.
const MAX_FILE_DATA_LENGTH = 3 * 1024 * 1024 // characters (about 2 MB of binary data)

const DATA_URL_PATTERN = /^data:([a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*)?((?:;[a-z0-9=._+-]+)*);base64,/i

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])

// Browsers sometimes label audio-only recordings as video/*
const EXTRA_VOICE_MIME_TYPES = new Set(['video/webm', 'video/mp4', 'video/ogg'])

const BLOCKED_FILE_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'text/xml',
  'application/xml'
])

// Returns the mime type ('' when none is given) or null when the value is not a base64 data URL
function readDataUrlMime(value) {
  const match = DATA_URL_PATTERN.exec(value)
  if (!match) return null
  return (match[1] || '').toLowerCase()
}

function isSafeAttachment(value) {
  const type = (this && this.messageType) || 'file'

  if (type === 'text') return !value // text messages carry no attachment
  if (!value || typeof value !== 'string') return false
  if (value.length > MAX_FILE_DATA_LENGTH) return false

  const mime = readDataUrlMime(value)
  if (mime === null) return false

  if (type === 'image') return IMAGE_MIME_TYPES.has(mime)
  if (type === 'voice') return mime.startsWith('audio/') || EXTRA_VOICE_MIME_TYPES.has(mime)
  if (type === 'file') return !BLOCKED_FILE_MIME_TYPES.has(mime)
  return false
}

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: '',
    maxlength: 5000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text'
  },
  fileData: {
    type: String,
    default: '',
    validate: {
      validator: isSafeAttachment,
      message: 'Invalid or unsafe attachment'
    }
  },
  fileName: {
    type: String,
    default: '',
    // Long names are cut instead of rejected so sending never fails because of a name
    set: (value) => (typeof value === 'string' ? value.slice(0, 255) : value)
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)