import gdown
import os

url = "https://drive.google.com/drive/folders/1OFz-Oro_dK2HEvtVcbLNM8H6fcnrWJbC"
output_path = "downloaded_data_test"

print(f"Testing download from {url}")
try:
    if os.path.exists(output_path):
        import shutil
        shutil.rmtree(output_path)
    
    # Try default download_folder
    print("Attempting gdown.download_folder...")
    gdown.download_folder(url, output=output_path, quiet=False, use_cookies=False)
    print("Download complete.")
    
    # List contents
    print("Contents:")
    for root, dirs, files in os.walk(output_path):
        for file in files:
            print(os.path.join(root, file))
            
except Exception as e:
    print(f"Error: {e}")
