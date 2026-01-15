import requests

url = "http://127.0.0.1:8000/api/token/"
data = {
    "email": "snurali1986@gmail.com",
    "password": "01200120"
}

response = requests.post(url, json=data)
print(response.json())