import jwt from 'jsonwebtoken'
import User from '../models/User'
import { Request, Response, NextFunction } from 'express'

interface DecodedToken {
  id: string
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as DecodedToken

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        res.status(401).json({ message: 'Not authorized, user not found' })
        return
      }

      next()
    } catch (error) {
      console.error(error)
      res.status(401).json({ message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' })
  }
}

export { protect } 