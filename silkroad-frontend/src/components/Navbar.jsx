import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">SilkRoad</Link>

        <div className="space-x-6">
          <Link to="/" className="text-gray-700 hover:text-primary transition">Достопримечательности</Link>
          <Link to="/" className="text-gray-700 hover:text-primary transition">Регионы</Link>
          <Link to="/" className="text-gray-700 hover:text-primary transition">О нас</Link>

          {user ? (
            <>
              <Link to="/profile" className="text-gray-700 hover:text-primary transition">Кабинет</Link>
              <button onClick={() => { logout(); navigate('/'); }} className="text-red-600 hover:text-red-800 transition">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-primary transition">Войти</Link>
              <Link to="/register" className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}