import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();

    useEffect(() => {
        const handleCallback = () => {
            const params = new URLSearchParams(location.search);

            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const userId = params.get('user_id');
            const userName = params.get('user_name');
            const userEmail = params.get('user_email');


            if (accessToken && refreshToken) {
                // Clean up old snake_case keys
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                // Store tokens correctly for AuthContext and API interceptor
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Store user info
                const user = {
                    id: userId,
                    name: userName,
                    email: userEmail
                };
                localStorage.setItem('user', JSON.stringify(user));

                // Update auth context if available
                if (setUser) {
                    setUser(user);
                }

                toast.success(`Welcome back, ${userName}!`);

                // Redirect to home page
                setTimeout(() => {
                    navigate('/');
                }, 500);
            } else {
                toast.error('OAuth login failed');
                navigate('/login');
            }
        };

        handleCallback();
    }, [location, navigate, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Completing sign in...
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Please wait while we log you in
                </p>
            </div>
        </div>
    );
}
