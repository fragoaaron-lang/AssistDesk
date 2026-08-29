import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';

const AuthContext = createContext();

const persistWelcomeName = (name) => {
  if (name) {
    localStorage.setItem('assistdesk_last_user_name', name);
    return;
  }

  localStorage.removeItem('assistdesk_last_user_name');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('assistdesk_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('assistdesk_token');

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
        localStorage.removeItem('assistdesk_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
    const { user, token: newToken } = response.data;
    const userName = user?.name || email.split('@')[0];
    const firstName = userName.split(' ')[0];

    localStorage.setItem('assistdesk_token', newToken);
    persistWelcomeName(firstName);
    setToken(newToken);
    setUser(user);
    return { user, token: newToken };
  };

  const register = async (name, email, password, role, departmentId = null) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      name,
      email,
      password,
      role,
      department_id: departmentId,
    });

    const { user, token: newToken } = response.data;

    if (newToken) {
      localStorage.setItem('assistdesk_token', newToken);
      setToken(newToken);
    }

    setUser(user);
    return { user, token: newToken || null };
  };

  const logout = async () => {
    const currentName = user?.name || localStorage.getItem('assistdesk_last_user_name');
    if (currentName) {
      persistWelcomeName(currentName.split(' ')[0]);
    }

    sessionStorage.removeItem('assistdesk_show_welcome_splash');
    sessionStorage.removeItem('assistdesk_welcome_name');
    localStorage.removeItem('assistdesk_token');
    setToken(null);
    setUser(null);
    window.location.assign('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
