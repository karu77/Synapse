import { Request, Response } from 'express'
import User from '../models/User'
import History from '../models/History'
import generateToken from '../utils/generateToken'
import { sendVerificationEmail, verifyOTP, isEmailVerified, markEmailAsVerified } from '../services/emailService'

// @desc    Send verification email
// @route   POST /api/users/send-verification
// @access  Public
const sendVerificationEmailController = async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }

  // Basic email format validation
  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' })
  }

  // Check if user already exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    return res.status(400).json({ message: 'User already exists with this email' })
  }

  try {
    const result = await sendVerificationEmail(email)
    
    if (result.success) {
      res.json({ message: result.message })
    } else {
      res.status(500).json({ message: result.message })
    }
  } catch (error) {
    console.error('Error sending verification email:', error)
    res.status(500).json({ message: 'Failed to send verification email' })
  }
}

// @desc    Verify email OTP
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmailOTPController = async (req: Request, res: Response) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' })
  }

  try {
    const result = verifyOTP(email, otp)
    
    if (result.success) {
      markEmailAsVerified(email)
      res.json({ message: result.message })
    } else {
      res.status(400).json({ message: result.message })
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    res.status(500).json({ message: 'Failed to verify OTP' })
  }
}

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  // Check if all required fields are provided
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are required' })
    return
  }

  // Basic email format validation
  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Please enter a valid email address' })
    return
  }

  // Check if email is verified
  if (!isEmailVerified(email)) {
    res.status(400).json({ message: 'Please verify your email address first' })
    return
  }

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400).json({ message: 'User already exists' })
    return
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
      isVerified: true, // Auto-verify users
    })

    if (user) {
      res.status(201).json({
        message: 'User registered successfully.',
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString()),
        hasSeenTutorial: user.hasSeenTutorial,
      })
    } else {
      res.status(400).json({ message: 'Invalid user data' })
    }
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(400).json({ message: 'Error creating user', error: errorMessage })
  }
}

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()),
      hasSeenTutorial: user.hasSeenTutorial,
    })
  } else {
    res.status(401).json({ message: 'Invalid email or password' })
  }
}

// @desc    Delete user profile
// @route   DELETE /api/users/profile
// @access  Private
const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id)

  if (user) {
    await History.deleteMany({ user: user._id })
    await user.deleteOne()
    res.json({ message: 'User removed' })
  } else {
    res.status(404).json({ message: 'User not found' })
  }
}

// @desc    Dev-only: Reset user password by email
// @route   POST /api/users/reset-password
// @access  Public (for dev only)
const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required.' })
  }
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }
  user.password = newPassword
  await user.save()
  res.json({ message: 'Password has been reset successfully.' })
}

// @desc    Mark tutorial as seen
// @route   PATCH /api/users/tutorial
// @access  Private
const markTutorialSeen = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
    if (user) {
      user.hasSeenTutorial = true
      await user.save()
      res.json({ message: 'Tutorial marked as seen' })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    console.error('Error marking tutorial as seen:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// @desc    Dev-only: Clear all users and their data
// @route   DELETE /api/users/clear-all
// @access  Public (for dev only)
const clearAllUsers = async (req: Request, res: Response) => {
  try {
    await History.deleteMany({})
    await User.deleteMany({})
    res.json({ message: 'All users and their data cleared' })
  } catch (error) {
    console.error('Error clearing all users:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export {
  registerUser,
  authUser,
  deleteUser,
  resetPassword,
  markTutorialSeen,
  clearAllUsers,
  sendVerificationEmailController as sendVerificationEmail,
  verifyEmailOTPController as verifyEmailOTP,
} 