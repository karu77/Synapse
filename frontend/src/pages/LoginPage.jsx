import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import PasswordInput from '../components/PasswordInput'
import ThemeToggleButton from '../components/ThemeToggleButton'

const LoginPage = () => {
  const [email, setEmail] = useState('workhekarunesh@gmail.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-skin-bg">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <div className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-md rounded-full p-2 border border-white/20 dark:border-gray-700/30">
          <ThemeToggleButton />
        </div>
      </div>

      {/* Dynamic Background Based on Theme */}
      <div className={`absolute inset-0 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-orange-50 via-white to-yellow-50' 
          : 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900'
      }`}></div>
      <div className={`absolute inset-0 ${
        theme === 'light'
          ? 'bg-gradient-to-tl from-orange-100/20 via-yellow-50/30 to-white/40'
          : 'bg-gradient-to-tl from-blue-900/10 via-slate-800/20 to-gray-900/30'
      }`}></div>
      
      {/* Theme-aware Floating Elements */}
      <div className={`absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${
        theme === 'light' 
          ? 'bg-orange-200/20' 
          : 'bg-blue-400/8'
      }`}></div>
      <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${
        theme === 'light' 
          ? 'bg-yellow-200/15' 
          : 'bg-blue-500/5'
      }`}></div>
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-pulse delay-500 ${
        theme === 'light' 
          ? 'bg-orange-300/10' 
          : 'bg-blue-300/5'
      }`}></div>

      {/* Theme-aware Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${
            theme === 'light' ? 'rgba(251, 146, 60, 0.4)' : 'rgba(59, 130, 246, 0.4)'
          } 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glass Card */}
        <div className={`backdrop-blur-xl border rounded-3xl p-8 shadow-2xl ${
          theme === 'light'
            ? 'bg-white/90 border-skin-accent/20 shadow-skin-accent/10'
            : 'bg-white/15 border-white/25'
        }`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-gradient-to-r from-skin-accent to-skin-accent-dark">
              <span className="text-2xl">🕸️</span>
            </div>
            <h1 className={`text-4xl font-bold bg-clip-text text-transparent mb-2 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-gray-800 to-gray-600'
                : 'bg-gradient-to-r from-white to-gray-300'
            }`}>
              Synapse
            </h1>
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>Welcome back! Sign in to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 border rounded-xl text-sm backdrop-blur-sm ${
              theme === 'light'
                ? 'bg-red-100/80 border-red-300/60 text-red-700'
                : 'bg-red-500/20 border-red-500/30 text-red-200'
            }`}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-200'
              }`}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-skin-accent focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-white/80 border-skin-accent/30 text-gray-800 placeholder-gray-500'
                    : 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-200'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-skin-accent focus:border-transparent backdrop-blur-sm transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white/80 border-skin-accent/30 text-gray-800 placeholder-gray-500'
                      : 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                  }`}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-skin-accent focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-skin-accent to-skin-accent-dark hover:from-skin-accent-dark hover:to-skin-accent text-white"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold transition-colors duration-200 text-skin-accent hover:text-skin-accent-dark"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-8">
          <p className={`text-xs ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Transform your ideas into interactive knowledge graphs
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        /* Custom scrollbar for consistency */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}

export default LoginPage 