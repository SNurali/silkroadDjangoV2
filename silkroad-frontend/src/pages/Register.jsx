import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lname, setLname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('http://127.0.0.1:8000/accounts/register/', {
        email,
        password,
        name,
        lname,
        phone,
      });

      // После регистрации сразу логинимся
      const success = await login(email, password);
      if (success) {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Регистрация</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            placeholder="email@example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Имя *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="lname" className="block text-sm font-medium text-gray-700">Фамилия</label>
            <input
              id="lname"
              type="text"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Телефон</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
            placeholder="+998 XX XXX XX XX"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Пароль *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3"
          />
        </div>

        <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium text-lg">
          Зарегистрироваться
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Уже есть аккаунт?{' '}
        <a href="/login" className="text-primary hover:underline font-medium">
          Войти
        </a>
      </p>
    </div>
  );
}