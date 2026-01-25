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
        const { access, refresh, user } = res.data;
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
