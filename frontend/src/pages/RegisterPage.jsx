import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { sendVerificationEmail, verifyEmailOTP } from '../services/api'
import PasswordInput from '../components/PasswordInput'
import ErrorDisplay from '../components/ErrorDisplay'
import { ArrowRightIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// Simple spinner component
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
)

const RegisterPage = () => {
  const [step, setStep] = useState(1) // 1: email, 2: OTP, 3: registration
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.classList.add('auth-bg')
    return () => {
      document.body.classList.remove('auth-bg')
    }
  }, [])

  const validateEmail = () => {
    const newErrors = {}
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid'
    }
    return newErrors
  }

  const validateOTP = () => {
    const newErrors = {}
    if (!otp) {
      newErrors.otp = 'OTP is required'
    } else if (otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits'
    }
    return newErrors
  }

  const validateRegistration = () => {
    const newErrors = {}
    if (!name) {
      newErrors.name = 'Name is required'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    return newErrors
  }

  const handleSendVerificationEmail = async (e) => {
    e.preventDefault()
    setErrors({})
    const validationErrors = validateEmail()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await sendVerificationEmail(email)
      setIsEmailSent(true)
      setStep(2)
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setErrors({})
    const validationErrors = validateOTP()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await verifyEmailOTP(email, otp)
      setIsEmailVerified(true)
      setStep(3)
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      await sendVerificationEmail(email)
      setErrors({})
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const validationErrors = validateRegistration()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await register(name, email, password)
      navigate('/app')
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <form onSubmit={handleSendVerificationEmail} noValidate>
      {errors.form && <ErrorDisplay error={{ title: "Registration Error", message: errors.form }} />}
      
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-skin-text-muted mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-skin-accent to-skin-accent-light text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>Sending Verification...</span>
          </>
        ) : (
          <>
            <EnvelopeIcon className="h-5 w-5" />
            <span>Send Verification Email</span>
          </>
        )}
      </button>
    </form>
  )

  const renderStep2 = () => (
    <form onSubmit={handleVerifyOTP} noValidate>
      {errors.form && <ErrorDisplay error={{ title: "Verification Error", message: errors.form }} />}
      
      <div className="mb-6">
        <label htmlFor="otp" className="block text-sm font-medium text-skin-text-muted mb-2">
          Verification Code
        </label>
        <input
          type="text"
          id="otp"
          name="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          className={`w-full px-4 py-2 bg-skin-bg/80 border rounded-lg focus:outline-none focus:ring-2 transition text-black dark:text-white text-center text-lg tracking-widest ${
            errors.otp
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-skin-border focus:border-skin-accent focus:ring-skin-accent/50'
          }`}
          required
        />
        {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
        <p className="text-xs text-skin-text-muted mt-2">
          We sent a verification code to {email}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-skin-accent to-skin-accent-light text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 mb-4"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5" />
            <span>Verify Email</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleResendOTP}
        disabled={isLoading}
        className="w-full text-skin-accent hover:text-skin-accent-light transition-colors text-sm"
      >
        Didn't receive the code? Resend
      </button>
    </form>
  )

  const renderStep3 = () => (
    <form onSubmit={handleSubmit} noValidate>
      {errors.form && <ErrorDisplay error={{ title: "Registration Error", message: errors.form }} />}
      
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-skin-text-muted mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className={`w-full px-4 py-2 bg-skin-bg/80 border rounded-lg focus:outline-none focus:ring-2 transition text-black dark:text-white ${
            errors.name
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-skin-border focus:border-skin-accent focus:ring-skin-accent/50'
          }`}
          required
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      
      <div className="mb-4">
        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
      </div>

      <div className="mb-6">
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
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
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRightIcon className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Verify Your Email'
      case 2:
        return 'Enter Verification Code'
      case 3:
        return 'Create Your Account'
      default:
        return 'Create Account'
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return 'Enter your email address to receive a verification code'
      case 2:
        return 'Enter the 6-digit code sent to your email'
      case 3:
        return 'Complete your account setup'
      default:
        return 'Join Synapse and start visualizing your ideas'
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
          <h1 className="text-4xl font-bold text-skin-text">{getStepTitle()}</h1>
          <p className="text-skin-text-muted mt-2">
            {getStepDescription()}
          </p>
        </div>

        <div className="auth-form-panel">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <p className="text-center text-sm text-skin-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-skin-accent hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage 