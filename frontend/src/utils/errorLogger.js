import { getNodeColor } from './colors'

const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  GRAPH: 'GRAPH',
  UNKNOWN: 'UNKNOWN'
}

const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your internet connection.'
  },
  [ERROR_TYPES.AUTH]: {
    title: 'Authentication Error',
    message: 'Your session has expired. Please log in again.'
  },
  [ERROR_TYPES.VALIDATION]: {
    title: 'Validation Error',
    message: 'Please check your input and try again.'
  },
  [ERROR_TYPES.SERVER]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  },
  [ERROR_TYPES.CLIENT]: {
    title: 'Application Error',
    message: 'An unexpected error occurred. Please try refreshing the page.'
  },
  [ERROR_TYPES.GRAPH]: {
    title: 'Visualization Error',
    message: 'Unable to display the graph. Please try again.'
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.'
  }
}

const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN

  const message = error.message?.toLowerCase() || ''
  const status = error.status || error.statusCode || error.code

  if (message.includes('network') || message.includes('fetch') || status === 'NETWORK_ERROR') {
    return ERROR_TYPES.NETWORK
  }

  if (message.includes('unauthorized') || message.includes('forbidden') || status === 401 || status === 403) {
    return ERROR_TYPES.AUTH
  }

  if (message.includes('validation') || message.includes('invalid') || status === 400) {
    return ERROR_TYPES.VALIDATION
  }

  if (status >= 500 || message.includes('server')) {
    return ERROR_TYPES.SERVER
  }

  if (message.includes('graph') || message.includes('visualization') || message.includes('render')) {
    return ERROR_TYPES.GRAPH
  }

  if (error instanceof TypeError || error instanceof ReferenceError || error instanceof SyntaxError) {
    return ERROR_TYPES.CLIENT
  }

  return ERROR_TYPES.UNKNOWN
}

const formatError = (error, context = '') => {
  const errorType = getErrorType(error)
  const { title, message } = ERROR_MESSAGES[errorType]

  return {
    type: errorType,
    title,
    message: error.message || message,
    context,
    timestamp: new Date().toISOString(),
    details: import.meta.env.MODE === 'development' ? {
      stack: error.stack,
      componentStack: error.componentStack,
      code: error.code,
      status: error.status,
      originalError: error
    } : undefined
  }
}

const logError = (error, context = '') => {
  const formattedError = formatError(error, context)

  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    console.group(`🚨 Error in ${context || 'application'}`)
    console.error('Error details:', formattedError)
    console.error('Original error:', error)
    console.groupEnd()
  }

  // Log to analytics in production
  if (import.meta.env.MODE === 'production' && typeof window !== 'undefined') {
    if (window.gtag) {
      window.gtag('event', 'error', {
        error_type: formattedError.type,
        error_message: formattedError.message,
        error_context: context,
        error_timestamp: formattedError.timestamp
      })
    }
  }

  return formattedError
}

export { ERROR_TYPES, formatError, logError } 