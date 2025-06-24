import { Request, Response, NextFunction } from 'express'

// Custom error class with additional properties
export class AppError extends Error {
  statusCode: number
  isOperational: boolean
  errorType: string
  details?: any

  constructor(message: string, statusCode: number = 500, errorType: string = 'UNKNOWN', details?: any) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.errorType = errorType
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

// Error types enum
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  TIMEOUT = 'TIMEOUT',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  GRAPH_PROCESSING = 'GRAPH_PROCESSING',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  console.error('Error caught by error handler:', {
    path: req.path,
    method: req.method,
    error: err,
    stack: err.stack,
    timestamp: new Date().toISOString()
  })

  let statusCode = 500
  let message = 'Internal Server Error'
  let errorType = ErrorType.UNKNOWN
  let details: any = null

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    errorType = err.errorType
    details = err.details
  } else {
    // Handle specific error types
    switch(err.name) {
      case 'ValidationError':
        statusCode = 400
        message = 'Validation Error'
        errorType = ErrorType.VALIDATION
        details = err.message
        break

      case 'CastError':
        statusCode = 400
        message = 'Invalid ID format'
        errorType = ErrorType.VALIDATION
        break

      case 'MongoError':
      case 'MongoServerError':
        if ((err as any).code === 11000) {
          statusCode = 409
          message = 'Duplicate field value'
          errorType = ErrorType.CONFLICT
        } else {
          statusCode = 500
          message = 'Database Error'
          errorType = ErrorType.DATABASE
        }
        break

      case 'JsonWebTokenError':
        statusCode = 401
        message = 'Invalid token'
        errorType = ErrorType.AUTHENTICATION
        break

      case 'TokenExpiredError':
        statusCode = 401
        message = 'Token expired'
        errorType = ErrorType.AUTHENTICATION
        break

      default:
        if (err.message.includes('File too large')) {
          statusCode = 413
          message = 'File too large'
          errorType = ErrorType.VALIDATION
        } else if (err.message.includes('timeout')) {
          statusCode = 408
          message = 'Request timeout'
          errorType = ErrorType.TIMEOUT
        } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
          statusCode = 503
          message = 'Service temporarily unavailable'
          errorType = ErrorType.NETWORK
        } else if (err.message.includes('rate limit')) {
          statusCode = 429
          message = 'Too many requests'
          errorType = ErrorType.RATE_LIMIT
        }
    }
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong on our end. Please try again later.'
    details = null
  } else if (process.env.NODE_ENV === 'development') {
    details = {
      stack: err.stack,
      name: err.name,
      originalMessage: err.message
    }
  }

  const errorResponse = {
    success: false,
    error: {
      type: errorType,
      message,
      statusCode,
      ...(details && { details })
    }
  }

  res.status(statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Not Found - ${req.originalUrl}`,
    404,
    ErrorType.NOT_FOUND
  )
  next(error)
}

// Validation helper
export const validateRequired = (fields: { [key: string]: any }, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !fields[field])
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      ErrorType.VALIDATION,
      { missingFields: missing }
    )
  }
}

// File validation helper
export const validateFile = (file: any, allowedTypes: string[], maxSize: number) => {
  if (!file) return

  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400,
      ErrorType.VALIDATION,
      { 
        allowedTypes,
        providedType: file.mimetype
      }
    )
  }

  if (file.size > maxSize) {
    throw new AppError(
      `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      413,
      ErrorType.VALIDATION,
      {
        maxSize,
        providedSize: file.size
      }
    )
  }
}

// Rate limiting error helper
export const createRateLimitError = (retryAfter: number) => {
  return new AppError(
    'Too many requests. Please try again later.',
    429,
    ErrorType.RATE_LIMIT,
    { retryAfter }
  )
}

// Graph processing error helper
export const createGraphError = (message: string, details?: any) => {
  return new AppError(
    message,
    400,
    ErrorType.GRAPH_PROCESSING,
    details
  )
} 