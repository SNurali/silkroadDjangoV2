import requests
import json
from datetime import datetime

# Настройки — поменяй на свои
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "snurali1986@gmail.com"
PASSWORD = "01200120"

# Цвета для вывода
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"


def print_status(message, success=True):
    color = GREEN if success else RED
    print(f"{color}{message}{RESET}")


def get_token():
    """Получаем свежий access-токен"""
    url = f"{BASE_URL}/api/token/"
    data = {"email": EMAIL, "password": PASSWORD}

    try:
        r = requests.post(url, json=data, timeout=5)
        if r.status_code == 200:
            tokens = r.json()
            print_status("Токен успешно получен")
            return tokens["access"]
        else:
            print_status(f"Ошибка получения токена: {r.status_code}", False)
            print(r.text)
            return None
    except requests.exceptions.RequestException as e:
        print_status(f"Не удалось подключиться к серверу: {e}", False)
        return None


def test_api(endpoint, method="GET", data=None, headers=None):
    """Универсальный тест API"""
    url = f"{BASE_URL}{endpoint}"
    headers = headers or {}

    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            r = requests.post(url, json=data, headers=headers, timeout=5)
        else:
            return False, "Метод не поддерживается"

        if r.status_code in (200, 201):
            print_status(f"{method} {endpoint} → {r.status_code} OK")
            return True, r.json()
        else:
            print_status(f"{method} {endpoint} → {r.status_code} ERROR", False)
            print(r.text)
            return False, None
    except requests.exceptions.RequestException as e:
        print_status(f"{method} {endpoint} → Ошибка подключения: {e}", False)
        return False, None


def main():
    print(f"\n=== Тест API SilkRoad — {datetime.now().strftime('%d.%m.%Y %H:%M:%S')} ===\n")

    # 1. Получаем токен
    access_token = get_token()
    if not access_token:
        print("\nТест остановлен — нет токена")
        return

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # 2. Тестируем основные эндпоинты
    print("\nТестируем эндпоинты:\n")

    # Список достопримечательностей
    ok, data = test_api("/api/sights/", "GET", headers=headers)
    if ok:
        print(f"  Найдено {data['count']} достопримечательностей")

    # Детальная (берём первый id из списка)
    if ok and data['results']:
        pk = data['results'][0]['id']
        ok, detail_data = test_api(f"/api/sights/{pk}/", "GET", headers=headers)
        if ok:
            print(f"  Детальная: {detail_data['name']}")

    # Список билетов — выводим ПОЛНЫЙ JSON
    ok, tickets_data = test_api("/api/tickets/", "GET", headers=headers)
    if ok:
        print(f"  Найдено {len(tickets_data)} билетов")
        print("\n  Пример первого билета (с полем user):")
        if tickets_data:
            print(json.dumps(tickets_data[0], indent=4, ensure_ascii=False))
        else:
            print("  Билетов пока нет")

    # Покупка билета (тестовый POST — на sight_id=1, qty=1)
    test_data = {"sight_id": 1, "total_qty": 1}
    ok, new_ticket = test_api("/api/tickets/", "POST", data=test_data, headers=headers)
    if ok:
        print("  Новый билет создан успешно")
        print(f"  ID билета: {new_ticket['id']}")

    # Расчёт суммы
    ok, calc_data = test_api(f"/hotels/calculate-total/?sight_id=1&total_qty=2", "GET")
    if ok:
        print(f"  Расчёт суммы: {calc_data['total']} сум")

    print("\n=== Тест завершён ===\n")


if __name__ == "__main__":
    main()