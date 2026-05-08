# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeGuessr（AI默契猜词大挑战）— an AI-powered guessing game where players guess keywords from AI-generated blurry images. Monorepo with React frontend and Flask backend.

## Commands

### Frontend (from `frontend/`)
```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt   # Install dependencies
python app.py                     # Start Flask on port 5000
```

### Backend Environment Setup
Copy `backend/.env.example` to `backend/.env` and set:
- `API_BASE_URL` — OpenAI-compatible API endpoint
- `API_KEY` — API key for the endpoint

## Architecture

### Frontend (`frontend/`)
- **React 19 + Vite 8 SPA**, JavaScript (no TypeScript)
- **Routing**: React Router DOM 7 — routes in `src/App.jsx` (`/` → Home, `/difficulty` → DifficultySelect, `/game` → Game, `/result` → Result)
- **State**: No global state library; uses component state + `localStorage` (via `store/gameStore.js`) + custom hooks (`hooks/useTimer.js`)
- **API layer**: `services/api.js` — thin fetch wrapper for all `/api/game/*` endpoints
- **Dev proxy**: Vite proxies `/api` → `http://localhost:5000` (configured in `vite.config.js`)

### Backend (`backend/`)
- **Flask JSON API** with CORS enabled
- **Three-layer pattern**:
  - **Route layer** (`app.py`) — HTTP endpoints under `/api/game/`
  - **Service layer** (`services/`) — `game_service.py` (session + scoring), `llm_service.py` (LLM calls), `image_service.py` (image generation)
  - **Prompt layer** (`prompts/`) — `word_gen.py` (keyword generation prompts), `judge.py` (answer judging prompts)
- **Session model**: In-memory dict in `game_service.py` (not persistent across restarts)
- **External APIs**: Uses OpenAI-compatible HTTP endpoints; default models are `gemini-2.5-flash` (LLM) and `gpt-image-2-all` (image)

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/game/start` | Create new game session with difficulty |
| POST | `/api/game/next` | Generate next question (keyword + blurry image) |
| POST | `/api/game/guess` | Submit answer, get LLM judgment + score |
| POST | `/api/game/hint` | Get progressive text hint |
| POST | `/api/game/reveal` | Get clear image + knowledge card after correct guess |
| GET | `/api/game/result` | Final game summary |

### Game Config (`config.py`)
- 10 questions per game, max 3 guesses per question
- Three difficulty levels (easy/medium/hard) with different time limits, hint counts, and score multipliers
- Streak bonuses at 3/5/10 consecutive correct answers
- Hint usage applies 30% score penalty

## Development Notes

- Frontend pages are currently scaffolded with placeholder UI; API client is defined but not fully wired
- Phase 1 (init + config) is complete per TODO.md; phases 2-5 are in progress
- The project targets an OpenAI-compatible proxy, not direct OpenAI — the base URL is configurable
