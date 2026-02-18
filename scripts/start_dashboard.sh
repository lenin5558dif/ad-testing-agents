#!/bin/bash
# Start Streamlit dashboard

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$DIR")"

cd "$PROJECT_ROOT"

# Activate venv if exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found (required only for API mode)"
    echo "   You can use mock mode without API key"
fi

# Start Streamlit
echo "🚀 Starting Streamlit dashboard..."
echo "📍 URL: http://localhost:8501"
echo ""
python3 -m streamlit run dashboard/app.py
