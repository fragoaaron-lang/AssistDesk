import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext();

const mapSupabaseUser = (authUser) => {
  if (!authUser) return null;

  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email,
    role: authUser.user_metadata?.role || 'student',
    department_id: authUser.user_metadata?.department_id || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('assistdesk_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          localStorage.removeItem('assistdesk_token');
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        localStorage.setItem('assistdesk_token', session.access_token);
        setToken(session.access_token);
        setUser(mapSupabaseUser(session.user));
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
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    const authUser = mapSupabaseUser(data.user);
    localStorage.setItem('assistdesk_token', data.session.access_token);
    setToken(data.session.access_token);
    setUser(authUser);
    return { user: authUser, token: data.session.access_token };
  };

  const register = async (name, email, password, role, departmentId = null) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          department_id: departmentId,
        },
      },
    });

    if (error) {
      throw error;
    }

    const authUser = mapSupabaseUser(data.user);
    if (data.session) {
      localStorage.setItem('assistdesk_token', data.session.access_token);
      setToken(data.session.access_token);
      setUser(authUser);
      return { user: authUser, token: data.session.access_token };
    }

    setUser(authUser);
    return { user: authUser, token: null };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
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
