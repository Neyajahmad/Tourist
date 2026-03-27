const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['tourist', 'admin'], default: 'tourist' },
  phone: { type: String },
  identityHash: { type: String }
})

module.exports = mongoose.model('User', UserSchema)
