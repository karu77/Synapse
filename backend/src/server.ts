import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectDB from './config/db'
import userRoutes from './routes/userRoutes'
import historyRoutes from './routes/historyRoutes'
import graphRoutes from './routes/graphRoutes'
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

// More secure and flexible CORS configuration
const productionOrigins: (string | RegExp)[] = [
  /^https:\/\/synapse-.*-karu77s-projects\.vercel\.app$/, // Regex for Vercel preview URLs
]
if (process.env.FRONTEND_URL) {
  productionOrigins.push(process.env.FRONTEND_URL) // Main Vercel production URL
}

const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? productionOrigins : developmentOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent
}

// Log the effective CORS origins being used for easier debugging
console.log('CORS enabled for origins:', corsOptions.origin)

app.use(cors(corsOptions))

app.use(express.json())

// Add a simple root route for health checks and to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Synapse Backend API is running.' })
})

// API Routes
app.use('/api/users', userRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/graph', graphRoutes)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
}) 