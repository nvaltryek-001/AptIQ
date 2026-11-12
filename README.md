<h1 align="center">🧮 AptIQ: Adaptive Aptitude Trainer</h1>

<p align="center"><b>An aptitude-practice app that adapts to you: questions get harder when you answer correctly and focus on topics where your accuracy is below 60%.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/questions-840-0ea5e9?style=flat-square" alt="840 questions" />
</p>

<p align="center"><a href="https://apt-iq-alpha.vercel.app"><b>Live demo →</b></a></p>

## Highlights

- **840-question bank** in `data/questionBank.json`: Quantitative Aptitude 380, Logical Reasoning 280 and Verbal Ability 180 (252 easy, 420 medium, 168 hard), each with an explanation, a time limit and tags.
- **Adaptive engine** (`server.js`):
  - Serves a question at your current difficulty, optionally filtered by module.
  - 70% of the time, picks from your **weak topics** (accuracy under 60% after at least 2 attempts).
  - Avoids repeating recently asked questions.
  - Raises the difficulty after a correct answer and tracks your streak.
- **Modes:** landing, auth, dashboard, practice, timed assessment, training, progress and admin views (`src/components/*`).
- **Quality tooling:** `scripts/validateQuestions.ts` checks the bank and writes `data/validation-report.json`.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/adaptive/question?userId=&module=` | Next adaptive question |
| POST | `/api/adaptive/submit` | Grade an answer and update difficulty, streak and weak topics |
| POST | `/api/auth/verify-status` | Auth status check |

## Architecture

```mermaid
flowchart LR
  UI[React 19 + Vite<br/>landing · practice · assessment · progress · admin] -->|REST| S[Express server.js]
  S --> QB[(questionBank.json<br/>840 questions)]
  S --> AS[Per-user adaptive state<br/>difficulty · streak · weak topics]
  UI --> FB[Firebase Auth / Firestore<br/>firestore.rules · storage.rules]
```

## Run locally

```bash
git clone https://github.com/nvaltryek-001/AptIQ && cd AptIQ
npm install
cp .env.example .env     # add Firebase web config; GEMINI_API_KEY optional
npm run dev              # frontend on :3000
node server.js           # adaptive API on PORT (default 3000; set PORT=3001 if running both)
```

Type-check with `npm run lint`.

## Limitations

- Adaptive state is held in server memory, so it resets when the server restarts.
- No automated tests yet.
