import { Request, Response } from 'express'
import User from '../models/User'
import History from '../models/History'
import generateToken from '../utils/generateToken'
import crypto from 'crypto'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

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

  const verificationToken = crypto.randomBytes(20).toString('hex')
  const verificationTokenExpires = new Date(Date.now() + 3600000) // 1 hour

  const user = await User.create({
    email,
    password,
    verificationToken,
    verificationTokenExpires,
  })

  if (user) {
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email/${verificationToken}`

    const msg = {
      to: email,
      from: 'noreply@yourdomain.com', // Your verified sender email
      subject: 'Verify Your Synapse Account',
      html: `
        <p>Hello,</p>
        <p>Thank you for registering with Synapse. Please click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not register for an account, please ignore this email.</p>
      `,
    }

    try {
      await sgMail.send(msg)
      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        email: user.email,
      })
    } catch (sendgridError) {
      console.error('SendGrid Email Error:', sendgridError)
      // Optionally, delete the user if email sending fails critically
      // await user.deleteOne(); 
      res.status(500).json({ message: 'Failed to send verification email. Please try again later.' })
    }
  } else {
    res.status(400).json({ message: 'Invalid user data' })
  }
}

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) {
      res.status(401).json({ message: 'Email not verified. Please check your inbox for a verification link.' })
      return
    }
    res.json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id.toString()),
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

// @desc    Verify user email
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  })

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token.' })
  }

  user.isVerified = true
  user.verificationToken = undefined
  user.verificationTokenExpires = undefined

  await user.save()

  res.status(200).json({ message: 'Email verified successfully. You can now log in.' })
}

export { registerUser, authUser, deleteUser, resetPassword, clearAllUsers, verifyEmail } 