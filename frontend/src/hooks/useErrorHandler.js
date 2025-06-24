import { useState, useCallback } from 'react'
import { logError, ERROR_TYPES } from '../utils/errorLogger'

export const useErrorHandler = (defaultError = null) => {
  const [error, setError] = useState(defaultError)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error, context = '') => {
    const formattedError = logError(error, context)
    setError(formattedError)

    // Auto-clear non-critical errors after 5 seconds
    if (formattedError.type !== ERROR_TYPES.SERVER && 
        formattedError.type !== ERROR_TYPES.AUTH) {
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithErrorHandling = useCallback(async (asyncFunction, context = 'operation') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await Promise.race([
        asyncFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), 30000)
        )
      ])
      setIsLoading(false)
      return result
    } catch (error) {
      setIsLoading(false)
      handleError(error, context)
      throw error // Re-throw so caller can handle if needed
    }
  }, [handleError])

  const safeExecute = useCallback(async (asyncFunction, context = 'operation', fallbackValue = null) => {
    try {
      return await executeWithErrorHandling(asyncFunction, context)
    } catch (error) {
      // Error is already handled by executeWithErrorHandling
      console.debug(`Safe execution failed for ${context}, using fallback:`, fallbackValue)
      return fallbackValue
    }
  }, [executeWithErrorHandling])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
    safeExecute
  }
}

export default useErrorHandler 