
import requests
import json
import os
import sys

# User credentials
API_KEY = "9TogJ2Qvhc0KDHmDW6DvXVcv91rT2IW3PO_HD3n7bswE"
INSTANCE_CRN = "crn:v1:bluemix:public:quantum-computing:us-east:a/1ac6e5b6b083465ebb6ddc1ad7a95450:987f16cf-83e1-4631-a7e1-f7b3293b2fae::"

def generate_bearer_token(api_key):
    print("Generating Bearer Token...")
    try:
        response = requests.post(
            'https://iam.cloud.ibm.com/identity/token',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data=f'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={api_key}'
        )
        response.raise_for_status()
        token_data = response.json()
        bearer_token = token_data['access_token']
        print("\nSuccess! Bearer Token generated:")
        print(f"{bearer_token[:20]}...{bearer_token[-20:]}") # Print partial token for security/readability
        return bearer_token
    except Exception as e:
        print(f"Error generating bearer token: {e}")
        return None

def save_qiskit_account(api_key, instance_crn):
    print("\nSaving Qiskit Account...")
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService
        
        # Save as ibm_cloud channel since we have CRN
        QiskitRuntimeService.save_account(
            channel="ibm_cloud",
            token=api_key,
            instance=instance_crn,
            overwrite=True
        )
        print("Qiskit Runtime Service account saved successfully (channel=ibm_cloud)!")
        
        # Verify loading
        service = QiskitRuntimeService(channel="ibm_cloud", instance=instance_crn)
        print("Service loaded successfully.")
        print(f"Available backends: {[b.name for b in service.backends()]}")
        
    except ImportError:
        print("qiskit-ibm-runtime not installed.")
    except Exception as e:
        print(f"Error saving/loading Qiskit account: {e}")

if __name__ == "__main__":
    token = generate_bearer_token(API_KEY)
    if token:
        save_qiskit_account(API_KEY, INSTANCE_CRN)
    else:
        print("Skipping Qiskit account save due to token generation failure.")
