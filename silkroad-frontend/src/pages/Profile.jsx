import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);

  // Заглушка для билетов — позже подтянем из API
  const tickets = [
    { id: 1, sight: 'Горы Чимган', qty: 5, amount: '5200000', status: 'Не оплачен', date: '15.01.2026 04:14' },
    { id: 2, sight: 'Гур-Эмир', qty: 4, amount: '480000', status: 'Не оплачен', date: '15.01.2026 04:13' },
    // ... можно добавить больше
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Заголовок и кнопка редактирования */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Личный кабинет</h1>
        <Link
          to="/profile/edit"
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium text-center w-full sm:w-auto"
        >
          Редактировать профиль
        </Link>
      </div>

      {/* Основная информация */}
      <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-xl font-medium text-gray-900">{user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Имя</p>
              <p className="text-xl font-medium text-gray-900">{user?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Телефон</p>
              <p className="text-xl font-medium text-gray-900">{user?.phone || 'Не указан'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600">Роль</p>
              <p className="text-xl font-medium text-gray-900">Пользователь</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Дата регистрации</p>
              <p className="text-xl font-medium text-gray-900">15.01.2026</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Последний вход</p>
              <p className="text-xl font-medium text-gray-900">15.01.2026 06:00</p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={logout}
            className="inline-block text-red-600 hover:text-red-800 font-medium text-lg transition"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>

      {/* Мои билеты */}
      <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-6">Мои билеты</h2>

        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Достопримечательность</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <a href={`/sights/${ticket.sightId}`} className="text-primary hover:underline">
                          {ticket.sight}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={`/sights/${ticket.sightId}`} className="text-primary hover:text-blue-700">
                        Подробнее
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-600">
            <h3 className="text-xl font-semibold mb-4">Пока нет билетов</h3>
            <p>Купите билет на интересную достопримечательность</p>
            <a href="/" className="mt-4 inline-block text-primary hover:underline">
              Перейти к списку
            </a>
          </div>
        )}
      </div>
    </div>
  );
}