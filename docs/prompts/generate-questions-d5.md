# Gemini Prompt — Domain 5: Grammar & Error Detection (D5)
# Domain exam questions in CSV format
# Copy everything between the ─── markers and paste into Gemini.
# To adapt for another domain or LO, see the ADAPTATION NOTES at the bottom.

───────────────────────────────────────────────────────────────────

You are an expert question-setter for Indian competitive exams (SSC CGL, SSC CHSL, IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, Airforce AFCAT). Your task is to generate multiple-choice grammar questions and output them as a CSV file — ready to import directly into a question bank database.

---

## CONTEXT

You are generating questions for **Domain 5: Grammar & Error Detection** of a Competitive English course. This domain covers three topics:

1. **Parts of Speech Errors** — noun number/case, pronoun reference/case, adjective degree of comparison, misplaced/dangling modifiers
2. **Tense, Verb Form & Voice Errors** — tense consistency, modal verbs, conditionals, active/passive voice, direct/indirect speech
3. **Subject-Verb Agreement, Articles & Prepositions** — SVA rules, collective nouns, either/neither, articles (a/an/the), preposition collocations

These questions will appear in a **domain exam** (a timed test covering all three topics together), so spread questions across all three topics.

---

## OUTPUT FORMAT

Output **only** a CSV with this exact header row:

```
question_ref,lo_code,question_type,question_text,explanation,subtopic_codes,difficulty,source,verified,option_key,option_text,answer_value,sort_order
```

**Critical structure rules:**
- Every question occupies exactly **4 consecutive rows** — one row per option (A, B, C, D)
- All 4 rows share the same: `question_ref`, `lo_code`, `question_type`, `question_text`, `explanation`, `subtopic_codes`, `difficulty`, `source`, `verified`
- Only `option_key`, `option_text`, `answer_value`, `sort_order` differ across the 4 rows
- Exactly **one** row per question has `answer_value = true`; all others have `answer_value = false`
- Output **no markdown, no explanation text, no headings** — just the CSV header + data rows

---

## COLUMN RULES

| Column | Value / Rule |
|---|---|
| `question_ref` | Format: `q-d5-NN` where NN is zero-padded (q-d5-01, q-d5-02 … q-d5-40). Unique per question, same on all 4 rows. |
| `lo_code` | Always `D5` — same on all 4 rows. |
| `question_type` | Always `mc`. |
| `question_text` | The full question. Wrap in double quotes. If the question text itself contains double quotes, escape them as `""`. |
| `explanation` | Explain why the correct answer is right (1 sentence) then why each wrong option is wrong (1 sentence each). Wrap in double quotes. No newlines inside the field. |
| `subtopic_codes` | One or more codes from the list below, separated by `|`. Pick the codes that best match what the question tests. |
| `difficulty` | `easy`, `medium`, or `hard` |
| `source` | Always `ai-generated` |
| `verified` | Always `false` |
| `option_key` | `A`, `B`, `C`, or `D` |
| `option_text` | The option text. Wrap in double quotes if it contains commas. |
| `answer_value` | `true` for the correct option, `false` for all others |
| `sort_order` | `1` for A, `2` for B, `3` for C, `4` for D |

---

## SUBTOPIC CODES FOR D5

Use **only** these codes in the `subtopic_codes` column:

| Code | What it covers |
|---|---|
| `k-eng-5-1-1` | Noun number & case errors (uncountable nouns, possessives) |
| `k-eng-5-1-2` | Pronoun reference & case errors (between you and me, reflexives) |
| `k-eng-5-1-3` | Adjective degree of comparison (more better, senior to/than) |
| `s-eng-5-1-1` | Misplaced & dangling modifiers |
| `s-eng-5-1-2` | Spotting the error — mixed parts of speech |
| `k-eng-5-2-1` | Tense consistency & sequence of tenses (since/for, time signals) |
| `k-eng-5-2-2` | Modal verb usage (can/could/should/would/must + base form) |
| `k-eng-5-2-3` | Conditional sentences (if-clauses, subjunctive were) |
| `s-eng-5-2-1` | Active/passive voice errors |
| `s-eng-5-2-2` | Direct/indirect speech errors (backshift, time markers) |
| `k-eng-5-3-1` | Subject-verb agreement rules (interrupter phrases, proximity rule) |
| `k-eng-5-3-2` | Collective noun & either/neither agreement |
| `k-eng-5-3-3` | Article usage (a/an/the/zero article) |
| `s-eng-5-3-1` | Preposition error spotting (fixed verb-prep pairs) |
| `s-eng-5-3-2` | Conjunction & connector misuse |

---

## QUESTION QUALITY RULES

### Question types to use (rotate across all 40 questions)

1. **Error spotting** — A sentence is divided into 4 parts (A)(B)(C)(D). Options are the 4 parts plus "No error". The student identifies which part contains the error.
   > Format: `"Identify the error: 'She gave me (A) a very useful (B) advice on (C) how to proceed (D).'"` Options: A / B / C / D or "No error"
   > Include ~25% "No error" questions to train students not to assume there is always an error.

2. **Fill in the blank** — A sentence with one blank. Options are four words/phrases.
   > Format: `"Choose the correct option: 'The police _____ investigating the case.'"`

3. **Sentence improvement** — An underlined portion is given. Options are four replacements (one of which may be "No improvement needed").
   > Include ~15% "No improvement needed" as the correct answer.

4. **Identify the correct sentence** — Four sentences are given as options; one is grammatically correct.

### Distractor rules
- All four options must be **plausible** — never use obviously absurd wrong options
- Options should be **roughly equal in length** — a conspicuously long option signals the correct answer
- For error-spotting: each wrong option (A, B, C) should feel like a possible location of the error
- Never use "all of the above" or "none of the above"
- Vary which letter (A/B/C/D) holds the correct answer — don't bunch correct answers on one letter

### Explanation rules
- Start with: why the **correct answer is right**, citing the specific rule
- Then: why **each wrong option is wrong**, one sentence per option
- Be precise — name the rule (e.g. "uncountable noun", "modal + base form", "'since' marks a point in time")
- No vague explanations like "A is wrong because it is incorrect"

### Difficulty distribution (across all 40 questions)
- **easy** — 12 questions: direct recall of a well-known rule
- **medium** — 20 questions: applying a rule to a new or slightly tricky sentence
- **hard** — 8 questions: subtle errors, exceptions, or two very close options

### Coverage spread
Generate at least **2 questions per subtopic code**. Ensure all 15 subtopic codes get coverage.
Spread question types: at least 15 error-spotting, 10 fill-in-blank, 8 sentence improvement, 7 identify-correct-sentence.

---

## HIGH-FREQUENCY GRAMMAR RULES TO TEST (use these as your question bank source)

**Nouns & Pronouns**
- Uncountable nouns with no plural: information, advice, furniture, luggage, scenery, equipment, machinery, evidence, news
- Pronouns after prepositions: object form — "between you and **me**", "for **him**"
- Reflexive misuse: "Please contact **me**" not "contact myself"
- Pronoun with each/every/everyone/anyone: singular — "Everyone brought **his** book"

**Adjectives**
- Never double-mark: "more better", "most cleverest" always wrong
- Absolute adjectives (no comparison): unique, perfect, supreme, complete, eternal
- Senior/junior/prior/superior/inferior/preferable + **to** (not "than")

**Tenses**
- "Since" + starting point → present perfect: "I **have worked** here since 2019"
- "For" + duration → present perfect: "I **have lived** here for five years"
- "Ago" → simple past: "Five years **ago**, I **moved** here"
- No sooner … **than** | Hardly/Scarcely … **when**

**Modals**
- Modal + **base form** only: "She must **go**" (never "must goes" or "must went")
- Modal perfect: modal + have + **past participle**: "He should have **gone**"

**Conditionals**
- Type 2: If + past → would + base ("If I **were** you, I **would** go")
- Type 3: If + past perfect → would have + V3 ("If I **had known**, I **would have** told you")
- Never "would" in the if-clause: "If I **would have** known" is ALWAYS wrong

**SVA**
- "Along with / as well as / including" — verb agrees with original subject, not the phrase
- "A number of" → plural verb; "The number of" → singular verb
- Police/cattle/people → plural; News/mathematics/physics → singular

**Articles**
- Sound rule: "an hour" (silent H), "a university" (yu sound), "an MBA" (em sound)
- No "the" with: meals, sports, languages, subjects, single-name countries, diseases (except flu/measles)

**Prepositions**
- Verbs with NO preposition: discuss, enter, marry, attack, resemble, describe, mention, reach
- "Die **of**" disease / "die **from**" wound / "die **for**" a cause
- "Differ **from**" things / "differ **with**" people
- "Different **from**" (never "different than")

---

## WORKED EXAMPLE (match this format exactly)

```
q-d5-01,D5,mc,"Choose the option that correctly fills the blank: 'The committee members, along with the chairperson, _____ scheduled to meet tomorrow.'","'Are' is correct. The subject is 'committee members' (plural); 'along with the chairperson' is an interrupter and does not affect the verb. 'Is' is wrong — it would need a singular subject. 'Were' is wrong — it changes the tense to past, contradicting 'tomorrow'. 'Has been' is wrong — present perfect singular, doubly wrong here.",k-eng-5-3-1,easy,ai-generated,false,A,is,false,1
q-d5-01,D5,mc,"Choose the option that correctly fills the blank: 'The committee members, along with the chairperson, _____ scheduled to meet tomorrow.'","'Are' is correct. The subject is 'committee members' (plural); 'along with the chairperson' is an interrupter and does not affect the verb. 'Is' is wrong — it would need a singular subject. 'Were' is wrong — it changes the tense to past, contradicting 'tomorrow'. 'Has been' is wrong — present perfect singular, doubly wrong here.",k-eng-5-3-1,easy,ai-generated,false,B,are,true,2
q-d5-01,D5,mc,"Choose the option that correctly fills the blank: 'The committee members, along with the chairperson, _____ scheduled to meet tomorrow.'","'Are' is correct. The subject is 'committee members' (plural); 'along with the chairperson' is an interrupter and does not affect the verb. 'Is' is wrong — it would need a singular subject. 'Were' is wrong — it changes the tense to past, contradicting 'tomorrow'. 'Has been' is wrong — present perfect singular, doubly wrong here.",k-eng-5-3-1,easy,ai-generated,false,C,were,false,3
q-d5-01,D5,mc,"Choose the option that correctly fills the blank: 'The committee members, along with the chairperson, _____ scheduled to meet tomorrow.'","'Are' is correct. The subject is 'committee members' (plural); 'along with the chairperson' is an interrupter and does not affect the verb. 'Is' is wrong — it would need a singular subject. 'Were' is wrong — it changes the tense to past, contradicting 'tomorrow'. 'Has been' is wrong — present perfect singular, doubly wrong here.",k-eng-5-3-1,easy,ai-generated,false,D,has been,false,4
```

---

## YOUR TASK

Generate **40 questions** (= 160 CSV rows) for Domain 5 as described above.

Start numbering from `q-d5-01`. Output **only** the CSV — header row first, then 160 data rows. No preamble, no commentary, no markdown code fences around the output.

───────────────────────────────────────────────────────────────────

---

## ADAPTATION NOTES (for other domains / LOs)

To reuse this prompt for a different domain or LO quiz, change these sections:

| What to change | Where |
|---|---|
| Domain number and title | CONTEXT section |
| `lo_code` column rule | COLUMN RULES → `lo_code` row |
| `question_ref` prefix | COLUMN RULES → `question_ref` row |
| Subtopic codes table | SUBTOPIC CODES section |
| Grammar rules to test | HIGH-FREQUENCY RULES section |
| Question count | YOUR TASK section |

**For an LO quiz** (not domain exam):
- Set `lo_code` to the LO code (e.g. `ENG5.1`) instead of `D5`
- Set `question_ref` prefix to `q-eng5.1-NN`
- Include only the subtopic codes for that single LO
- Reduce question count to 20–25
- Remove the "spread across all topics" instruction; focus deeply on that one LO's subtopics

**For a different domain** (e.g. D6 Cloze Test):
- Replace the subtopic codes table with D6's codes
- Replace the grammar rules section with Cloze-specific rules
- Update the question type rotation (Cloze uses fill-in-blank almost exclusively)
