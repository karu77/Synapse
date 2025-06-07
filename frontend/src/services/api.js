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
 * @param {File | null} imageFile Optional image file.
 * @param {File | null} audioFile Optional audio/video file.
 * @param {string} [audioVideoURL] Optional audio/video URL.
 * @returns {Promise<import('../types/index').GraphData>} The graph data.
 */
export const generateGraph = async (text, imageFile, audioFile, audioVideoURL) => {
  try {
    const formData = new FormData()
    formData.append('textInput', text)

    if (imageFile) {
      formData.append('imageFile', imageFile)
    }
    if (audioFile) {
      formData.append('audioFile', audioFile)
    }
    if (audioVideoURL) {
      formData.append('audioVideoURL', audioVideoURL)
    }

    const { data } = await api.post('/api/generate-graph', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  } catch (error) {
    console.error('Error generating graph:', error)
    throw error
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
    throw error
  }
} 