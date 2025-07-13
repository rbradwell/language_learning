// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.27:8080/api';

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Process failed requests after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Make authenticated request with automatic token refresh
  async makeAuthenticatedRequest(url, options = {}) {
    let token = await this.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // If token expired, try to refresh
      if (response.status === 401) {
        const errorData = await response.json();
        
        if (errorData.message?.includes('expired') || errorData.message?.includes('invalid')) {
          console.log('Token expired, attempting refresh...');
          
          // Prevent multiple simultaneous refresh attempts
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              requestOptions.headers['Authorization'] = `Bearer ${token}`;
              return fetch(url, requestOptions);
            });
          }

          this.isRefreshing = true;

          try {
            const refreshResult = await this.refreshToken();
            if (refreshResult.success) {
              const newToken = refreshResult.token;
              await AsyncStorage.setItem('userToken', newToken);
              
              this.processQueue(null, newToken);
              this.isRefreshing = false;
              
              // Retry original request with new token
              requestOptions.headers['Authorization'] = `Bearer ${newToken}`;
              return fetch(url, requestOptions);
            } else {
              this.processQueue(new Error('Token refresh failed'), null);
              this.isRefreshing = false;
              throw new Error('Session expired. Please login again.');
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.isRefreshing = false;
            throw refreshError;
          }
        }
      }

      return response;
    } catch (error) {
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject });
        });
      }
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store token locally
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
      };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Store token locally
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
      };
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Failed to refresh token',
      };
    }
  }

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });

      // Clear local storage regardless of response
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      
      return await response.json();
    } catch (error) {
      // Clear local storage even if logout request fails
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout error, but local session cleared',
      };
    }
  }

  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async getUser() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      // Verify token with server
      return await this.verifyToken(token);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async verifyToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Helper method to make API calls with auth
  async authenticatedFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return this.makeAuthenticatedRequest(url, options);
  }
}

export default new AuthService();