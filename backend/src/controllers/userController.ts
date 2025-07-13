import { Request, Response } from 'express'
import User from '../models/User'
import History from '../models/History'
import generateToken from '../utils/generateToken'

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  // Check if email and password are provided
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' })
    return
  }

  // Basic email format validation
  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Please enter a valid email address' })
    return
  }

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400).json({ message: 'User already exists' })
    return
  }

  try {
    const user = await User.create({
      email,
      password,
      isVerified: true, // Auto-verify users
    })

    if (user) {
      res.status(201).json({
        message: 'User registered successfully.',
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
  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  user.hasSeenTutorial = true
  await user.save()
  res.json({ message: 'Tutorial marked as seen', hasSeenTutorial: true })
}

// @desc    Clear all users (DEV ONLY)
// @route   DELETE /api/users/clear-all
// @access  Private/Admin
const clearAllUsers = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'This action is only available in development mode' });
  }

  try {
    await User.deleteMany({});
    await History.deleteMany({});
    res.json({ message: 'All users and their data have been cleared' });
  } catch (error: unknown) {
    console.error('Error clearing users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error clearing users', error: errorMessage });
  }
};

export { registerUser, authUser, deleteUser, resetPassword, markTutorialSeen, clearAllUsers } 