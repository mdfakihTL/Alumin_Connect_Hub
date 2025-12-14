#!/bin/bash
# Startup script for Render
cd /opt/render/project/src/backend || cd backend || pwd
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

