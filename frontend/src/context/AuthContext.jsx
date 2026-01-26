import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Verify token by fetching profile
          const res = await api.get('/accounts/profile/');
          setUser(res.data);
        } catch (err) {
          console.error("Auth hydration failed", err);
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/accounts/login/', { email, password });
    const { access, refresh } = res.data;
    console.log("AuthContext Login Response:");
    console.log("Access Token from API:", access);
    console.log("Refresh Token from API:", refresh);
    console.log("Type of Access:", typeof access);
    // User object key depends on TokenObtainPairView serializer. 
    // Standard SimpleJWT only returns tokens. 
    // We will fetch profile immediately.

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    // CRITICAL FIX: Force update default header to ensure immediate availability
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    console.log("Forced Authorization Header update for next request");

    const profileRes = await api.get('/accounts/profile/');
    setUser(profileRes.data);
    return profileRes.data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);