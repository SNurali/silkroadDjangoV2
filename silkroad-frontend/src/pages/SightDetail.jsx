import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function SightDetail() {
  const { id } = useParams();
  const [sight, setSight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/sights/${id}/`)
      .then(res => {
        setSight(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки данных');
        setLoading(false);
        console.error(err);
      });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-600">Загрузка...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!sight) return <div className="text-center py-20 text-gray-600">Достопримечательность не найдена</div>;

  const images = sight.images ? sight.images.split(',').map(img => img.trim()) : [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Хлебные крошки */}
      <div className="mb-6">
        <Link to="/" className="text-primary hover:underline">Главная</Link>
        <span className="text-gray-500 mx-2">›</span>
        <span className="text-gray-700">{sight.name}</span>
      </div>

      {/* Заголовок */}
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{sight.name}</h1>
      {sight.sh_description && (
        <p className="text-xl text-gray-600 mb-8">{sight.sh_description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Галерея + основная информация */}
        <div className="lg:col-span-2 space-y-8">
          {/* Галерея */}
          {images.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-2xl font-semibold mb-4">Фотографии</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={`http://127.0.0.1:8000/media/${img}`}
                    alt={`${sight.name} - фото ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Фото+отсутствует'; }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Описание */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Описание</h2>
            <p className="text-gray-700 whitespace-pre-line">{sight.description || 'Описание отсутствует'}</p>
          </div>

          {/* Удобства */}
          {sight.facilities && sight.facilities.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Удобства</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sight.facilities.map(fac => (
                  <li key={fac.id} className="flex items-center gap-2 text-gray-700">
                    <span className="text-primary">✓</span>
                    {fac.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-8">
          {/* Цены */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Цены</h2>
            <div className="space-y-3">
              {sight.is_local > 0 && (
                <div className="flex justify-between text-lg">
                  <span className="text-green-700">Для местных:</span>
                  <span className="font-medium">{sight.is_local} сум</span>
                </div>
              )}
              {sight.is_foreg > 0 && (
                <div className="flex justify-between text-lg">
                  <span className="text-blue-700">Для иностранцев:</span>
                  <span className="font-medium">{sight.is_foreg} сум</span>
                </div>
              )}
            </div>
          </div>

          {/* Купить билет */}
          {sight.enable_tickets && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Купить билет</h2>
              <Link
                to={`/sights/${sight.id}/buy-ticket`}
                className="block w-full bg-primary text-white text-center py-4 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Купить билет онлайн
              </Link>
              <p className="text-center text-sm text-gray-500 mt-2">
                Быстрая покупка через сайт
              </p>
            </div>
          )}

          {/* Местоположение */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Местоположение</h2>
            <p className="text-gray-700 mb-3">
              {sight.address || 'Адрес не указан'}
            </p>
            {sight.geolocation && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Координаты: {sight.geolocation}
                </p>
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Карта (Google Maps / Yandex Maps)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}