import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      const cachedUser = localStorage.getItem('user');

      if (token) {
        try {
          // Verify token by fetching profile
          const res = await api.get('/accounts/profile/');
          setUser(res.data);
          // Update cached user
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth hydration failed, using cached user", err);
          // Fallback to cached user data if available
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (parseErr) {
              console.error("Failed to parse cached user", parseErr);
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
            }
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
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

  const switchToVendor = async () => {
    try {
      const response = await api.post('/vendors/switch-to-vendor/');
      const { access, refresh, vendor_id, vendor_name, vendor_role } = response.data;
      
      // Update tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Update user context
      setUser(prevUser => ({
        ...prevUser,
        role: vendor_role || 'vendor',
        vendor_id: vendor_id,
        vendor_name: vendor_name
      }));
      
      return response.data;
    } catch (error) {
      console.error('Failed to switch to vendor:', error);
      throw error;
    }
  };

  const switchToUser = async () => {
    try {
      const response = await api.post('/vendors/switch-to-user/');
      const { access, refresh } = response.data;
      
      // Update tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Update user context
      setUser(prevUser => ({
        ...prevUser,
        role: 'user',
        vendor_id: null,
        vendor_name: null
      }));
      
      return response.data;
    } catch (error) {
      console.error('Failed to switch to user:', error);
      throw error;
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Super admin has all roles
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isAdmin = () => user?.role === 'admin';
  const isVendor = () => ['vendor', 'vendor_op', 'hotel_admin'].includes(user?.role);
  const isHotelAdmin = () => user?.role === 'hotel_admin';
  const isModerator = () => user?.role === 'moderator';
  const isUserAndVendor = () => user?.role === 'user' && user?.vendor_id;

  return (
    <AuthContext.Provider value={{
      user, setUser, login, logout,
      switchToVendor, switchToUser,
      loading, hasRole, isAdmin,
      isVendor, isHotelAdmin, isModerator, isUserAndVendor
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);