// src/services/apiService.js
import Constants from 'expo-constants';

// Configure your backend URL
const API_BASE_URL = 'http://172.20.10.2:8080/api';  // Production

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token is provided
    if (options.token) {
      config.headers.Authorization = `Bearer ${options.token}`;
    }

    try {
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`API Response: ${response.status}`, data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(token) {
    return this.request('/auth/profile', {
      method: 'GET',
      token,
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout(token) {
    return this.request('/auth/logout', {
      method: 'POST',
      token,
    });
  }

  // Exercise endpoints
  async getTrailStepsProgress(token) {
    return this.request('/exercises/trail-steps-progress', {
      method: 'GET',
      token,
    });
  }

  async createExerciseSession(token, exerciseId) {
    return this.request('/exercises/sessions', {
      method: 'POST',
      token,
      body: JSON.stringify({ exerciseId }),
    });
  }

  async submitAnswer(token, answerData) {
    return this.request('/exercises/sessions/answer', {
      method: 'POST',
      token,
      body: JSON.stringify(answerData),
    });
  }

  async getSessionProgress(token, sessionId) {
    return this.request(`/exercises/sessions/${sessionId}/progress`, {
      method: 'GET',
      token,
    });
  }

  // User endpoints
  async getProgressStatistics(token) {
    return this.request('/user/progress/statistics', {
      method: 'GET',
      token,
    });
  }

  async clearUserProgress(token) {
    return this.request('/user/progress/clear', {
      method: 'DELETE',
      token,
      body: JSON.stringify({ confirmClear: 'true' }),
    });
  }
}

export const apiService = new ApiService();