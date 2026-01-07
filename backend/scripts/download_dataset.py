import kagglehub
import sys
import json
import os

def download_dataset():
    try:
        # Download latest version as requested by user
        # User request: path = kagglehub.dataset_download("masoudnickparvar/brain-tumor-mri-dataset")
        print("Starting download...", file=sys.stderr)
        path = kagglehub.dataset_download("masoudnickparvar/brain-tumor-mri-dataset")
        
        # Return the path in JSON format for the Node.js backend to parse
        result = {
            "success": True, 
            "path": path,
            "message": "Dataset downloaded successfully."
        }
        print(json.dumps(result))
    except Exception as e:
        error_result = {
            "success": False, 
            "error": str(e)
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    download_dataset()
