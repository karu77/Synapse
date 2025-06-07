import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectDB from './config/db'
import userRoutes from './routes/userRoutes'
import historyRoutes from './routes/historyRoutes'
import { protect } from './middleware/authMiddleware'
import { generateGraphAndSave } from './controllers/graphController'
import multer from 'multer'

// Check for essential environment variables and exit if not found
if (!process.env.GEMINI_API_KEY || !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: Missing GEMINI_API_KEY or JWT_SECRET in .env file.')
  process.exit(1)
}

connectDB()

const app = express()
const port = process.env.PORT || 3000

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Explicitly configure CORS to be more permissive for production
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
)

app.use(express.json())

// Add a simple root route for health checks and to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Synapse Backend API is running.' })
})

// API Routes
app.use('/api/users', userRoutes)
app.use('/api/history', historyRoutes)

// Generate graph from text (now requires auth)
app.post(
  '/api/generate-graph',
  protect,
  upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 },
  ]),
  generateGraphAndSave
)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
}) 