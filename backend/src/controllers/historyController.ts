import { Request, Response } from 'express'
import History from '../models/History'

// @desc    Get user history
// @route   GET /api/history
// @access  Private
const getHistory = async (req: Request, res: Response) => {
  const history = await History.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(history)
}

// @desc    Clear all user history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req: Request, res: Response) => {
  await History.deleteMany({ user: req.user._id })
  res.json({ message: 'All history items removed' })
}

// @desc    Delete a history item
// @route   DELETE /api/history/:id
// @access  Private
const deleteHistoryItem = async (req: Request, res: Response) => {
  const historyItem = await History.findById(req.params.id)

  if (historyItem) {
    // Check if the user owns the history item
    if (historyItem.user.toString() !== req.user._id.toString()) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }
    await historyItem.deleteOne()
    res.json({ message: 'History item removed' })
  } else {
    res.status(404).json({ message: 'History item not found' })
  }
}

export { getHistory, deleteHistoryItem, clearHistory } 