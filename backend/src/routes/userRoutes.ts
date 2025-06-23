import express from 'express'
import {
  authUser,
  registerUser,
  deleteUser,
  resetPassword,
  clearAllUsers,
} from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'
const router = express.Router()

router.post('/login', authUser)
router.post('/', registerUser)
router.delete('/profile', protect, deleteUser)
router.post('/reset-password', resetPassword)

// Development only route - clear all users and their data
if (process.env.NODE_ENV === 'development') {
  router.delete('/clear-all', clearAllUsers);
}

export default router 