import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded for demo if backend auth fails
  const [email, setEmail] = useState('admin@mail.ru');
  const [password, setPassword] = useState('password123');

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-200">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 z-0"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl text-indigo-500 mix-blend-multiply"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl text-purple-500 mix-blend-multiply"></div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/50 dark:border-slate-700 transition-colors">
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
      </div>
    </div>
  );
}