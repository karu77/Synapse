import { Router } from 'express'
import { protect } from '../middleware/authMiddleware'
import { generateGraphAndSave } from '../controllers/graphController'
import multer from 'multer'

const router = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Generate graph from text (now requires auth)
router.post(
  '/generate',
  protect,
  upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 },
  ]),
  generateGraphAndSave
)

export default router 