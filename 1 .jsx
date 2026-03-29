// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add token to requests
  api.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: localStorage.getItem('refreshToken')
          });
          
          const { accessToken: newAccessToken } = response.data;
          localStorage.setItem('accessToken', newAccessToken);
          setAccessToken(newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [accessToken]);

  // Register
  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: newUser } = response.data;
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      
      return { success: true, message: response.data.message };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Đăng ký thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: newUser } = response.data;
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(newUser);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Đăng nhập thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  }, [accessToken]);

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const response = await api.patch('/auth/profile', updates);
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Cập nhật thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Đổi mật khẩu thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Gửi email thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Đặt lại mật khẩu thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Google login
  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  // Facebook login
  const loginWithFacebook = () => {
    window.location.href = `${API_URL}/auth/facebook`;
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    loginWithGoogle,
    loginWithFacebook,
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};