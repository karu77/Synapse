import { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

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
    const { data } = await api.post('/users/login', { email, password })
    localStorage.setItem('userInfo', JSON.stringify(data))
    setUser(data)
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/users', { name, email, password })
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