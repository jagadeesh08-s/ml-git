import gdown
import os

url = "https://drive.google.com/drive/folders/1OFz-Oro_dK2HEvtVcbLNM8H6fcnrWJbC"
output_path = "verify_download_data"

print(f"Verifying download from {url}")
try:
    if os.path.exists(output_path):
        import shutil
        shutil.rmtree(output_path)
    
    gdown.download_folder(url, output=output_path, quiet=False, use_cookies=False)
    
    if os.path.exists(output_path):
        print("Success! Files:")
        for root, dirs, files in os.walk(output_path):
            for file in files:
                print(os.path.join(root, file))
    else:
        print("Folder not created.")
            
except Exception as e:
    print(f"Error: {e}")
