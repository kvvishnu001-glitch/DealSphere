#!/usr/bin/env python3
import sys
import os
import subprocess

# Set environment variables
os.environ["PYTHONPATH"] = "."

# Change to python_backend directory
os.chdir("python_backend")

# Start the server
try:
    print("Starting DealSphere Python Backend...")
    result = subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "simple_server:app", 
        "--host", "0.0.0.0", 
        "--port", "5000",
        "--reload"
    ], check=False, capture_output=False)
    print(f"Server exited with code: {result.returncode}")
except KeyboardInterrupt:
    print("\nServer stopped by user")
except Exception as e:
    print(f"Error starting server: {e}")