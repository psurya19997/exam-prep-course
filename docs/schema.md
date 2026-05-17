# Schema Reference — Content Tables

These are the 6 tables you write when creating a new course. All other tables (sessions, attempts, enrollments, etc.) are written by the app at runtime.

---

## exams

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `code` | text | Unique. e.g. `MLA-C01`, `COMP-ENG-01` |
| `title` | text | Full display name |
| `provider` | text | e.g. `Amazon Web Services`, `General Competition` |
| `version` | text | Nullable. e.g. `v1.0` |
| `passing_score` | int | Nullable |
| `status` | text | `draft` or `published`. Students only see `published` |
| `created_at` | timestamptz | Auto-set |

---

## domains

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `exam_id` | uuid | FK → exams.id |
| `code` | text | Unique within exam. **Must match `/^D\d+$/`** for domain exam mode in seed_questions.js (e.g. `D5`, `D12`) |
| `title` | text | Display name |
| `weight_percent` | int | Nullable |
| `sort_order` | int | Display order |

Unique constraint: `(exam_id, code)`

---

## los

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `domain_id` | uuid | FK → domains.id |
| `code` | text | **Globally unique across all exams.** e.g. `ENG1.1`, `TS1.1` |
| `title` | text | Display name |
| `exam_tip_summary` | text | Nullable. One-line callout shown above content |
| `content` | text | Nullable. Full Markdown study guide students read |
| `sort_order` | int | Display order within domain |

Unique constraint: `(domain_id, code)`

---

## subtopics

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `lo_id` | uuid | FK → los.id |
| `code` | text | Unique within LO. Recommended: `k-<course>-<d>-<lo>-<n>` for knowledge, `s-...` for skill |
| `title` | text | Internal label — students never see this |
| `subtopic_type` | text | Nullable. Typically `knowledge` or `skill` |
| `sort_order` | int | Order within LO |

Unique constraint: `(lo_id, code)`

---

## lo_question_types

Junction table. Declares which question types an LO supports.

| Column | Type | Notes |
|---|---|---|
| `lo_id` | uuid | FK → los.id |
| `question_type_id` | uuid | FK → question_types.id |

PK: `(lo_id, question_type_id)`

Question type codes (fixed, pre-seeded):

| Code | Label | Scoring |
|---|---|---|
| `mc` | Multiple Choice | 1 correct answer only |
| `mr` | Multiple Response | All-or-nothing |
| `ordering` | Ordering | All-or-nothing, exact sequence |
| `matching` | Matching | All-or-nothing, all pairs correct |
| `case` | Case Study | Each sub-question scored independently |

---

## questions

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `question_ref` | text | Unique identifier used in CSV (e.g. `q-eng-1-1-01`) |
| `lo_id` | uuid | FK → los.id. Set for LO quiz questions, NULL for domain exam questions |
| `domain_id` | uuid | FK → domains.id. Set for domain exam questions, NULL for LO quiz questions |
| `question_type_id` | uuid | FK → question_types.id |
| `question_text` | text | The question |
| `explanation` | text | Shown after answering. Required |
| `difficulty` | text | `easy`, `medium`, or `hard` |
| `source` | text | `ai-generated`, `community-reported`, or `official-aws` |
| `verified` | bool | Default `false`. Resets to `false` on edit |
| `reported_count` | int | Auto-incremented by trigger on flag insert |

Constraint: exactly one of `lo_id` or `domain_id` must be set (CHECK constraint `questions_scope_chk`).
