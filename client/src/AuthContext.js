import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { connectSocket, disconnectSocket } from './socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('assistdesk_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
        connectSocket(token);
      } catch (error) {
        localStorage.removeItem('assistdesk_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:3001/api/auth/login', { email, password });
    localStorage.setItem('assistdesk_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    connectSocket(res.data.token);
    return res.data;
  };

  const register = async (name, email, password, role, departmentId = null) => {
    const res = await axios.post('http://localhost:3001/api/auth/register', { name, email, password, role, department_id: departmentId });
    localStorage.setItem('assistdesk_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    connectSocket(res.data.token);
    return res.data;
  };

  const logout = () => {
    disconnectSocket();
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
