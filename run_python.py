#!/usr/bin/env python3
import os
import sys

# Add the python_backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_backend'))

from python_backend.main import app
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "python_backend.main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )