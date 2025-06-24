import React from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { logError } from '../utils/errorLogger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isCollapsed: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const formattedError = logError(error, 'ErrorBoundary')
    
    this.setState({
      error: formattedError,
      errorInfo: errorInfo,
      isCollapsed: false
    })

    // Reset error state after timeout for non-critical errors
    if (formattedError.type !== 'SERVER' && formattedError.type !== 'AUTH') {
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null })
      }, 10000)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))

    // Call onRetry prop if provided
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  handleReload = () => {
    // Save current scroll position
    const scrollPos = window.scrollY
    localStorage.setItem('errorBoundaryScrollPos', scrollPos.toString())
    
    window.location.reload()
  }

  handleCollapse = () => {
    this.setState(prevState => ({
      isCollapsed: !prevState.isCollapsed
    }))
  }

  componentDidMount() {
    // Restore scroll position after reload
    const savedScrollPos = localStorage.getItem('errorBoundaryScrollPos')
    if (savedScrollPos) {
      window.scrollTo(0, parseInt(savedScrollPos))
      localStorage.removeItem('errorBoundaryScrollPos')
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, isCollapsed } = this.state
      const { fallback: CustomFallback, className = '' } = this.props

      if (CustomFallback) {
        return <CustomFallback 
          error={error} 
          errorInfo={errorInfo}
          onRetry={this.handleRetry}
          retryCount={retryCount}
        />
      }

      if (isCollapsed) {
        return (
          <button
            onClick={this.handleCollapse}
            className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
            title="Show Error"
          >
            <ExclamationTriangleIcon className="h-6 w-6" />
          </button>
        )
      }

      return (
        <div className={`min-h-[200px] bg-gradient-to-br from-skin-bg via-skin-bg-accent/10 to-skin-bg flex items-center justify-center p-4 sm:p-6 animate-fade-in ${className}`}>
          <div className="max-w-lg w-full bg-skin-bg-accent/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-skin-border/50 shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative">
            <button
              onClick={this.handleCollapse}
              className="absolute top-2 right-2 text-skin-text-muted hover:text-skin-text p-2 rounded-lg transition-colors"
              title="Minimize"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="text-center">
              {/* Animated error icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-red-50 dark:bg-red-900/50 rounded-full p-4 mx-auto w-fit">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400 animate-pulse" />
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-skin-text mb-3 bg-gradient-to-r from-skin-text to-skin-text/80 bg-clip-text">
                {error?.title || 'Oops! Something went wrong'}
              </h1>
              <p className="text-skin-text-muted mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                {error?.message || 'We encountered an unexpected error. Please try again.'}
              </p>
              
              {import.meta.env.MODE === 'development' && (error?.details || errorInfo) && (
                <details className="mb-8 text-left group">
                  <summary className="cursor-pointer text-sm font-medium text-skin-text-muted mb-3 hover:text-skin-text transition-colors flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    Error Details (Development Mode)
                  </summary>
                  <div className="bg-red-50/50 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-xl p-4 backdrop-blur-sm">
                    <pre className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap overflow-auto max-h-40 font-mono leading-relaxed">
                      {JSON.stringify(error?.details, null, 2)}
                      {errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="space-y-4">
                {retryCount < 3 && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-skin-accent to-skin-accent/90 text-white rounded-xl hover:from-skin-accent/90 hover:to-skin-accent/80 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                    <span className="font-medium">
                      Try Again {retryCount > 0 && `(${retryCount}/3)`}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={this.handleReload}
                  className="w-full px-6 py-3 bg-skin-border/50 backdrop-blur-sm text-skin-text rounded-xl hover:bg-skin-border/70 transition-all duration-200 transform hover:scale-[1.02] border border-skin-border/30"
                >
                  <span className="font-medium">Reload Page</span>
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="w-full px-6 py-3 text-skin-text-muted hover:text-skin-text transition-colors duration-200 font-medium"
                >
                  ← Go Back
                </button>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-skin-accent/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-skin-accent/30 rounded-full animate-ping delay-1000"></div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 