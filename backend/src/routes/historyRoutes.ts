import express from 'express'
import { getHistory, deleteHistoryItem } from '../controllers/historyController'
import { protect } from '../middleware/authMiddleware'
const router = express.Router()

router.route('/').get(protect, getHistory)
router.route('/:id').delete(protect, deleteHistoryItem)

export default router 