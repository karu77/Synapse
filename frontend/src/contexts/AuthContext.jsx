import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for user info in local storage on initial load
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'))
      if (userInfo) {
        setUser(userInfo)
      }
    } catch {
      // If parsing fails, remove the invalid item
      localStorage.removeItem('userInfo')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_BASE_URL}/api/users/login`, { email, password })
    localStorage.setItem('userInfo', JSON.stringify(data))
    setUser(data)
  }

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API_BASE_URL}/api/users`, { name, email, password })
    localStorage.setItem('userInfo', JSON.stringify(data))
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('userInfo')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 