import express from 'express'
import {
  authUser,
  registerUser,
  deleteUser,
} from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'
const router = express.Router()

router.post('/login', authUser)
router.post('/', registerUser)
router.delete('/profile', protect, deleteUser)

export default router 