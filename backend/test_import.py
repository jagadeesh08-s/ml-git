import sys
try:
    from main import app
    print("SUCCESS: Main imported")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
