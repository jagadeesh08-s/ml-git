import gdown
import os
import sys

url = "https://drive.google.com/drive/folders/1OFz-Oro_dK2HEvtVcbLNM8H6fcnrWJbC"
output_path = "debug_download"

print(f"Python executable: {sys.executable}")
print(f"Gdown version: {gdown.__version__}")
print(f"Attempting to download folder: {url}")

try:
    if os.path.exists(output_path):
        import shutil
        shutil.rmtree(output_path)
    
    # Capture stdout/stderr
    result = gdown.download_folder(url, output=output_path, quiet=False, use_cookies=False)
    print(f"Download result: {result}")
    
    if os.path.exists(output_path):
        print("Folder exists. Contents:")
        for root, dirs, files in os.walk(output_path):
            for file in files:
                print(os.path.join(root, file))
    else:
        print("Folder was NOT created.")

except Exception as e:
    print(f"EXCEPTION: {e}")
