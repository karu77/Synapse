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

// Ensure the frontend URL is set in production for CORS to work correctly.
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('FATAL ERROR: FRONTEND_URL environment variable is not set for production.')
  process.exit(1)
}

connectDB()

const app = express()
const port = process.env.PORT || 3000

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage })

// More secure CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL] // Your production frontend URL is now required
    : ['http://localhost:5173', 'http://127.0.0.1:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`
        console.error(msg)
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies to be sent
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