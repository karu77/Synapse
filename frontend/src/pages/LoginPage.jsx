import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log in. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-skin-bg">
      <div className="max-w-md w-full bg-skin-bg-accent p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-extrabold text-skin-text text-center mb-6">Synapse</h1>
        <h2 className="text-2xl font-bold text-skin-text text-center mb-8">Login</h2>
        {error && <p className="bg-red-500 text-white p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div>
            <label className="block text-sm font-medium text-skin-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-skin-bg border border-skin-border rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-skin-btn-primary focus:border-skin-btn-primary"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-skin-btn-primary-text bg-skin-btn-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-skin-btn-primary"
            >
              Log In
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-skin-text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-skin-text hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage 