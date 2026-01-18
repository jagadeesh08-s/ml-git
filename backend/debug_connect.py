import requests

def test_connect():
    url = "http://localhost:3005/api/ibm/connect"
    payload = {"token": "LW-4Ai_asDZymMVo5IGWft3tkQOi01PE9F-AehPUWTnB"}
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_connect()
