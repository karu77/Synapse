import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Generates a graph from text and optional files using the backend API.
 * @param {string} text The main text input.
 * @param {string} question A question to be answered.
 * @param {File | null} imageFile Optional image file.
 * @param {File | null} audioFile Optional audio/video file.
 * @returns {Promise<import('../types/index').GraphData>} The graph data.
 */
export const generateGraph = async (text, question, imageFile, audioFile, imageUrl, audioUrl) => {
  try {
    const formData = new FormData()
    formData.append('textInput', text)
    formData.append('question', question)
    if (imageFile && typeof imageFile !== 'string') {
      formData.append('imageFile', imageFile)
    }
    if (audioFile && typeof audioFile !== 'string') {
      formData.append('audioFile', audioFile)
    }
    if (typeof imageFile === 'string') {
      formData.append('imageUrl', imageFile)
    } else if (imageUrl) {
      formData.append('imageUrl', imageUrl)
    }
    if (typeof audioFile === 'string') {
      formData.append('audioUrl', audioFile)
    } else if (audioUrl) {
      formData.append('audioUrl', audioUrl)
    }
    const token = JSON.parse(localStorage.getItem('userInfo'))?.token
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
    const { data } = await axios.post(`${API_BASE_URL}/api/graph/generate`, formData, config)
    return data // Now returns an object: { answer: '...', graphData: { ... } }
  } catch (error) {
    console.error('Error generating graph:', error)
    throw error.response?.data?.error || 'Failed to generate graph. Please try again.'
  }
}

export const getHistory = async () => {
  try {
    const { data } = await api.get('/api/history')
    return data
  } catch (error) {
    console.error('Error fetching history:', error)
    throw error
  }
}

export const deleteHistoryItem = async (id) => {
  try {
    await api.delete(`/api/history/${id}`)
  } catch (error) {
    console.error('Error deleting history item:', error)
    throw error.response?.data?.error || 'Failed to delete history item.'
  }
}

/**
 * Clears all history for the logged-in user.
 */
export const clearAllHistory = async () => {
  try {
    const token = JSON.parse(localStorage.getItem('userInfo'))?.token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    await api.delete('/api/history', config)
  } catch (error) {
    console.error('Error clearing history:', error)
    throw error
  }
}