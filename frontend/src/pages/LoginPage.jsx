import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PasswordInput from '../components/PasswordInput'
import ErrorDisplay from '../components/ErrorDisplay'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

// Simple spinner component
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
)

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    document.body.classList.add('auth-bg')
    return () => {
      document.body.classList.remove('auth-bg')
    }
  }, [])

  const validate = () => {
    const newErrors = {}
    if (!email) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'
    return newErrors
  }
  
  const handleBlur = (field) => {
    const newErrors = { ...errors }
    const fields = { email, password };
    if (!field) { // validate all on submit
      Object.assign(newErrors, validate());
    } else if (!fields[field]) {
      newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
    } else {
      delete newErrors[field]
    }
    setErrors(newErrors)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background shapes */}
      <div
        className="auth-shape w-96 h-96 bg-skin-accent top-10 -left-40"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="auth-shape w-96 h-96 bg-skin-accent-light bottom-10 -right-40"
        style={{ animationDelay: '4s', animationDuration: '25s' }}
      />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-skin-text">Welcome Back</h1>
          <p className="text-skin-text-muted mt-2">
            Sign in to continue to Synapse
          </p>
        </div>

        <div className="auth-form-panel">
          <form onSubmit={handleSubmit} noValidate>
            {errors.form && <ErrorDisplay error={{ message: errors.form }} />}
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-skin-text-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                className={`w-full px-4 py-2 bg-skin-bg/80 border rounded-lg focus:outline-none focus:ring-2 transition text-black dark:text-white ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-skin-border focus:border-skin-accent focus:ring-skin-accent/50'
                }`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="mb-6">
                <PasswordInput
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={errors.password}
                />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-skin-accent to-skin-accent-light text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-skin-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-skin-accent hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 