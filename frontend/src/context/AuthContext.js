// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/authService';

// Create the context
const AuthContext = createContext();

// Auth states
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH_SUCCESS: 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE',
  SET_LOADING: 'SET_LOADING',
  RESTORE_TOKEN: 'RESTORE_TOKEN'
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        error: null
      };
    
    case AUTH_ACTIONS.TOKEN_REFRESH_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: 'Session expired. Please login again.'
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.RESTORE_TOKEN:
      return {
        ...state,
        isAuthenticated: !!action.payload.token,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authentication state on app start
  useEffect(() => {
    restoreAuthState();
  }, []);

  const restoreAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        
        // Verify token is still valid
        const isValid = await AuthService.verifyToken(token);
        if (isValid) {
          dispatch({
            type: AUTH_ACTIONS.RESTORE_TOKEN,
            payload: { token, user }
          });
        } else {
          // Try to refresh the token
          const refreshResult = await AuthService.refreshToken();
          if (refreshResult.success) {
            await AsyncStorage.setItem('userToken', refreshResult.token);
            dispatch({
              type: AUTH_ACTIONS.RESTORE_TOKEN,
              payload: { token: refreshResult.token, user }
            });
          } else {
            // Token refresh failed, user needs to login again
            await clearStoredAuth();
            dispatch({
              type: AUTH_ACTIONS.RESTORE_TOKEN,
              payload: { token: null, user: null }
            });
          }
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.RESTORE_TOKEN,
          payload: { token: null, user: null }
        });
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
      dispatch({
        type: AUTH_ACTIONS.RESTORE_TOKEN,
        payload: { token: null, user: null }
      });
    }
  };

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
  };

  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        // Store token and user data
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            token: result.token,
            user: result.user
          }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.message
        });
        
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await AuthService.register(userData);
      
      if (result.success) {
        // Store token and user data
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            token: result.token,
            user: result.user
          }
        });
        
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.message
        });
        
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearStoredAuth();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const refreshToken = async () => {
    try {
      const result = await AuthService.refreshToken();
      if (result.success) {
        await AsyncStorage.setItem('userToken', result.token);
        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESH_SUCCESS,
          payload: { token: result.token }
        });
        return true;
      } else {
        dispatch({ type: AUTH_ACTIONS.TOKEN_REFRESH_FAILURE });
        await clearStoredAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: AUTH_ACTIONS.TOKEN_REFRESH_FAILURE });
      await clearStoredAuth();
      return false;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;