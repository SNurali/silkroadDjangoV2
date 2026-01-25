import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lname, setLname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/accounts/register/', {
        email,
        password,
        name,
        lname,
        phone,
      });

      // After registration, login immediately
      const success = await login(email, password);
      if (success) {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.detail || t('register.error_default'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg transition-colors duration-200">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">{t('register.title')}</h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.email')}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            placeholder="email@example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.name')}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="lname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.lname')}</label>
            <input
              id="lname"
              type="text"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.phone')}</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            placeholder="+998 XX XXX XX XX"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.password')}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium text-lg shadow-lg dark:shadow-none">
          {t('register.submit')}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
        {t('register.have_account')}{' '}
        <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          {t('register.signin')}
        </Link>
      </p>
    </div>
  );
}