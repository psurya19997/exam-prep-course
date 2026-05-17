# New Course Playbook

Step-by-step guide to add any new exam course to the platform.
Follow this in order — do not skip phases.

---

## Pre-flight — check what already exists

Run this in **Supabase → SQL Editor** before you decide any codes:

```sql
SELECT 'exam'   AS type, code, title FROM exams   ORDER BY created_at
UNION ALL
SELECT 'domain' AS type, code, title FROM domains ORDER BY code
UNION ALL
SELECT 'lo'     AS type, code, title FROM los     ORDER BY code;
```

**Note down:**
- The highest domain number in use (e.g. if `D4` is the highest, your new course starts at `D5`)
- All existing LO codes (your new LO codes must not clash with any of these)

---

## Phase 1 — Gather

Do everything in this phase before touching the database.

### Step 1 — Decide your codes

Fill this in for your new course before writing any SQL:

| Item | Your value |
|---|---|
| Exam code | e.g. `MATH-01`, `GK-01`, `COMP-ENG-01` |
| Exam title | Full display name |
| Provider | Organisation name, or `General Competition` |
| Passing score | Number, or `null` if not published |
| Domain codes | Must be `D` + digits only: `D5`, `D6`, `D7` … (continue from pre-flight) |
| LO codes | Must be globally unique. Recommended: `<SHORT-PREFIX><domain-no>.<lo-no>` e.g. `ENG1.1`, `MATH2.3` |
| Subtopic codes | Must be globally unique. Recommended: `k-<prefix>-<d>-<lo>-<n>` for knowledge, `s-...` for skill |

**Domain code rule — important:** `seed_questions.js` detects domain exam mode using the regex `/^D\d+$/`. Your domain codes must be `D` followed by digits only — e.g. `D5`, `D12`. Codes like `ENG-D1` or `MATH-D1` will break domain exam seeding.

### Step 2 — Plan domains, LOs, subtopics

Write out the full mapping before writing SQL. Use a spreadsheet or a table like this:

| Domain code | Domain title | LO code | LO title | Question types | Subtopic codes |
|---|---|---|---|---|---|
| D5 | Reading Comprehension | ENG1.1 | Story-based RC | mc | k-eng-1-1-1, s-eng-1-1-1 |
| D5 | Reading Comprehension | ENG1.2 | Science-based RC | mc | k-eng-1-2-1 |
| … | … | … | … | … | … |

**Question types — pick one or more per LO:**

| Code | What it means |
|---|---|
| `mc` | Multiple Choice — 1 correct answer out of 4 |
| `mr` | Multiple Response — 2 or more correct answers |
| `ordering` | Arrange items in the correct sequence |
| `matching` | Match items from Column A to Column B |
| `case` | Scenario paragraph followed by sub-questions |

### Step 3 — Write LO study content

For every LO, create a Markdown file at `lo_content/<LO_CODE>.md`.

- File name must exactly match the LO code — e.g. `lo_content/ENG1.1.md`
- Use `docs/templates/lo.md` as your structure guide
- This is what students read before attempting the quiz
- You must have this content ready before Phase 2 — the `content` column cannot be empty

---

## Phase 2 — Seed structure (Supabase SQL Editor)

Go to **Supabase → SQL Editor**. Run the 5 steps below in order.
Every block uses `ON CONFLICT DO NOTHING` — safe to re-run.

---

### Step 1 — Insert exam

Replace every `< >` placeholder with your actual values.

```sql
INSERT INTO exams (code, title, provider, version, passing_score, status)
VALUES (
  '<EXAM_CODE>',        -- e.g. 'COMP-ENG-01'
  '<EXAM_TITLE>',       -- e.g. 'Competitive English — SSC / IBPS / Banking'
  '<PROVIDER>',         -- e.g. 'General Competition'
  'v1.0',
  <PASSING_SCORE>,      -- a number, or NULL
  'published'
)
ON CONFLICT (code) DO NOTHING;
```

---

### Step 2 — Insert domains

One row per domain. Replace codes and titles with your values.
Start domain codes from the next available number found in pre-flight.

```sql
INSERT INTO domains (exam_id, code, title, weight_percent, sort_order)
SELECT e.id, v.code, v.title, v.weight_pct::int, v.sort_order::int
FROM exams e,
(VALUES
  ('<D_CODE_1>', '<DOMAIN_TITLE_1>', NULL, '1'),
  ('<D_CODE_2>', '<DOMAIN_TITLE_2>', NULL, '2'),
  ('<D_CODE_3>', '<DOMAIN_TITLE_3>', NULL, '3')
  -- add one row per domain
) AS v(code, title, weight_pct, sort_order)
WHERE e.code = '<EXAM_CODE>'
ON CONFLICT (exam_id, code) DO NOTHING;
```

> `weight_percent` is nullable — use `NULL` if the exam does not publish domain weights.

---

### Step 3 — Insert LOs

One row per LO. The `content` value is the full text of the `.md` file you wrote in Phase 1.
In SQL, escape any single quotes in the content by doubling them: `'` → `''`.

```sql
INSERT INTO los (domain_id, code, title, exam_tip_summary, content, sort_order)
SELECT d.id, v.lo_code, v.title, v.exam_tip, v.content, v.sort_order::int
FROM domains d,
(VALUES
  ('<D_CODE_1>', '<LO_CODE_1>', '<LO_TITLE_1>', '<ONE_LINE_EXAM_TIP>', '<MARKDOWN_CONTENT>', '1'),
  ('<D_CODE_1>', '<LO_CODE_2>', '<LO_TITLE_2>', '<ONE_LINE_EXAM_TIP>', '<MARKDOWN_CONTENT>', '2'),
  ('<D_CODE_2>', '<LO_CODE_3>', '<LO_TITLE_3>', '<ONE_LINE_EXAM_TIP>', '<MARKDOWN_CONTENT>', '1')
  -- add one row per LO
) AS v(domain_code, lo_code, title, exam_tip, content, sort_order)
WHERE d.code = v.domain_code
ON CONFLICT (domain_id, code) DO NOTHING;
```

---

### Step 4 — Insert subtopics

One row per subtopic. Subtopics are internal tags — students never see them.

```sql
INSERT INTO subtopics (lo_id, code, title, subtopic_type, sort_order)
SELECT l.id, v.code, v.title, v.stype, v.sort_order::int
FROM los l,
(VALUES
  ('<LO_CODE_1>', '<SUBTOPIC_CODE_1>', '<SUBTOPIC_TITLE_1>', 'knowledge', '1'),
  ('<LO_CODE_1>', '<SUBTOPIC_CODE_2>', '<SUBTOPIC_TITLE_2>', 'skill',     '2'),
  ('<LO_CODE_2>', '<SUBTOPIC_CODE_3>', '<SUBTOPIC_TITLE_3>', 'knowledge', '1')
  -- add one row per subtopic
) AS v(lo_code, code, title, stype, sort_order)
WHERE l.code = v.lo_code
ON CONFLICT (lo_id, code) DO NOTHING;
```

> `subtopic_type` is `knowledge` (fact recall) or `skill` (application / decision making).

---

### Step 5 — Insert LO → question type mappings

One row per LO + question type combination.
If all your LOs only use `mc`, you still need one row per LO.

```sql
INSERT INTO lo_question_types (lo_id, question_type_id)
SELECT l.id, qt.id
FROM los l
JOIN question_types qt ON qt.code = l_qt.qt_code
FROM (VALUES
  ('<LO_CODE_1>', 'mc'),
  ('<LO_CODE_2>', 'mc'),
  ('<LO_CODE_3>', 'mc'),
  ('<LO_CODE_3>', 'mr')
  -- one row per (lo_code, question_type_code) pair
) AS l_qt(lo_code, qt_code)
JOIN los l  ON l.code  = l_qt.lo_code
JOIN question_types qt ON qt.code = l_qt.qt_code
ON CONFLICT (lo_id, question_type_id) DO NOTHING;
```

---

### Verify — confirm everything was inserted correctly

Replace `<EXAM_CODE>` with your exam code.

```sql
SELECT
  e.code  AS exam,
  d.code  AS domain,
  d.title AS domain_title,
  l.code  AS lo,
  l.title AS lo_title,
  COUNT(DISTINCT s.id)  AS subtopics,
  STRING_AGG(DISTINCT qt.code, ', ') AS question_types
FROM exams e
JOIN domains d         ON d.exam_id   = e.id
JOIN los l             ON l.domain_id = d.id
LEFT JOIN subtopics s  ON s.lo_id     = l.id
LEFT JOIN lo_question_types lqt ON lqt.lo_id = l.id
LEFT JOIN question_types qt     ON qt.id     = lqt.question_type_id
WHERE e.code = '<EXAM_CODE>'
GROUP BY e.code, d.code, d.title, l.code, l.title
ORDER BY d.code, l.code;
```

Expected: every LO appears, subtopic count matches your plan, question types are listed.

---

## Phase 3 — Seed questions

### Step 6 — Create question CSV files

For **LO quiz** questions → `questions/<LO_CODE>.csv`
For **domain exam** questions → `questions/<DOMAIN_CODE>.csv`

Open `docs/templates/questions.csv` and copy the header row. Key rules:

| Column | Rule |
|---|---|
| `question_ref` | Unique ID per question. Recommended: `q-<prefix>-<d>-<lo>-<nn>` e.g. `q-eng-1-1-01` |
| `lo_code` | Must match the LO or domain code exactly — same for all 4 rows of a question |
| `question_type` | `mc`, `mr`, `ordering`, `matching`, or `case` |
| `subtopic_codes` | Pipe-separated: `k-eng-1-1-1\|s-eng-1-1-1` |
| `difficulty` | `easy`, `medium`, or `hard` |
| `source` | `ai-generated`, `community-reported`, or `official-aws` |
| `verified` | `false` until a human has reviewed it |
| `option_key` | `A`, `B`, `C`, `D` for mc/mr |
| `answer_value` | `true` for correct option, `false` for all others (mc/mr) |
| `sort_order` | 1, 2, 3, 4 — one per option row |

One question = 4 rows (one per option), all sharing the same `question_ref`, `question_text`, and `explanation`.

### Step 7 — Run seed_questions.js

```bash
# LO quiz questions
node --env-file=.env seed_questions.js <LO_CODE>

# Domain exam questions
node --env-file=.env seed_questions.js <DOMAIN_CODE>
```

Repeat for every CSV file. The script is idempotent — safe to re-run after editing a CSV.

**Required `.env` variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `seed_questions.js` reads `VITE_SUPABASE_URL`. `seed.js` reads `SUPABASE_URL`. They are different — use the right one for each script.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Domain code "DX" matches 2 domains` | Duplicate domain code across exams | Re-run pre-flight, pick the next unused number |
| `LO <CODE> not found` | Phase 2 Step 3 not done, or typo | `SELECT code FROM los WHERE code = '<YOUR_CODE>'` |
| `subtopic codes not found in <CODE>` | Subtopic code in CSV not in DB | `SELECT code FROM subtopics WHERE lo_id = (SELECT id FROM los WHERE code = '<LO_CODE>')` |
| `Missing VITE_SUPABASE_URL` | Wrong env var name | `seed_questions.js` needs `VITE_SUPABASE_URL`, not `SUPABASE_URL` |
| Domain exam mode not triggering | Domain code doesn't match `/^D\d+$/` | Use `D5`, `D6` etc. — not `ENG-D1` or any prefixed form |
| `verified` resets to false after edit | Expected behaviour | A trigger resets `verified` whenever `question_text`, `explanation`, or `question_type_id` changes |
