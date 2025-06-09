import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PasswordInput from '../components/PasswordInput'

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-skin-bg">
      <div className="max-w-md w-full bg-skin-bg-accent p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-extrabold text-skin-text text-center mb-6">Synapse</h1>
        <h2 className="text-2xl font-bold text-skin-text text-center mb-8">Create an Account</h2>
        {error && <p className="bg-red-500 text-white p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-skin-text">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-skin-bg border border-skin-border rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-skin-btn-primary focus:border-skin-btn-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-skin-text">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-skin-bg border border-skin-border rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-skin-btn-primary focus:border-skin-btn-primary"
            />
          </div>
          <PasswordInput
            label="Password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordInput
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-skin-btn-primary-text bg-skin-btn-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-skin-btn-primary"
            >
              Sign Up
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-skin-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-skin-text hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage 