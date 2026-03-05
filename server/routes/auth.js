const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { registerTourist } = require('../blockchain')
const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, identityHash, role, phone } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hashedPassword, identityHash, role, phone })
    await user.save()

    try { await registerTourist(name, identityHash) } catch { }

    res.status(201).json({ message: 'User registered', user: { id: user._id, name: user.name, phone: user.phone } })
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: 'Server error during registration', error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'User not found' })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' })
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, phone: user.phone } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name role identityHash _id phone');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

module.exports = router
