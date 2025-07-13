import axios from 'axios';

// Determine the base URL based on the environment
const isDevelopment = import.meta.env.MODE === 'development';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
const apiPath = import.meta.env.VITE_API_URL || '/api';

// Create an Axios instance
const api = axios.create({
  baseURL: apiPath, // Use the full URL from VITE_API_URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug helper to check token status
export const checkTokenStatus = () => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (!userInfo) {
      console.log('🔐 Token Debug: No userInfo in localStorage')
      return { valid: false, reason: 'No userInfo found' }
    }
    
    const parsed = JSON.parse(userInfo)
    if (!parsed.token) {
      console.log('🔐 Token Debug: No token in userInfo')
      return { valid: false, reason: 'No token in userInfo' }
    }
    
    console.log('🔐 Token Debug: Token found', {
      hasToken: true,
      tokenLength: parsed.token.length,
      tokenPreview: parsed.token.substring(0, 20) + '...',
      userEmail: parsed.email,
    })
    
    return { valid: true, token: parsed.token, user: parsed }
  } catch (error) {
    console.error('🔐 Token Debug: Error parsing userInfo', error)
    return { valid: false, reason: 'Parse error' }
  }
}

// Add a request interceptor to include the token in the headers
api.interceptors.request.use(
  (config) => {
    const tokenStatus = checkTokenStatus()
    
    if (tokenStatus.valid && tokenStatus.token) {
      config.headers['Authorization'] = `Bearer ${tokenStatus.token}`
      console.log('🔐 Request: Adding auth header for', config.url)
    } else {
      console.log('🔐 Request: No valid token for', config.url, 'Reason:', tokenStatus.reason)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      console.error('Authentication failed - removing invalid token')
      localStorage.removeItem('userInfo')
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Generates a graph from text and optional files using the backend API.
 * @param {string} text The main text input.
 * @param {string} question A question to be answered.
 * @param {File | null} imageFile Optional image file.
 * @param {File | null} audioFile Optional audio/video file.
 * @param {File | null} documentFile Optional document file (PDF, Word, etc.).
 * @param {string} imageUrl Optional image URL.
 * @param {string} audioUrl Optional audio/video URL.
 * @param {string} diagramType The type of diagram to generate.
 * @returns {Promise<import('../types/index').GraphData>} The graph data.
 */
export const generateGraph = async (text, question, imageFile, audioFile, documentFile, imageUrl, audioUrl, diagramType = 'knowledge-graph', name = '') => {
  try {
    const formData = new FormData()
    formData.append('textInput', text)
    formData.append('question', question)
    formData.append('diagramType', diagramType)
    formData.append('name', name)
    
    // Log the request data for debugging
    console.log('Sending request with:', {
      textInput: text,
      question,
      diagramType,
      hasImageFile: !!(imageFile && typeof imageFile !== 'string'),
      hasAudioFile: !!(audioFile && typeof audioFile !== 'string'),
      hasDocumentFile: !!(documentFile && typeof documentFile !== 'string'),
      hasImageUrl: !!(imageUrl || (imageFile && typeof imageFile === 'string')),
      hasAudioUrl: !!(audioUrl || (audioFile && typeof audioFile === 'string'))
    });
    
    // Handle file attachments
    if (imageFile && typeof imageFile !== 'string') {
      formData.append('imageFile', imageFile)
    }
    if (audioFile && typeof audioFile !== 'string') {
      formData.append('audioFile', audioFile)
    }
    if (documentFile && typeof documentFile !== 'string') {
      formData.append('documentFile', documentFile)
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

    try {
      const response = await api.post('/graph/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        validateStatus: status => status < 500 // Don't throw on 500
      });

      // Handle successful responses
      if (response.status < 400) {
        // Always ensure an answer is present for all diagram types
        if (!response.data.answer || typeof response.data.answer !== 'string' || !response.data.answer.trim()) {
          response.data.answer = 'No AI overview available for this diagram.';
        }
        console.log('Graph generation successful:', response.data);
        return response.data;
      }

      // Handle error responses
      console.error('Graph generation failed:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });

      // Format a user-friendly error message
      const errorDetails = response.data?.details || {};
      let errorMessage = response.data?.error || 'Failed to generate graph';
      
      if (errorDetails.receivedFormat) {
        errorMessage += `\n\nReceived format: ${JSON.stringify(errorDetails.receivedFormat, null, 2)}`;
      }
      if (errorDetails.expectedFormats) {
        errorMessage += '\n\nExpected formats:\n' + errorDetails.expectedFormats.join('\n');
      }

      throw new Error(errorMessage);
      
    } catch (error) {
      console.error('Request failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Handle network errors vs API errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const serverError = error.response.data?.error || 'Server error';
        const details = error.response.data?.details ? 
          `\n\nDetails: ${JSON.stringify(error.response.data.details, null, 2)}` : '';
        throw new Error(`${serverError}${details}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        throw new Error(`Request error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error in generateGraph:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export const getHistory = async () => {
  try {
    const { data } = await api.get('/history')
    return data
  } catch (error) {
    console.error('Error fetching history:', error)
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.')
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You may not have permission to view history.')
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.')
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection.')
    }
    
    throw error
  }
}

export const deleteHistoryItem = async (id) => {
  try {
    await api.delete(`/history/${id}`)
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
    // The interceptor handles the token, so no need for manual config
    await api.delete('/history')
  } catch (error) {
    console.error('Error clearing history:', error)
    throw error
  }
}

/**
 * Deletes the logged-in user's account and all associated data.
 */
export const deleteAccount = async () => {
  try {
    await api.delete('/users/profile')
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error.response?.data?.error || 'Failed to delete account.'
  }
}

/**
 * Dev-only: Reset password by email and new password.
 * @param {string} email
 * @param {string} newPassword
 * @returns {Promise<string>} Success message
 */
export const resetPassword = async (email, newPassword) => {
  try {
    const { data } = await api.post('/users/reset-password', { email, newPassword })
    return data.message
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error.response?.data?.message || 'Failed to reset password.'
  }
}

export const updateHistoryName = async (id, name) => {
  try {
    const { data } = await api.patch(`/history/${id}/name`, { name })
    return data
  } catch (error) {
    console.error('Error updating history name:', error)
    throw error.response?.data?.message || 'Failed to update history name.'
  }
}

export const updateTutorialSeen = async () => {
  try {
    await api.patch('/users/tutorial')
  } catch (error) {
    console.error('Error updating tutorial status:', error)
    throw error.response?.data?.message || 'Failed to update tutorial status.'
  }
}

export default api