import axios from 'axios';

// Determine the base URL based on the environment
const isDevelopment = import.meta.env.MODE === 'development';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
const apiPath = import.meta.env.VITE_API_URL || '/api';

// Create an Axios instance
const api = axios.create({
  baseURL: isDevelopment ? apiPath : `${apiBaseUrl}${apiPath}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in the headers
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null

    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`
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
 * @param {string} imageUrl Optional image URL.
 * @param {string} audioUrl Optional audio/video URL.
 * @param {string} diagramType The type of diagram to generate.
 * @returns {Promise<import('../types/index').GraphData>} The graph data.
 */
export const generateGraph = async (text, question, imageFile, audioFile, imageUrl, audioUrl, diagramType = 'knowledge-graph') => {
  try {
    const formData = new FormData()
    formData.append('textInput', text)
    formData.append('question', question)
    formData.append('diagramType', diagramType)
    
    // Log the request data for debugging
    console.log('Sending request with:', {
      textInput: text,
      question,
      diagramType,
      hasImageFile: !!(imageFile && typeof imageFile !== 'string'),
      hasAudioFile: !!(audioFile && typeof audioFile !== 'string'),
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

export default api