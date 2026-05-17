# Exam Prep App

Multi-exam study platform. Students read LO content, take LO quizzes, and sit timed domain exams. Built on Supabase (Postgres + RLS) + Vite.

## Adding a new course — 3 phases

**Phase 1 — Gather:** Fill the 4-sheet spreadsheet (Exam, Domains, LOs, Subtopics) and write one `.md` study guide per LO in `lo_content/`. Decide which question types each LO supports.

**Phase 2 — Seed structure:** Run 5 INSERT blocks in the Supabase SQL Editor (exam → domains → LOs → subtopics → lo_question_types). Reference rows by code — no manual UUIDs needed.

**Phase 3 — Seed questions:** Create CSVs in `questions/` and run `node --env-file=.env seed_questions.js <CODE>` per file.

Full instructions: `docs/new-course-playbook.md`

## Confirm before running Phase 2

- Confirm exam `code` and all domain codes with the user before running any INSERT.
- Domain codes **must match `/^D\d+$/`** (e.g. `D5`, `D6`) — this is how `seed_questions.js` detects domain exam mode. Run the pre-flight query first to find the current highest domain number.
- LO codes must be globally unique across all exams — `seed_questions.js` looks up LOs by code only.

## Key gotchas

- `seed.js` reads `SUPABASE_URL`. `seed_questions.js` reads `VITE_SUPABASE_URL`. Both need `SUPABASE_SERVICE_ROLE_KEY`.
- `questions.source` must be one of: `ai-generated`, `community-reported`, `official-aws`.
- `questions.difficulty` must be one of: `easy`, `medium`, `hard`.

## Docs

- `docs/new-course-playbook.md` — full step-by-step workflow
- `docs/schema.md` — column reference for the 6 content tables
- `docs/templates/lo.md` — LO study content template
- `docs/templates/questions.csv` — CSV header + example rows
