import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // ← правильный импорт (именованный)
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const decoded = jwtDecode(token);
        setUser({ id: decoded.user_id, email: decoded.email });
      } catch (err) {
        logout();
      }
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/token/', { email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      setToken(res.data.access);
      const decoded = jwtDecode(res.data.access);
      setUser({ id: decoded.user_id, email: decoded.email });
      return true;
    } catch (err) {
      console.error('Ошибка входа:', err.response?.data);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};