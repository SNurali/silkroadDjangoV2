import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function SightList() {
  const [sights, setSights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/sights/')
      .then(res => {
        setSights(res.data.results || res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки данных');
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Достопримечательности Узбекистана</h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-8">Откройте для себя уникальные места нашей страны</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sights.map(sight => (
          <Link to={`/sights/${sight.id}`} key={sight.id} className="block group">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
              {sight.images && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={`http://127.0.0.1:8000${sight.images.split(',')[0]}`}
                    alt={sight.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {sight.name}
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mb-4 line-clamp-3 text-sm">
                  {sight.sh_description || sight.description}
                </p>
                <div className="flex flex-wrap gap-3 mb-4 text-sm">
                  {sight.is_local > 0 && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">
                      Местные: {sight.is_local} сум
                    </span>
                  )}
                  {sight.is_foreg > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                      Иностранцы: {sight.is_foreg} сум
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-500">
                    {sight.geolocation ? `📍 ${sight.geolocation}` : '📍 Адрес не указан'}
                  </span>
                  <span className="text-primary dark:text-blue-400 font-medium">Подробнее →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}