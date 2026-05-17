# Question Authoring Guide

How to write, format, and seed MC questions for any course — LO quizzes or domain exams.

---

## Where Files Live

```
questions/
  <LO_CODE>.csv       ← LO quiz questions   e.g. ENG5.1.csv, TS1.1.csv
  <DOMAIN_CODE>.csv   ← Domain exam questions  e.g. D5.csv, D1.csv
```

One file per LO or domain. The filename **must** match the code exactly (case-sensitive).

---

## Two Modes

| Mode | File name | `lo_code` column value | Subtopic scope |
|---|---|---|---|
| **LO quiz** | `questions/ENG5.1.csv` | `ENG5.1` | Only subtopics belonging to ENG5.1 |
| **Domain exam** | `questions/D5.csv` | `D5` | Any subtopic in any LO under D5 |

The seeder auto-detects mode from the filename: codes matching `/^D\d+$/` (D5, D10, etc.) trigger domain mode; everything else triggers LO mode.

---

## Column Reference

| Column | Required | Rules |
|---|---|---|
| `question_ref` | ✅ | Unique ID per question. All 4 option rows share the same ref. See naming convention below. |
| `lo_code` | ✅ | Must match the LO or domain code exactly. Same value on all 4 rows. |
| `question_type` | ✅ | `mc` only for now. |
| `question_text` | ✅ | Full question text. Wrap in double quotes if it contains commas. |
| `explanation` | ✅ | Why the correct answer is right AND why each wrong option is wrong. Never leave blank. |
| `subtopic_codes` | ✅ | Pipe-separated subtopic codes from the LO (or domain) in scope. At least one required. |
| `difficulty` | ✅ | `easy`, `medium`, or `hard`. |
| `source` | ✅ | `ai-generated`, `community-reported`, or `official-aws`. |
| `verified` | ✅ | `false` until a human has reviewed and confirmed it. |
| `option_key` | ✅ | `A`, `B`, `C`, `D` — one per row. |
| `option_text` | ✅ | The option text. Wrap in double quotes if it contains commas. |
| `answer_value` | ✅ | `true` for the correct option, `false` for all others. Exactly one `true` per question. |
| `sort_order` | ✅ | `1`, `2`, `3`, `4` — matches the option row (A=1, B=2, C=3, D=4). |

---

## Naming Convention for `question_ref`

```
q-<scope>-<nn>

LO quiz:      q-eng5.1-01   q-eng5.1-02   ...
Domain exam:  q-d5-01       q-d5-02       ...
```

- All lowercase, hyphens only
- `<nn>` is zero-padded (01, 02 … 09, 10, 11 …)
- Must be unique across the **entire** CSV file

---

## One Question = Four Rows

Every question occupies exactly 4 rows — one per option (A, B, C, D). These 4 rows share:
- the same `question_ref`
- the same `question_text`
- the same `explanation`
- the same `subtopic_codes`
- the same `difficulty`, `source`, `verified`, `question_type`, `lo_code`

Only `option_key`, `option_text`, `answer_value`, and `sort_order` differ across rows.

---

## Writing Good Questions

### Stem (question_text)
- State a **specific, testable scenario** — not a vague "which is correct?"
- For grammar questions: always give a full sentence with a clear error or instruction
- For vocabulary questions: embed the word in context; never test in isolation if avoidable
- No "all of the above" or "none of the above" options — these hide reasoning

### Options (A–D)
- All four options must be **plausible** — not obviously wrong
- Options should be roughly the **same length** (long correct answer is a give-away)
- For error-detection: split the sentence into 4 parts across options; one part has the error
- Vary which option (A/B/C/D) is correct across questions — don't bunch correct answers

### Explanation
- Start with why the **correct answer is right** (1 sentence)
- Then explain why **each wrong option fails** (1 sentence each)
- Reference the rule, collocation, or idiom — not just "A is wrong"
- Students read this after answering — make it teach, not just confirm

### Difficulty
| Level | Meaning |
|---|---|
| `easy` | Direct recall — rule or meaning is stated in study content |
| `medium` | Application — student must apply a rule to a new sentence |
| `hard` | Discrimination — two options are very close; nuance or exception needed |

Aim for roughly **30% easy / 50% medium / 20% hard** per LO.

---

## Subtopic Codes

Look up valid subtopic codes for the LO in the DB or in your domain/LO plan.

- Use `|` (pipe) to separate multiple codes: `k-eng-5-1-1|s-eng-5-1-2`
- A question can tag 1–3 subtopics. Don't over-tag.
- For domain exam questions: subtopics from **any** LO in that domain are valid

Quick reference for COMP-ENG-01:

| LO | Subtopic codes |
|---|---|
| ENG5.1 | k-eng-5-1-1, k-eng-5-1-2, k-eng-5-1-3, s-eng-5-1-1, s-eng-5-1-2 |
| ENG5.2 | k-eng-5-2-1, k-eng-5-2-2, k-eng-5-2-3, s-eng-5-2-1, s-eng-5-2-2 |
| ENG5.3 | k-eng-5-3-1, k-eng-5-3-2, k-eng-5-3-3, s-eng-5-3-1, s-eng-5-3-2 |
| ENG6.1 | k-eng-6-1-1, k-eng-6-1-2, s-eng-6-1-1, s-eng-6-1-2 |
| ENG6.2 | k-eng-6-2-1, k-eng-6-2-2, s-eng-6-2-1, s-eng-6-2-2 |
| ENG7.1 | k-eng-7-1-1, k-eng-7-1-2, k-eng-7-1-3, s-eng-7-1-1, s-eng-7-1-2 |
| ENG7.2 | k-eng-7-2-1, s-eng-7-2-1, s-eng-7-2-2 |
| ENG8.1 | k-eng-8-1-1, k-eng-8-1-2, k-eng-8-1-3, s-eng-8-1-1, s-eng-8-1-2 |
| ENG8.2 | k-eng-8-2-1, k-eng-8-2-2, k-eng-8-2-3, s-eng-8-2-1, s-eng-8-2-2 |
| ENG9.1 | k-eng-9-1-1, k-eng-9-1-2, s-eng-9-1-1, s-eng-9-1-2 |
| ENG9.2 | k-eng-9-2-1, s-eng-9-2-1, s-eng-9-2-2 |
| ENG10.1 | k-eng-10-1-1, k-eng-10-1-2, s-eng-10-1-1, s-eng-10-1-2 |
| ENG11.1 | k-eng-11-1-1, k-eng-11-1-2, k-eng-11-1-3, s-eng-11-1-1, s-eng-11-1-2 |
| ENG11.2 | k-eng-11-2-1, s-eng-11-2-1, s-eng-11-2-2, s-eng-11-2-3 |

---

## How to Run the Seeder

```bash
# LO quiz
node --env-file=.env seed_questions.js ENG5.1

# Domain exam
node --env-file=.env seed_questions.js D5
```

The script is **idempotent** — re-running after editing a CSV updates existing questions safely.

**Required `.env` variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Note: `seed_questions.js` reads `VITE_SUPABASE_URL` (not `SUPABASE_URL`).

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `LO <CODE> not found` | LO not seeded yet, or typo in `lo_code` | Run Phase 2 first; check code spelling |
| `CSV lo_code mismatch` | `lo_code` column has a different value than the filename | All rows must have the same `lo_code` matching the filename |
| `subtopic codes not found` | Subtopic code in CSV doesn't exist in DB for that LO | Check the subtopic code list above; re-run pre-flight SQL |
| `unknown question_type` | Value other than `mc`/`mr`/`ordering`/`matching`/`case` | Use `mc` for all COMP-ENG-01 questions |
| `Domain code matches 2 domains` | Duplicate domain code across exams | Domain codes must be globally unique |
| Missing `VITE_SUPABASE_URL` | Wrong env var name | `seed_questions.js` needs `VITE_SUPABASE_URL` not `SUPABASE_URL` |

---

## Recommended Question Count

| Scope | Minimum | Target |
|---|---|---|
| Per LO quiz | 10 | 20–30 |
| Per domain exam | 20 | 40–60 |

At minimum, cover each subtopic with at least 2 questions (1 easy, 1 medium).
