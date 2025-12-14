#!/bin/bash
# Render startup script
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
cd /opt/render/project/src/backend 2>/dev/null || cd "$(dirname "$0")" || pwd
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

