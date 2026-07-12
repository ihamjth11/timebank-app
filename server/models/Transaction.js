const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  amount: {
    type: Number,
    default: 1
  }
}, { timestamps: true })

module.exports = mongoose.model('Transaction', transactionSchema)