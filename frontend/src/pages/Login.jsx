import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);

  // Hardcoded for demo if backend auth fails
  const [email, setEmail] = useState('admin@mail.ru');
  const [password, setPassword] = useState('password123');

  // Check for OAuth errors
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      if (oauthError === 'access_denied') {
        toast.error('Google login was cancelled');
      } else if (oauthError === 'oauth_failed') {
        toast.error('OAuth authentication failed');
      } else {
        toast.error('Login error occurred');
      }
    }

    // Check if Google OAuth is enabled
    checkGoogleOAuthStatus();
  }, [location]);

  const checkGoogleOAuthStatus = async () => {
    try {
      const response = await api.get('/accounts/oauth/google/status/');
      setGoogleOAuthEnabled(response.data.google_oauth_enabled);
    } catch (error) {
      console.error('Failed to check OAuth status:', error);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${api.defaults.baseURL}/accounts/oauth/google/`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError(t('login.invalid_creds'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-200 pt-24">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 z-0"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl text-indigo-500 mix-blend-multiply"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl text-purple-500 mix-blend-multiply"></div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-[200] border border-white/50 dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('login.welcome_back')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label={t('login.email')}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800 flex items-center justify-center">
              {error}
            </div>
          )}

          <Button className="w-full py-3" size="lg" isLoading={loading}>
            {t('login.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('login.no_account')} <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">{t('login.signup')}</Link>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            {googleOAuthEnabled ? (
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Google OAuth not configured</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}