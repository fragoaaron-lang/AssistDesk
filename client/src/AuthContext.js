import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';

const AuthContext = createContext();

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

    localStorage.setItem('assistdesk_token', newToken);
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
    localStorage.removeItem('assistdesk_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
