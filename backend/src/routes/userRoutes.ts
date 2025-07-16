import express from 'express'
import {
  authUser,
  registerUser,
  deleteUser,
  resetPassword,
  clearAllUsers,
  markTutorialSeen,
  sendVerificationEmail,
  verifyEmailOTP,
} from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'
const router = express.Router()

router.post('/login', authUser)
router.post('/', registerUser)
router.delete('/profile', protect, deleteUser)
router.post('/reset-password', resetPassword)
router.patch('/tutorial', protect, markTutorialSeen)

// Email verification routes
router.post('/send-verification', sendVerificationEmail)
router.post('/verify-email', verifyEmailOTP)

// Development only route - clear all users and their data
if (process.env.NODE_ENV === 'development') {
  router.delete('/clear-all', clearAllUsers);
}

export default router 