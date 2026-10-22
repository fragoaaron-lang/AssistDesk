import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'assistdesk_token';

const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY)
  || sessionStorage.getItem(TOKEN_STORAGE_KEY);

const storeToken = (token, rememberMe = false) => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  (rememberMe ? localStorage : sessionStorage).setItem(TOKEN_STORAGE_KEY, token);
};

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};

const persistWelcomeName = (name) => {
  if (name) {
    localStorage.setItem('assistdesk_last_user_name', name);
    return;
  }

  localStorage.removeItem('assistdesk_last_user_name');
};

const applySavedTheme = (currentUser) => {
  let preferences = {};
  try {
    if (currentUser) {
      const key = `assistdesk_profile_prefs_${currentUser.id ?? currentUser.email}`;
      preferences = JSON.parse(localStorage.getItem(key) || '{}');
    }
  } catch (error) {
    preferences = {};
  }

  const isDarkMode = preferences.darkMode === true;
  document.body.classList.toggle('dark-mode', isDarkMode);
  if (['teal', 'navy', 'gold'].includes(preferences.accent)) {
    document.body.dataset.accent = preferences.accent;
  } else {
    document.body.dataset.accent = 'teal';
  }
  document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', isDarkMode ? '#0d1822' : '#0f2d52');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = getStoredToken();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        setToken(storedToken);
        setUser(response.data.user);
      } catch (error) {
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    const refreshAccountStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        if (error.response?.status === 401) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      }
    };

    const statusRefreshTimer = window.setInterval(refreshAccountStatus, 30000);
    return () => window.clearInterval(statusRefreshTimer);
  }, [token]);

  useEffect(() => {
    applySavedTheme(user);
  }, [user?.id, user?.email]);

  const login = async (email, password, rememberMe = false) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
      remember_me: rememberMe === true,
    });
    const { user, token: newToken } = response.data;
    const userName = user?.name || email.split('@')[0];
    const firstName = userName.split(' ')[0];

    storeToken(newToken, rememberMe);
    persistWelcomeName(firstName);
    setToken(newToken);
    setUser(user);
    return { user, token: newToken };
  };

  const register = async (name, email, password, role, departmentId = null, studentNumber = '') => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      name,
      email,
      password,
      role,
      department_id: departmentId,
      student_number: studentNumber,
    }, { timeout: 25000 });

    return response.data;
  };

  const completeEmailVerification = async (email, code) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/verify-email`, { email, code }, { timeout: 20000 });

    const { user, token: newToken } = response.data;

    storeToken(newToken);
    setToken(newToken);
    setUser(user);
    return { user, token: newToken || null };
  };

  const resendEmailVerification = async (email) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/resend-email-verification`, { email }, { timeout: 20000 });
    return response.data;
  };

  const logout = async () => {
    const currentToken = getStoredToken();
    const currentName = user?.name || localStorage.getItem('assistdesk_last_user_name');
    if (currentName) {
      persistWelcomeName(currentName.split(' ')[0]);
    }

    sessionStorage.removeItem('assistdesk_show_welcome_splash');
    sessionStorage.removeItem('assistdesk_welcome_name');
    if (currentToken) {
      try {
        await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${currentToken}` },
          timeout: 5000,
        });
      } catch (error) {
        console.warn('Logout audit event could not be recorded.', error.message);
      }
    }
    clearStoredToken();
    setToken(null);
    setUser(null);
    window.location.assign('/');
  };

  const updateUserProfile = (profilePicture, studentNumber) => {
    setUser((currentUser) => (currentUser ? {
      ...currentUser,
      profile_picture: profilePicture || null,
      ...(studentNumber !== undefined ? { student_number: studentNumber || null } : {}),
    } : currentUser));
  };

    const updateAccountUser = (updates) => {
      setUser((currentUser) => (currentUser ? { ...currentUser, ...updates } : currentUser));
    };

  return (
      <AuthContext.Provider value={{ user, token, loading, login, register, completeEmailVerification, resendEmailVerification, logout, updateUserProfile, updateAccountUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
