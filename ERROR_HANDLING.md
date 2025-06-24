# Error Handling Documentation

This document describes the comprehensive error handling system implemented throughout the Synapse project for improved reliability and debugging.

## Overview

The error handling system includes:
- **Frontend**: React Error Boundaries, custom error hooks, and user-friendly error displays
- **Backend**: Global error middleware, custom error classes, and structured error responses
- **API**: Input validation, file type checking, and timeout handling
- **Logging**: Comprehensive error logging with external service integration

## Frontend Error Handling

### 1. Error Boundary Component
Location: `frontend/src/components/ErrorBoundary.jsx`

**Features:**
- Catches JavaScript errors anywhere in the component tree
- Provides user-friendly error messages
- Retry functionality (up to 3 attempts)
- Development-only error details
- Graceful fallback UI

**Usage:**
```jsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. useErrorHandler Hook
Location: `frontend/src/hooks/useErrorHandler.js`

**Features:**
- Consistent error state management
- User-friendly error message formatting
- Loading state integration
- Network error detection
- Async operation wrapper functions

**Usage:**
```javascript
const { error, handleError, clearError, executeWithErrorHandling, safeExecute } = useErrorHandler()

// Execute with error handling
await executeWithErrorHandling(async () => {
  return await someAsyncOperation()
}, 'operation context')

// Safe execution with fallback
const result = await safeExecute(async () => {
  return await someAsyncOperation()
}, 'operation context', fallbackValue)
```

### 3. Error Display
- Fixed position error notifications in top-right corner
- Auto-dismiss functionality
- Context-aware error messages
- Theme-aware styling

### 4. Error Logger Utility
Location: `frontend/src/utils/errorLogger.js`

**Features:**
- Centralized error logging
- Environment-aware logging levels
- External service integration (Google Analytics, custom endpoints)
- In-memory error storage for debugging
- User context tracking

**Usage:**
```javascript
import { logError, logWarn, withErrorHandling } from '../utils/errorLogger'

// Log an error
logError(error, 'user action', { userId: 123 })

// Wrap async operations
const result = await withErrorHandling(
  () => someAsyncOperation(),
  'async operation',
  fallbackValue
)
```

## Backend Error Handling

### 1. Global Error Middleware
Location: `backend/src/middleware/errorMiddleware.ts`

**Features:**
- Global error catching
- Custom error class support
- HTTP status code mapping
- Production vs development error details
- Structured error responses

### 2. Custom Error Classes
```typescript
// AppError for operational errors
throw new AppError('User-friendly message', 400)

// Built-in error type recognition:
// - ValidationError (400)
// - CastError (400) 
// - JsonWebTokenError (401)
// - TokenExpiredError (401)
// - File size errors (413)
// - Network errors (503)
```

### 3. Validation Helpers
```typescript
import { validateRequired, validateFile } from '../middleware/errorMiddleware'

// Validate required fields
validateRequired(req.body, ['name', 'email'])

// Validate file uploads
validateFile(file, ['image/jpeg', 'image/png'], 10 * 1024 * 1024) // 10MB limit
```

### 4. Async Handler Wrapper
```typescript
import { asyncHandler } from '../middleware/errorMiddleware'

export const yourController = asyncHandler(async (req, res, next) => {
  // Your code here - errors automatically caught and handled
})
```

### 5. Global Process Handlers
- Uncaught exception handling
- Unhandled promise rejection handling
- Graceful shutdown on SIGTERM

## API Error Handling

### Enhanced Input Validation
- File type validation (images: JPEG, PNG, GIF, WebP)
- File size limits (images: 10MB, audio: 50MB)
- URL format validation
- Diagram type validation
- Required field checking

### Network Resilience
- Request timeout handling (2 minutes)
- AbortController integration
- Retry logic for transient failures
- Connection error detection

### User-Friendly Error Messages
```javascript
// HTTP status code mapping:
400: 'Invalid request. Please check your input and try again.'
401: 'Authentication required. Please log in and try again.'
403: 'Access denied. You may not have permission to perform this action.'
413: 'File too large. Please use smaller files and try again.'
429: 'Too many requests. Please wait a moment and try again.'
500: 'Server error. Please try again later.'
503: 'Service temporarily unavailable. Please try again later.'
```

## Error Response Format

### Backend Error Response
```json
{
  "success": false,
  "error": "User-friendly error message",
  "statusCode": 400,
  "details": {
    // Development-only details
    "stack": "...",
    "originalMessage": "...",
    "context": "..."
  }
}
```

### Frontend Error State
```javascript
{
  originalError: Error,
  message: "User-friendly message",
  context: "operation context",
  timestamp: "2023-12-01T10:00:00.000Z"
}
```

## Error Categories

### 1. User Input Errors (400)
- Invalid file types
- Missing required fields
- File size exceeded
- Invalid URLs

### 2. Authentication Errors (401)
- Missing or invalid tokens
- Expired sessions
- Login required

### 3. Authorization Errors (403)
- Insufficient permissions
- Access denied

### 4. Not Found Errors (404)
- Missing resources
- Invalid endpoints

### 5. Server Errors (500)
- Database connection issues
- External API failures
- Unexpected application errors

### 6. Network Errors
- Connection timeouts
- DNS resolution failures
- Service unavailable

## Development vs Production

### Development Mode
- Full error details in console
- Stack traces visible
- Detailed error information in UI
- All errors logged to console

### Production Mode
- Sanitized error messages
- No stack traces in response
- External error tracking integration
- Generic fallback messages for security

## Best Practices

### 1. Error Handling Guidelines
- Always provide user-friendly error messages
- Log detailed error information for debugging
- Implement graceful fallbacks
- Use appropriate HTTP status codes
- Validate input at multiple layers

### 2. Error Prevention
- Input validation on both client and server
- File type and size checks
- Rate limiting
- Request timeouts
- Authentication verification

### 3. Error Recovery
- Retry mechanisms for transient failures
- Fallback values for non-critical operations
- Graceful degradation of functionality
- User guidance for resolution

### 4. Error Monitoring
- Centralized error logging
- External service integration
- User context tracking
- Performance impact monitoring

## Testing Error Handling

### Frontend Testing
- Test error boundary functionality
- Verify error message display
- Check retry mechanisms
- Validate fallback behaviors

### Backend Testing
- Test validation error responses
- Verify authentication errors
- Check file upload limits
- Test timeout handling

### Integration Testing
- End-to-end error scenarios
- Network failure simulation
- Invalid input testing
- Edge case coverage

## Configuration

### Environment Variables
```bash
# Backend
NODE_ENV=production|development
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_api_key

# Frontend
VITE_API_BASE_URL=http://localhost:3002
NODE_ENV=production|development
```

### External Service Integration
- Google Analytics error tracking
- Custom logging endpoints
- Error reporting services (Sentry, LogRocket)

This comprehensive error handling system ensures that the Synapse application provides a robust and user-friendly experience while maintaining detailed error tracking for debugging and monitoring purposes. 