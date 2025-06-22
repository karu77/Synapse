import { Request, Response } from 'express'
import User from '../models/User'
import History from '../models/History'
import generateToken from '../utils/generateToken'

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400).json({ message: 'User already exists' })
    return
  }

  const user = await User.create({
    name,
    email,
    password,
  })

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()),
    })
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
    res.json({
      _id: user._id,
      name: user.name,
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

export { registerUser, authUser, deleteUser } 