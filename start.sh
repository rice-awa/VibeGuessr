#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/.venv"
VENV_PYTHON="$VENV_DIR/bin/python"
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:8085"
FRONTEND_HOST="0.0.0.0"
FRONTEND_PORT="8085"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo -e "${CYAN}[VibeGuessr]${NC} Shutting down..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null && echo -e "${GREEN}[Backend]${NC} Stopped"
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && echo -e "${GREEN}[Frontend]${NC} Stopped"
    wait 2>/dev/null
    echo -e "${CYAN}[VibeGuessr]${NC} Bye!"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}"
echo "  ╦  ╦┬┌┐ ┌─┐╔═╗┬ ┬┌─┐┌─┐┌─┐┬─┐"
echo "  ╚╗╔╝│├┴┐├┤ ║ ╦│ │├┤ └─┐└─┐├┬┘"
echo "   ╚╝ ┴└─┘└─┘╚═╝└─┘└─┘└─┘└─┘┴└─"
echo -e "${NC}"
echo -e "${CYAN}[VibeGuessr]${NC} AI默契猜词大挑战 - 一键启动"
echo ""

# ── 1. Check environment ──────────────────────────────────────

echo -e "${CYAN}[1/4]${NC} Checking environment..."

MISSING=0

if command -v python3 &>/dev/null; then
    PY_VER=$(python3 --version 2>&1)
    echo -e "  ${GREEN}✓${NC} $PY_VER"
else
    echo -e "  ${RED}✗${NC} Python 3 not found"
    MISSING=1
fi

if command -v node &>/dev/null; then
    NODE_VER=$(node --version 2>&1)
    echo -e "  ${GREEN}✓${NC} Node.js $NODE_VER"
else
    echo -e "  ${RED}✗${NC} Node.js not found"
    MISSING=1
fi

if command -v npm &>/dev/null; then
    NPM_VER=$(npm --version 2>&1)
    echo -e "  ${GREEN}✓${NC} npm $NPM_VER"
else
    echo -e "  ${RED}✗${NC} npm not found"
    MISSING=1
fi

if [ "$MISSING" -eq 1 ]; then
    echo -e "\n${RED}[Error]${NC} Missing required tools. Please install them and retry."
    exit 1
fi

# ── 2. Check backend .env ─────────────────────────────────────

echo -e "\n${CYAN}[2/4]${NC} Checking backend config..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "  ${YELLOW}!${NC} .env not found, creating from .env.example..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo -e "  ${YELLOW}!${NC} Please edit ${YELLOW}backend/.env${NC} and fill in your API keys."
    echo -e "  ${YELLOW}!${NC} Then re-run this script."
    exit 1
else
    echo -e "  ${GREEN}✓${NC} backend/.env exists"
fi

# ── 3. Install dependencies ───────────────────────────────────

echo -e "\n${CYAN}[3/4]${NC} Installing dependencies..."

echo -e "  ${CYAN}→${NC} Python dependencies..."
if [ ! -x "$VENV_PYTHON" ]; then
    echo -e "  ${CYAN}→${NC} Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi
"$VENV_PYTHON" -m pip install -q -r "$BACKEND_DIR/requirements.txt" 2>&1 | tail -1
echo -e "  ${GREEN}✓${NC} Python dependencies installed"

echo -e "  ${CYAN}→${NC} Node dependencies..."
npm install --prefix "$FRONTEND_DIR" --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓${NC} Node dependencies installed"

# ── 4. Start services ─────────────────────────────────────────

echo -e "\n${CYAN}[4/4]${NC} Starting services..."

cd "$BACKEND_DIR"
"$VENV_PYTHON" app.py &
BACKEND_PID=$!
echo -e "  ${GREEN}✓${NC} Backend starting on $BACKEND_URL"

cd "$FRONTEND_DIR"
npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" --strictPort &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓${NC} Frontend starting on $FRONTEND_URL"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  VibeGuessr is running!${NC}"
echo -e "${GREEN}  Frontend:  $FRONTEND_URL${NC}"
echo -e "${GREEN}  Backend:   $BACKEND_URL${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

wait
