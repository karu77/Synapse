import { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'
import { updateTutorialSeen } from '../services/api';

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider rendered');
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'))
      console.log('AuthContext useEffect, userInfo from localStorage:', userInfo)
      if (userInfo) {
        setUser(userInfo)
      }
    } catch {
      localStorage.removeItem('userInfo')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/users/login', { email, password })
      localStorage.setItem('userInfo', JSON.stringify(data))
      setUser(data)
      return data
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different types of errors
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message || error.response.data?.error
        
        switch (status) {
          case 401:
            throw new Error(message || 'Invalid email or password. Please check your credentials and try again.')
          case 404:
            throw new Error('User not found. Please check your email address or create a new account.')
          case 429:
            throw new Error('Too many login attempts. Please wait a moment and try again.')
          case 500:
            throw new Error('Server error. Please try again later.')
          default:
            throw new Error(message || 'Login failed. Please try again.')
        }
      } else if (error.request) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
      } else {
        throw new Error('An unexpected error occurred during login. Please try again.')
      }
    }
  }

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/users', { name, email, password })
      console.log('Register response:', data)
      localStorage.setItem('userInfo', JSON.stringify(data))
      setUser(data)
      console.log('User after register setUser:', data)
      return data
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different types of errors
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message || error.response.data?.error
        
        switch (status) {
          case 400:
            if (message && message.toLowerCase().includes('user already exists')) {
              throw new Error('An account with this email already exists. Please use a different email or try logging in.')
            }
            if (message && message.toLowerCase().includes('verify your email')) {
              throw new Error('Please verify your email address before creating an account.')
            }
            throw new Error(message || 'Invalid registration data. Please check your information and try again.')
          case 409:
            throw new Error('An account with this email already exists. Please use a different email or try logging in.')
          case 429:
            throw new Error('Too many registration attempts. Please wait a moment and try again.')
          case 500:
            throw new Error('Server error. Please try again later.')
          default:
            throw new Error(message || 'Registration failed. Please try again.')
        }
      } else if (error.request) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
      } else {
        throw new Error('An unexpected error occurred during registration. Please try again.')
      }
    }
  }

  const logout = () => {
    console.log('Logout called - clearing user data')
    localStorage.removeItem('userInfo')
    setUser(null)
  }

  const markTutorialSeen = async () => {
    if (user && user.hasSeenTutorial === false) {
      await updateTutorialSeen();
      const updatedUser = { ...user, hasSeenTutorial: true };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, markTutorialSeen }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 