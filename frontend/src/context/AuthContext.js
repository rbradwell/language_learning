// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/apiService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const storedToken = await SecureStore.getItemAsync('accessToken');
      
      if (storedToken) {
        // Verify token is still valid by getting user profile
        try {
          const userProfile = await apiService.getProfile(storedToken);
          setToken(storedToken);
          setUser(userProfile.user);
        } catch (error) {
          // Token is invalid, remove it
          await SecureStore.deleteItemAsync('accessToken');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.success) {
        // Store token securely
        await SecureStore.setItemAsync('accessToken', response.token);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        // Store token securely
        await SecureStore.setItemAsync('accessToken', response.token);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if needed
      if (token) {
        await apiService.logout(token);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local data
      await SecureStore.deleteItemAsync('accessToken');
      setToken(null);
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiService.refreshToken();
      if (response.success) {
        await SecureStore.setItemAsync('accessToken', response.token);
        setToken(response.token);
        return response.token;
      } else {
        // Refresh failed, logout user
        await logout();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return null;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};