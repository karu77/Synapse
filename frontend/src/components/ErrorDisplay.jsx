import React from 'react'
import PropTypes from 'prop-types'

const ErrorDisplay = ({ error, className = '' }) => {
  if (!error) return null

  return (
    <div className={`text-red-600 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 backdrop-blur-sm ${className}`}>
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-medium mb-1">{error.title || 'Error'}</h3>
          <p className="text-sm">{error.message}</p>
          {error.details && import.meta.env.MODE === 'development' && (
            <pre className="mt-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

ErrorDisplay.propTypes = {
  error: PropTypes.shape({
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    details: PropTypes.any
  }),
  className: PropTypes.string
}

export default ErrorDisplay 