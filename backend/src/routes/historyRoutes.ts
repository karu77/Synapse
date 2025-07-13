import express from 'express'
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
  updateHistoryName,
} from '../controllers/historyController'
import { protect } from '../middleware/authMiddleware'
const router = express.Router()

router.route('/').get(protect, getHistory).delete(protect, clearHistory)
router.route('/:id').delete(protect, deleteHistoryItem)
router.route('/:id/name').patch(protect, updateHistoryName)

export default router 