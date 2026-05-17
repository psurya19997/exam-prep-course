-- =====================================================================
-- COMP-ENG-01 — Competitive English (SSC / IBPS / Banking / Airforce)
-- Phase 2 Seed: exam → domains → LOs → subtopics → lo_question_types
-- Run each STEP block separately in Supabase SQL Editor.
-- All blocks use ON CONFLICT DO NOTHING — safe to re-run.
-- =====================================================================

-- ---------- STEP 1: Insert exam ----------
INSERT INTO exams (code, title, provider, version, passing_score, status)
VALUES ('COMP-ENG-01', 'Competitive English — SSC / IBPS / Banking / Airforce', 'General Competition', 'v1.0', NULL, 'published')
ON CONFLICT (code) DO NOTHING;

-- ---------- STEP 2: Insert domains ----------
INSERT INTO domains (exam_id, code, title, weight_percent, sort_order)
SELECT e.id, v.code, v.title, v.weight_pct::int, v.sort_order::int
FROM exams e,
(VALUES
  ('D5', 'Grammar & Error Detection', NULL, '1'),
  ('D6', 'Cloze Test', NULL, '2'),
  ('D7', 'Para Jumbles & Sentence Arrangement', NULL, '3'),
  ('D8', 'Vocabulary', NULL, '4'),
  ('D9', 'Fillers', NULL, '5'),
  ('D10', 'Column Matching', NULL, '6'),
  ('D11', 'Connectors, Inference & Sentence Improvement', NULL, '7')
) AS v(code, title, weight_pct, sort_order)
WHERE e.code = 'COMP-ENG-01'
ON CONFLICT (exam_id, code) DO NOTHING;

-- ---------- STEP 3: Insert LOs (with study content) ----------
INSERT INTO los (domain_id, code, title, exam_tip_summary, content, sort_order)
SELECT d.id, v.lo_code, v.title, v.exam_tip, v.content, v.sort_order::int
FROM domains d,
(VALUES
  ('D5', 'ENG5.1', 'Parts of Speech Errors (Noun, Pronoun, Adjective, Adverb)', 'Scan each underlined part against a 4-point checklist: noun number, pronoun reference, degree of comparison, adverb position. If none break, the answer is "No error."', '# LO 5.1: Parts of Speech Errors (Noun, Pronoun, Adjective, Adverb)

> The exam tests whether you can spot a wrong noun number, broken pronoun reference, or misused adjective/adverb in a sentence split into 3–4 parts. Your job: scan each chunk against a short checklist — number, case, degree, position — and pick the part that breaks the rule. If nothing breaks, the answer is "No error."

---

## 1. Noun Errors

### Number — Singular vs Plural Misuse

**What it is:** Using a singular form where the context demands plural, or vice versa.

**Vibe:** Watch for nouns that **look plural but are singular** (news, mathematics, physics, politics, economics, ethics) and nouns that **look singular but are plural** (cattle, police, people, poultry, gentry). Also watch for nouns that have **no plural form** (information, advice, furniture, luggage, scenery, equipment, machinery, evidence) — never "informations" or "furnitures."

**Exam Keywords:** "Two informations," "many advices," "the police is," "the news are" → all wrong.

---

### Case — Possessive & Compound Nouns

**What it is:** Wrong apostrophe placement or missing possessive marker.

**Vibe:** Inanimate things usually take "of" (the leg of the table), not ''s. Time and distance take ''s (a day''s work, a stone''s throw). Joint possession marks only the last noun (Ram and Shyam''s car = one car). Separate possession marks both (Ram''s and Shyam''s cars = two cars).

**Exam Keywords:** "A day''s work," "two weeks'' notice," "for old times'' sake."

---

## 2. Pronoun Errors

### Reference & Agreement

**What it is:** A pronoun whose antecedent is unclear, wrong in number, or wrong in person.

**Vibe:** Every pronoun must point to one and only one noun. "Each, every, anyone, everyone, nobody, someone" are singular — they take **his/her, he/she, himself/herself**, never "their/them." "One" must be followed by "one''s" (not "his") in formal English. After "than" or "as," use the subject pronoun: "He is taller than I (am)," not "than me."

**Exam Keywords:** "Everyone should bring their book" → should be "his book" (formal exam English).

---

### Case — Subject vs Object

**What it is:** Using "me" where "I" is needed, or "who" where "whom" is needed.

**Vibe:** After prepositions, always use the object form: **between you and me** (never "between you and I"). After "let," use object: **let him and me go**. "Who" = subject; "whom" = object. If you can substitute "he/she," use **who**; if "him/her," use **whom**.

**Exam Keywords:** "Between you and I" → wrong. "Whom shall I say is calling" → wrong (should be "who").

---

### Reflexive Misuse

**What it is:** Using "myself / himself" where a normal pronoun is correct.

**Vibe:** Reflexives are only used when the subject and object are the **same person** (I hurt myself) or for **emphasis** (I myself saw it). Never as a polite substitute for "me" or "I." "Please contact myself" is wrong — say "contact me."

---

## 3. Adjective Errors

### Degree of Comparison

**What it is:** Wrong form for comparing two or more things.

**Vibe:** Use **comparative** (-er / more) for two things; **superlative** (-est / most) for three or more. Never double them: "more better," "most cleverest" are always wrong. Some adjectives are **absolute** — no comparison allowed: unique, perfect, complete, supreme, eternal, universal. Don''t say "more unique" — say "almost unique" or "nearly perfect."

**Exam Keywords:** "More better," "most unique," "very perfect" → all wrong.

---

### Comparative Constructions

**What it is:** Wrong word pairs in standard comparison structures.

**Vibe:** Memorize these patterns — the exam reuses them constantly:
- **than / to** with comparatives: senior **to**, junior **to**, prior **to**, superior **to**, inferior **to**, preferable **to** (not "than")
- "than" with -er forms: taller **than**, better **than**
- **Prefer X to Y** (not "than Y")
- "The + comparative … the + comparative": "The higher you go, the colder it gets."

**Exam Keywords:** "Senior than" → wrong. "Prefer tea than coffee" → wrong.

---

## 4. Adverb Errors

### Position & Form

**What it is:** Adverb placed wrong or used in adjective form.

**Vibe:** Adverbs modify verbs, adjectives, or other adverbs. "She sings beautiful" → wrong; should be "beautifully." But after sense verbs (look, smell, taste, feel, sound) and linking verbs (be, seem, appear, become), use an **adjective**: "She looks beautiful" (correct), not "beautifully." Place adverbs of frequency (always, often, usually, never) **before the main verb** but **after "to be"**: "She **is always** late" / "She **always comes** late."

**Exam Keywords:** "Drive slow" → wrong (should be "slowly"). "Feels badly" → wrong (should be "feels bad").

---

### Misplaced Modifiers

**What it is:** A modifier placed so far from the word it modifies that the sentence becomes ambiguous or absurd.

**Vibe:** "Only," "almost," "even," "just," "nearly" must sit **immediately before** the word they modify. Compare: "Only **she** told him the truth" (no one else told) vs "She told only **him** the truth" (no one else was told). The exam loves this — read the four parts and ask, "Is the modifier next to the thing it actually modifies?"

**Exam Keywords:** "He only eats vegetables" (ambiguous) vs "He eats only vegetables" (clear).

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Sentence has "informations," "advices," "furnitures" | Error — these nouns have no plural form |
| Pronoun after "between," "for," "to" is in subject form (I, he, she) | Error — use object form (me, him, her) |
| "Everyone / each / anyone" paired with "their / them" | Error in formal English — use his/her |
| Comparative + "than" with senior/junior/prior/superior/inferior/preferable | Error — these take "to," not "than" |
| Adjective form used after action verb (e.g., "sings beautiful") | Error — needs adverb form (beautifully) |
| Adverb form used after sense/linking verb (e.g., "looks beautifully") | Error — needs adjective form (beautiful) |
| "More + comparative" or "Most + superlative" doubled | Error — never double-mark degree |
| Reflexive pronoun used without matching subject (e.g., "contact myself") | Error — use plain object pronoun |
| Modifier far from word it modifies, sentence ambiguous | Error — misplaced modifier |
| All four parts follow rules cleanly | No error |

---

## 6. Common Traps

- **Trap — "No error" option:** When you can''t spot anything wrong, students panic and pick a random part. Trust the rules. If nothing breaks the checklist, "No error" is the answer ~25% of the time.
- **Trap — "Each of the students have":** Looks fine but "each of" is **singular** → "has."
- **Trap — "One of my friend":** Wrong. "One of" must be followed by a **plural** noun → "one of my friends."
- **Trap — "I, you and he":** Wrong order. Polite order is **2nd → 3rd → 1st** for positive contexts (You, he and I), and **1st → 2nd → 3rd** when admitting fault (I, you and he are guilty).
- **Trap — "Hardly … than":** Wrong. Use "Hardly … **when**" or "No sooner … **than**."

---

## 7. Quick Reference — High-Frequency Error Patterns

| Pattern | Correct Form |
|---|---|
| Senior / junior / prior / superior / preferable | + **to** (not "than") |
| Hardly … / Scarcely … | + **when** (not "than") |
| No sooner … | + **than** (not "when") |
| Both … | + **and** (not "as well as") |
| Either … | + **or** |
| Neither … | + **nor** |
| Not only … | + **but also** |
| Lest … | + **should** (not "would" or "may") |

> ⚡ **EXAM TIP:** Read the sentence once for meaning, then scan each underlined part against the 4-part checklist: **noun number → pronoun reference → degree of comparison → adverb position**. If all four pass, "No error" is correct.

> ⚡ **EXAM TIP:** Uncountable nouns (information, furniture, advice, equipment, luggage, scenery, machinery) are the single highest-frequency trap. Memorize this list cold.
', '1'),
  ('D5', 'ENG5.2', 'Tense, Verb Form & Voice Errors', 'Match time signals to tense, modal to base verb, "if" clause to conditional rule. "Since/for" always demands present perfect.', '# LO 5.2: Tense, Verb Form & Voice Errors

> The exam tests whether the verb in each part matches the time signal in the sentence and the form demanded by the structure (modal, conditional, passive, reported speech). Your scan-checklist: time word → tense; modal → base verb; "if" clause → conditional rule; quoted speech → backshift rule.

---

## 1. Tense Consistency

### Sequence of Tenses

**What it is:** The rule that the tense of a subordinate clause depends on the tense of the main clause.

**Vibe:** If the main verb is **past**, the verb in the dependent clause is usually also **past** ("He said he **was** tired," not "is tired"). The single big exception: **universal truths** stay in present tense even after a past main verb ("Galileo proved that the earth **moves** around the sun" — never "moved"). Other exception: when comparing across times deliberately ("She was taller then than she **is** now").

**Exam Keywords:** "He said that water boils at 100°C" → keep present for facts.

---

### Time-Signal Words

**What it is:** Specific words that lock in one tense and reject others.

**Vibe:** Memorize the trigger words — these decide the tense regardless of context:
- **Simple Past** (yesterday, ago, last week, in 1990, when I was young)
- **Present Perfect** (since, for, just, already, yet, ever, never, so far, recently, lately)
- **Past Perfect** (by the time, before [past event], when [past event], no sooner … than)
- **Future Perfect** (by + future time: "by next year I will have finished")

**Exam Keywords:** "Since 2010" → present perfect ("has been"), never simple past. "Yesterday" → simple past, never present perfect.

---

### Present Perfect vs Simple Past

**What it is:** The single most-tested distinction in error spotting.

**Vibe:** Use **simple past** when the time is finished and specified ("I met him yesterday"). Use **present perfect** when the action has a link to the present or the time is unspecified ("I have met him before"). With **since / for**, always present perfect ("I have lived here for five years," never "I live" or "I am living"). With **ago**, always simple past ("Five years ago, I lived…").

**Exam Keywords:** "I am working here since 2018" → wrong (should be "have been working since 2018").

---

## 2. Modal Verbs

### Modal + Base Verb

**What it is:** Modals (can, could, may, might, must, shall, should, will, would, ought) are followed by the **base form** of the verb — never the -s, -ed, or -ing form.

**Vibe:** "She can sings" → wrong; "She can sing." "He must goes" → wrong. The exception is **ought** which takes "**to** + base" ("ought to go"), and **used to / dare to / need to** in certain constructions.

**Exam Keywords:** "Should have went" → wrong (should be "should have gone"). "Must has done" → wrong.

---

### Modal Perfect (modal + have + past participle)

**What it is:** Constructions like "should have done," "could have been," "must have known" — used to talk about past possibility, regret, or deduction.

**Vibe:** After **modal + have**, you always need the **past participle** (3rd form), never the past tense or base form. "He could have went" → wrong; "He could have **gone**." Each form has a fixed meaning: **should have** = regret, **could have** = past ability/possibility unfulfilled, **must have** = strong past deduction, **might have** = weak past possibility.

**Exam Keywords:** "Would have came" → wrong. "Should have did" → wrong.

---

## 3. Conditional Sentences (If-Clauses)

### The Four Types

**What it is:** Fixed grammar patterns based on the time and likelihood of the condition.

**Vibe:** Memorize the patterns — the exam never deviates from them:

| Type | If clause | Main clause | Use |
|---|---|---|---|
| Zero | If + present | present | General truths ("If you heat ice, it melts") |
| First | If + present | will + base | Real future possibility ("If it rains, I will stay") |
| Second | If + past | would + base | Unreal present / hypothetical ("If I had money, I would travel") |
| Third | If + past perfect | would have + V3 | Past unreal regret ("If I had studied, I would have passed") |

**Vibe — the killer rule:** **Never use "would" in the if-clause itself.** "If I would have known" → always wrong. The correct form is "If I **had** known."

**Exam Keywords:** "If I would be rich" → wrong. "If he will come" → wrong (use simple present in first conditional).

---

### "Were" for Hypothetical (Subjunctive)

**What it is:** Use **were** (not "was") for all persons in unreal conditions and "as if / as though / wish" constructions.

**Vibe:** "If I **were** you…" (always "were," never "was," even with I/he/she). "I wish I **were** taller." "He talks as if he **were** the boss." This is the **subjunctive mood** — the exam loves to insert "was" and see if you catch it.

**Exam Keywords:** "If I was you" → wrong. "I wish I was younger" → wrong (use "were").

---

## 4. Voice (Active / Passive)

### Conversion Rule

**What it is:** Switching subject and object positions and using "be + past participle."

**Vibe:** Active = Subject + Verb + Object ("Ram broke the window"). Passive = Object + be + V3 + by + Subject ("The window was broken by Ram"). The verb **must** become past participle in passive — using past tense ("was broke") is the trap.

**Exam Keywords:** "Was broke," "was wrote," "was took" → all wrong. Use **broken, written, taken**.

---

### When Passive Is Wrong

**What it is:** Sentences where passive removes clarity or breaks idiom.

**Vibe:** Intransitive verbs (sleep, die, arrive, happen, come, go, exist) **cannot** be made passive. "The accident was happened" → always wrong. "Was died" → wrong. Some verbs sound natural only in active voice; the exam exploits this.

---

## 5. Reported / Indirect Speech

### Backshift Rule

**What it is:** When the reporting verb is in the **past**, the verb in the reported clause **shifts one tense back**.

**Vibe:** Memorize the shifts:
- Present → Past ("I am tired" → He said he **was** tired)
- Present Perfect → Past Perfect ("I have eaten" → He said he **had eaten**)
- Past → Past Perfect ("I went" → He said he **had gone**)
- Will → Would; Can → Could; May → Might; Must → Had to

**Exception:** Universal truths and habitual present do **not** backshift.

**Exam Keywords:** "He said he is tired" (after past reporting) → wrong. Should be "was tired."

---

### Time / Place Markers Shift Too

**What it is:** Words pointing to "now / here / this" shift to "then / there / that" when reported.

**Vibe:** Today → that day; tomorrow → the next day; yesterday → the previous day; here → there; this → that; ago → before; now → then.

---

## 6. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Sentence has "since" or "for" + time period | Use present perfect (has/have + V3) |
| Sentence has "yesterday," "ago," "last week" | Use simple past |
| "If" clause about unreal present | If + past; main clause "would + base" |
| "If" clause about past regret | If + had + V3; main clause "would have + V3" |
| Modal verb (can, must, should, etc.) | Followed by base form — never V2 or V3 |
| "Modal + have" + verb | Use past participle (V3) — never V2 |
| "I wish / as if / as though" | Use "were" for all persons (subjunctive) |
| Reporting verb in past tense | Backshift the reported clause one step |
| Intransitive verb in passive voice (was happened, was died) | Error — intransitives have no passive |
| Universal truth after past reporting verb | Stays in present — no backshift |

---

## 7. Common Traps

- **Trap — "Since" used with simple past or present continuous:** "I am working since 2020" → always wrong. Use **have been working**.
- **Trap — "If + would":** "If I would have known" → wrong. The if-clause never takes would. Use **had known**.
- **Trap — Modal + has/have:** "She must has gone" → wrong. Modals take base form: **must have gone**.
- **Trap — "Was" in subjunctive:** "If I was the PM" → wrong in formal English. Use **were**.
- **Trap — Past participle as past tense:** "He has went" → wrong. Should be **has gone**. Memorize irregular verb forms.

---

## 8. High-Frequency Irregular Verb Forms

| Base | Past (V2) | Past Participle (V3) |
|---|---|---|
| go | went | gone |
| come | came | come |
| see | saw | seen |
| do | did | done |
| write | wrote | written |
| break | broke | broken |
| begin | began | begun |
| drink | drank | drunk |
| run | ran | run |
| lay (place) | laid | laid |
| lie (recline) | lay | lain |
| lie (untruth) | lied | lied |

> ⚡ **EXAM TIP:** When you see "since" or "for" + a time period, the verb must be **present perfect continuous** or **present perfect**. This single rule is tested in almost every paper.

> ⚡ **EXAM TIP:** In conditionals, locate the "if" clause first and ask: real or unreal? Present or past? That decides the tense pair in one step.
', '2'),
  ('D5', 'ENG5.3', 'Subject-Verb Agreement, Articles & Prepositions', 'Strip interrupters to find the real subject; sound (not spelling) decides a/an; verb-preposition pairs are memorized.', '# LO 5.3: Subject-Verb Agreement, Articles & Prepositions

> The exam tests three high-frequency error categories together: does the verb match its subject in number? Is the article (a / an / the / zero) used correctly? Is the preposition the standard collocation? Each has a short, memorizable rule-book — this LO is the rule-book.

---

## 1. Subject-Verb Agreement (SVA)

### The Core Rule

**What it is:** A singular subject takes a singular verb; a plural subject takes a plural verb.

**Vibe:** Simple in theory, brutal in execution because the exam hides the real subject behind distractor phrases. The trick is to **strip away interrupting phrases** and find the head noun:
- "The **box** of chocolates **is** on the table" (subject = box, not chocolates)
- "The **quality** of the apples **was** poor" (subject = quality)
- "A **bouquet** of flowers **was** delivered" (subject = bouquet)

Interrupters that don''t change the verb: "along with," "as well as," "in addition to," "together with," "including," "besides," "no less than."

**Exam Keywords:** "The teacher, along with her students, **is** going" — verb agrees with teacher, not students.

---

### Indefinite Pronouns — Always Singular

**What it is:** Pronouns ending in -one, -body, -thing, plus "each, every, either, neither" — all singular.

**Vibe:** Memorize: **each, every, everyone, everybody, anyone, anybody, someone, somebody, no one, nobody, nothing, either, neither**. They all take a **singular verb** and singular pronoun reference (his/her, not their — in formal exam English).

- "Each of the boys **has** a book" (not "have")
- "Neither of them **was** present" (not "were")
- "Everyone **is** ready" (not "are")

**Exam Keywords:** "Every man and woman **was** counted" — "every" forces singular even with "and."

---

### Either…or / Neither…nor / Or / Nor — Proximity Rule

**What it is:** When subjects are joined by "or / nor / either…or / neither…nor," the verb agrees with the **nearer** subject.

**Vibe:** "Either the boys or **the teacher is** wrong" (verb = is, agrees with teacher). "Neither the teacher nor **the students are** wrong" (verb = are, agrees with students). Put the plural subject closer to the verb when possible — it sounds smoother.

---

### Collective Nouns

**What it is:** Words like team, family, committee, jury, government, audience, crowd, staff.

**Vibe:** Treated as **singular** when acting as one unit; **plural** when members act individually. In Indian competitive English, default to **singular** unless the sentence clearly emphasizes individual members.

- "The team **is** winning" (acting as one unit)
- "The team **are** arguing among themselves" (individual members)

Special cases — always plural: **police, cattle, people, gentry, poultry, vermin**. Always singular: **news, mathematics, physics, economics, politics, ethics, civics**.

**Exam Keywords:** "The police is investigating" → wrong; "are investigating." "The news are good" → wrong; "is good."

---

### Tricky Subjects

**What it is:** Constructions where the verb form catches students off-guard.

**Vibe:**
- "One of + plural noun" → **singular verb** ("One of the boys **is** absent")
- "**A number of** + plural" → plural verb; "**The number of** + plural" → singular verb
- Plural-form, singular meaning (mathematics, news, measles): singular verb
- Distance, time, money as a unit: singular verb ("Ten kilometres **is** a long way," "Five hundred rupees **is** enough")
- Two nouns connected by "and" but forming one idea: singular ("Bread and butter **is** my breakfast," "Slow and steady **wins** the race")

**Exam Keywords:** "A number of students **were** absent" (plural). "The number of students **was** small" (singular).

---

## 2. Articles (a / an / the / zero)

### A vs An — Sound, Not Letter

**What it is:** Use "a" before a consonant **sound**, "an" before a vowel **sound** — the spelling doesn''t decide.

**Vibe:** It''s the pronunciation of the next word''s first sound that matters:
- **a** university (sounds like "yu-"), **a** European, **a** one-rupee coin, **a** useful tool
- **an** hour (silent h), **an** honest man, **an** MBA (sounds "em-"), **an** SP, **an** X-ray, **an** umbrella

**Exam Keywords:** "An university" → wrong; "a university." "A honest man" → wrong; "an honest man."

---

### When to Use "The"

**What it is:** Definite article, pointing to a specific or already-known noun.

**Vibe:** Use **the** for:
- Unique things: **the** sun, **the** moon, **the** earth, **the** sky, **the** Ganges, **the** Himalayas
- Rivers, seas, oceans, mountain ranges, deserts: **the** Nile, **the** Pacific, **the** Sahara
- Newspapers, ships, holy books: **the** Hindu, **the** Titanic, **the** Quran
- Superlatives: **the** best, **the** tallest
- Ordinals: **the** first, **the** second
- Nationalities as a group: **the** Indians, **the** rich, **the** poor
- Musical instruments (when "play"): play **the** guitar

---

### When NOT to Use "The"

**What it is:** Zero-article cases — using "the" here is an error.

**Vibe:** **No "the"** with:
- Names of countries (most): India, Japan, France (but **the** USA, **the** UK, **the** Netherlands — plurals/unions)
- Single mountains, lakes, islands: Mount Everest, Lake Victoria
- Meals: have **breakfast**, eat **lunch** (not "the breakfast" — unless specified)
- Languages and subjects: study **English**, learn **mathematics**
- Sports and games: play **cricket**, play **chess** (no "the")
- Diseases: he has **cancer**, **diabetes**, **malaria** (but: the flu, the measles, the mumps)
- Abstract nouns when general: **honesty** is the best policy

**Exam Keywords:** "Play the cricket" → wrong. "Study the English" → wrong. "He had the dinner" → wrong (unless specifying).

---

### Article Before Adjective + Noun

**What it is:** The article position when an adjective precedes the noun.

**Vibe:** Article + adjective + noun: "**a** good book," "**an** excellent idea." With "such," "so," "what," "many a" — special positions:
- **Such a** good man, **such an** honest woman
- **So** good a man, **so** bright an idea (adjective comes before article!)
- **What a** lovely day, **how** beautiful a scene
- **Many a** student (always singular)

---

## 3. Prepositions — High-Frequency Collocations

### Verb + Preposition (Fixed Pairs)

**What it is:** Verbs that always pair with a specific preposition — wrong preposition = error.

**Vibe:** Memorize these — the exam mines this list constantly:

| Verb | Preposition | Example |
|---|---|---|
| agree | **with** (a person) / **to** (a plan) / **on** (a topic) | I agree with you on this point |
| differ | **from** (a thing) / **with** (a person) | My view differs from his |
| consist | **of** | The team consists of five members |
| comprise | (no preposition) | The team comprises five members |
| depend | **on / upon** | It depends on you |
| insist | **on** | She insisted on going |
| object | **to** | I object to that remark |
| reply | **to** | Reply to my letter |
| listen | **to** | Listen to me |
| look | **at** (see) / **for** (search) / **after** (care) / **into** (investigate) | Look into the matter |
| congratulate | **on** | Congratulate her on her success |
| accuse | **of** | He was accused of theft |
| charge | **with** | Charged with murder |
| die | **of** (disease) / **from** (wound, overwork) / **for** (a cause) | Died of cancer |
| confide | **in** | Confide in me |
| persist | **in** | Persist in error |
| prevail | **upon / over** | Prevailed upon him to come |

---

### Adjective + Preposition

**What it is:** Fixed adjective-preposition pairs.

**Vibe:**

| Adjective | Preposition | Example |
|---|---|---|
| afraid / proud / ashamed | **of** | Afraid of dogs |
| good / bad | **at** (skill) / **for** (helpful) | Good at maths / Good for health |
| angry | **with** (person) / **at** (situation) | Angry with him / Angry at the delay |
| sorry | **for** (someone) / **about** (event) | Sorry for him / Sorry about the loss |
| jealous / envious | **of** | Jealous of her success |
| different | **from** (not "than") | Different from yours |
| similar | **to** | Similar to mine |
| tired | **of** (bored) / **from** (exhausted) | Tired of waiting |
| dependent / dependent | **on** | Dependent on parents |
| addicted | **to** | Addicted to gambling |
| accustomed | **to** | Accustomed to heat |

---

### Time & Place Prepositions

**What it is:** at / on / in for time and place.

**Vibe:**
- **Time:** at + specific time (at 5 pm), on + day/date (on Monday, on Jan 1), in + month/year/period (in May, in 2020, in the morning)
- **Place:** at + specific point (at the door), on + surface (on the table), in + enclosed space (in the room)
- Exceptions: **at night**, **in the night**, **on time** (punctual) vs **in time** (with margin to spare)

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Subject has interrupter (along with, as well as, including) | Verb agrees with original subject, ignore interrupter |
| "Each / every / one of / either / neither" + verb | Singular verb |
| "A number of" + plural noun | Plural verb |
| "The number of" + plural noun | Singular verb |
| News / mathematics / physics / politics + verb | Singular verb |
| Police / cattle / people + verb | Plural verb |
| "An" before vowel-sounding word (hour, MBA, X-ray) | Correct (sound, not spelling) |
| "The" before country name (India, France, Japan) | Error — no "the" with single-name countries |
| "The" before meal/sport/subject in general sense | Error |
| Verb mentioned with wrong preposition (e.g., "discuss about") | Error — "discuss" takes no preposition |
| "Different than" | Error — "different from" |
| "Senior than / superior than" | Error — "senior to / superior to" |

---

## 5. Common Traps

- **Trap — "Discuss about":** Wrong. "Discuss" takes no preposition. Same with: enter, marry, attack, resemble, lack, comprise, request, order — all take direct object.
- **Trap — "Married with":** Wrong in standard English; use "married to." (Indian English often uses "married with" but it''s marked wrong in formal exams.)
- **Trap — "Reach to / reach at the station":** Wrong; "reached the station" (no preposition).
- **Trap — "Mention about / explain about":** Wrong; "mention X" / "explain X" — no preposition.
- **Trap — "One of my friend":** Must be plural — "one of my friends."
- **Trap — "A hour / an university":** Sound rule: "an hour" / "a university."

---

## 6. Verbs That Take NO Preposition (high-yield)

These verbs are followed directly by the object — adding a preposition is an error:

**discuss, enter, marry, attack, resemble, lack, comprise, request, order, await, mention, explain, describe, reach, accompany, demand, investigate**

| Wrong | Correct |
|---|---|
| Discuss **about** the topic | Discuss the topic |
| Entered **into** the room | Entered the room |
| Married **with** her | Married her |
| Reached **at/to** the station | Reached the station |
| Resembles **with** his father | Resembles his father |
| Lack **of** confidence (as verb) | Lacks confidence |

> ⚡ **EXAM TIP:** For SVA, always **strip the sentence** to its core subject + verb. Cross out commas, "along with," "as well as," and prepositional phrases. The verb form follows whatever survives.

> ⚡ **EXAM TIP:** With articles, decide in this order: (1) Specific or general? (2) Vowel sound or consonant sound? (3) Special category (countries, meals, games, languages, diseases)? The answer falls out from one of these.
', '3'),
  ('D6', 'ENG6.1', 'Vocabulary-Based Cloze (Word Fit)', 'Read full passage first for theme and tone; each blank is decided by meaning + collocation, not "what sounds nice."', '# LO 6.1: Vocabulary-Based Cloze (Word Fit)

> A vocabulary cloze passage has 5–10 blanks where every option is grammatically correct — only **meaning, tone, and collocation** decide the right answer. Your job: read the full passage once for context, then for each blank ask "which of the four words actually fits this sentence''s idea, register, and word-partner?"

---

## 1. The Four-Step Cloze Method

### Step 1 — Read the Whole Passage First

**What it is:** Read all 5–10 sentences in one pass without filling anything, just to grasp the theme, tone, and direction.

**Vibe:** Most students start filling blank 1 immediately and get trapped. The right move is to first identify: Is this passage **positive** (praising something), **negative** (criticizing), **neutral** (describing), or **contrasting** (pros and cons)? Once you know the **mood**, half the wrong options disappear because their tone doesn''t match.

**Exam Keywords:** Words like "however," "but," "despite," "although" signal contrast. Words like "moreover," "furthermore," "in addition" signal continuation.

---

### Step 2 — Use Surrounding Words as Clues

**What it is:** Each blank has clue words **before** and **after** it that constrain meaning.

**Vibe:** A blank rarely stands alone — the words around it tell you the **part of speech** needed, the **valence** (positive/negative), and often the **exact collocation**. If the sentence says "The economy was \_\_\_\_ by the pandemic," the verb must be negative (devastated, crippled, hurt) — never positive (boosted, enhanced).

---

### Step 3 — Test Each Option in Context

**What it is:** Substitute each of the four options into the blank and check fit.

**Vibe:** Don''t pick the word you "like best in isolation." Pick the word that **fits this specific sentence''s meaning, register, and word-partner**. A word can be a perfect synonym in a dictionary but wrong in a sentence because the collocation is unusual ("commit a mistake" is wrong; "make a mistake" is the collocation).

---

### Step 4 — Re-read the Filled Passage

**What it is:** Final consistency check.

**Vibe:** Once all blanks are filled, read the passage end to end. If any sentence sounds jarring or contradicts the overall mood, that blank''s answer is probably wrong. Re-attempt that single blank.

---

## 2. Synonym Discrimination — The Heart of Vocabulary Cloze

### Near-Synonyms with Different Shades

**What it is:** Four options that all "mean roughly the same thing" but only one fits.

**Vibe:** Test-makers love sets like:
- **big / large / huge / massive / enormous / vast** — different intensities; "vast" suits abstract (vast knowledge), "massive" suits weight/scale
- **angry / annoyed / furious / irritated / livid** — escalating intensity; pick one that matches the situation
- **happy / glad / delighted / ecstatic / cheerful** — formality and intensity vary
- **walk / stroll / stride / amble / march / saunter** — manner of walking differs

The trick: ask, **does this word''s intensity and connotation match the rest of the sentence?**

**Exam Keywords:** "She was \_\_\_\_ at the news" → if context says "broke down in tears," pick **devastated** not **annoyed**.

---

### Positive vs Negative Connotation

**What it is:** Words that look neutral but carry hidden positive or negative weight.

**Vibe:** Memorize these positive/negative pairs — the cloze passage''s tone tells you which side to pick:
- **Confident** (positive) vs **arrogant** (negative)
- **Frugal** (positive) vs **stingy** (negative)
- **Curious** (positive) vs **nosy** (negative)
- **Slim** (positive) vs **skinny** (negative)
- **Determined** (positive) vs **stubborn** (negative)
- **Childlike** (positive) vs **childish** (negative)
- **Famous** (positive) vs **notorious** (negative)

**Exam Keywords:** A cloze praising a leader takes "determined"; criticizing a leader takes "stubborn."

---

## 3. Collocation — Words That Travel Together

### Fixed Verb-Noun Pairs

**What it is:** Verbs and nouns that always partner with each other; mixing partners is an error.

**Vibe:** Memorize high-frequency collocations — these come up in nearly every paper:

| Verb | Noun |
|---|---|
| **make** | a decision, a mistake, an effort, progress, a profit, a noise, an exception, a promise |
| **do** | homework, business, a favour, damage, research, the laundry |
| **take** | a decision (informal), a chance, advantage, action, place, a risk |
| **commit** | a crime, a sin, suicide, murder (never "commit a mistake") |
| **pay** | attention, a visit, a compliment, respects |
| **place / put** | emphasis, blame, pressure, trust |
| **draw** | a conclusion, attention, a distinction, a comparison |
| **reach** | an agreement, a conclusion, a decision |
| **raise** | a question, an issue, doubts, awareness, funds |

**Exam Keywords:** "Commit a mistake" → wrong. "Make a mistake" → correct. "Do a decision" → wrong; "make a decision."

---

### Adjective-Noun Collocations

**What it is:** Adjectives that conventionally pair with specific nouns.

**Vibe:** Some standard pairs:
- **Heavy** rain, traffic, smoker, sleeper, loss
- **Strong** coffee, argument, opinion, possibility, wind
- **Deep** sleep, sorrow, conviction, recession
- **Wide** range, gap, support, smile
- **High** hopes, expectations, standards, priority
- **Severe** weather, criticism, pain, damage

**Exam Keywords:** "Big rain" → wrong; "heavy rain." "Big smoker" → wrong; "heavy smoker."

---

## 4. Phrasal Verbs in Cloze

### High-Frequency Phrasal Verbs

**What it is:** Verb + preposition/particle combinations with idiomatic meaning.

**Vibe:** A cloze blank may need a specific phrasal verb whose meaning matches the sentence. Memorize this set:

| Phrasal Verb | Meaning |
|---|---|
| **bring up** | raise (a topic) / rear (a child) |
| **bring about** | cause |
| **call off** | cancel |
| **carry out** | execute |
| **come across** | encounter by chance |
| **give in** | surrender / yield |
| **give up** | quit |
| **look into** | investigate |
| **look up to** | admire |
| **look down on** | despise |
| **put off** | postpone |
| **put up with** | tolerate |
| **set up** | establish |
| **take after** | resemble |
| **turn down** | reject |
| **turn up** | arrive / appear |
| **break out** | start suddenly (war, disease) |
| **break down** | fail / collapse |

**Exam Keywords:** "The talks broke \_\_\_\_" — if context says "failed," answer is **down**. If context says "started suddenly," answer is **out**.

---

## 5. Register & Tone Matching

### Formal vs Informal Word Choice

**What it is:** Picking words whose formality level matches the passage.

**Vibe:** A passage in a formal register (editorial, academic, official) wants formal words; an informal passage (story, blog) wants conversational ones. Compare:

| Informal | Formal |
|---|---|
| get | obtain, acquire, receive |
| help | assist, facilitate |
| buy | purchase, procure |
| start | commence, initiate |
| end | conclude, terminate |
| big | substantial, significant, considerable |
| show | demonstrate, illustrate, exhibit |
| tell | inform, notify, apprise |
| ask | inquire, request |
| think about | consider, contemplate |

**Exam Keywords:** Editorial passage about economic policy → use **commence** not **start**, **substantial** not **big**.

---

## 6. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Sentence has negative tone words (devastated, ruined, suffered) | Fill with negative-connotation word |
| Sentence has positive tone words (thrived, succeeded, praised) | Fill with positive-connotation word |
| Blank follows "however / but / despite" | Word must contrast with previous idea |
| Blank follows "moreover / furthermore / similarly" | Word must continue the same idea |
| Blank is between verb and noun (collocation slot) | Pick the standard partner verb |
| Passage is formal / editorial register | Pick the more formal synonym |
| Two options are near-synonyms, one is mild, one is intense | Match intensity to context cue words |
| Blank needs a phrasal verb and context says "cancel" | call off |
| Blank needs a phrasal verb and context says "postpone" | put off |
| Blank needs a phrasal verb and context says "investigate" | look into |

---

## 7. Common Traps

- **Trap — Picking the "fancy" word:** Students often pick the longest or most uncommon option thinking it must be right. **Fit beats fanciness.** A simple word that matches the collocation wins.
- **Trap — Ignoring the connector before the blank:** "However" before a blank means the answer **contrasts** what came earlier. Missing this flips the answer.
- **Trap — Same root, different meaning:** Options like "deceive / receive / perceive / conceive" share endings but mean entirely different things. Read carefully.
- **Trap — Two options that both "sort of" fit:** When stuck between two, pick the one that **collocates more naturally** with the surrounding word. ("Make progress" beats "do progress" even if both feel okay.)
- **Trap — Word meaning vs word usage:** "Avenge" and "revenge" both mean "get back at" but one is a verb, one is usually a noun. Check the slot.

---

## 8. Quick-Win Vocabulary Sets for Cloze

| Theme | High-Frequency Words |
|---|---|
| Economy positive | thrive, flourish, boom, surge, robust, resilient, recover, rebound |
| Economy negative | plunge, slump, contract, stagnate, dwindle, falter, recession, downturn |
| Government action | implement, enforce, mandate, regulate, sanction, legislate, ratify |
| Crisis / problem | exacerbate, mitigate, alleviate, address, tackle, confront, escalate |
| Improvement | enhance, augment, bolster, strengthen, fortify, optimize |
| Decline | diminish, deteriorate, erode, undermine, weaken, decay |
| Praise | laud, commend, applaud, hail, acclaim, extol |
| Criticism | condemn, denounce, censure, rebuke, lambast, decry |

> ⚡ **EXAM TIP:** Cloze answer selection is **never random** — every blank has exactly one option that beats the others on **meaning + tone + collocation**. If you can eliminate two by tone, you''re guessing between two — not four.

> ⚡ **EXAM TIP:** Watch the connector word right before each blank. "However" → contrast; "moreover" → continue; "because" → cause; "as a result" → effect. The connector decides the direction of the word.
', '1'),
  ('D6', 'ENG6.2', 'Grammar & Theme-Based Cloze', 'Separate grammar blanks (rule-decided) from vocabulary blanks (theme-decided). Solve grammar slots first.', '# LO 6.2: Grammar & Theme-Based Cloze

> A grammar cloze has blanks where the answer is decided by **grammatical fit** (article, preposition, conjunction, verb form, tense) rather than meaning. A theme-based cloze tests whether you can hold the **passage''s central idea** in mind and pick words that don''t break it. Master both by reading the passage twice — once for theme, once for grammar.

---

## 1. Grammar-Based Cloze — The Slot Rules

### Article Slots (a / an / the / zero)

**What it is:** A blank where the only choice is between articles.

**Vibe:** Use the article rules you already know — apply them mechanically:
- **Vowel sound** → "an" (an hour, an MBA, an X-ray, an umbrella)
- **Consonant sound** → "a" (a university, a one-rupee, a European)
- Specific or already mentioned → **the**
- First mention of a count noun → **a / an**
- General plural or uncountable → **no article** (Honesty is the best policy)
- Unique entity, ordinal, superlative → **the**

**Exam Keywords:** "She is \_\_\_\_ MBA student" → **an** (M-sound starts with vowel).

---

### Preposition Slots

**What it is:** A blank requiring a fixed verb-preposition, adjective-preposition, or noun-preposition pair.

**Vibe:** No reasoning will help — these are **memorized collocations**. The cloze rotates the same set:
- **agree with / agree to / agree on** (person / plan / topic)
- **comply with**, **conform to**, **adhere to**
- **deal with**, **cope with**, **grapple with**
- **succeed in** (an attempt) / **succeed to** (a throne, an office)
- **die of** (disease) / **die from** (wound) / **die for** (a cause)
- **suffer from** (illness) / **suffer at** (the hands of)

**Exam Keywords:** "He was accused \_\_\_\_ theft" → **of**. "Different \_\_\_\_ his brother" → **from**, never "than."

---

### Conjunction Slots

**What it is:** A blank where the answer is a connecting word (and, but, so, because, although, etc.).

**Vibe:** First, read the two clauses the blank joins. Ask:
- Do they **agree**? → and, moreover, furthermore, additionally
- Do they **contrast**? → but, however, yet, although, despite, whereas
- Is the second a **cause** of the first? → because, since, as
- Is the second a **result** of the first? → so, therefore, hence, thus
- Is the second a **condition**? → if, unless, provided that

**Exam Keywords:** "He was tired \_\_\_\_ he kept walking" → contrast needed → **but / yet**, never "and."

---

### Verb Form Slots

**What it is:** A blank requiring a specific tense, voice, or modal.

**Vibe:** The passage''s surrounding tense dictates the slot:
- Surrounding verbs in past → blank likely past
- Surrounding verbs in present → blank likely present
- "Since" or "for" anywhere nearby → present perfect
- "If + past" → main clause needs "would + base"
- After modal → base form (never V2 or V3)
- After "have/has/had" → past participle (V3)

**Exam Keywords:** "By the time he arrived, the train \_\_\_\_ left" → past perfect → **had**.

---

## 2. Theme-Based Cloze — The Three Diagnostic Questions

### Question 1 — What is this passage actually saying?

**What it is:** A one-sentence summary of the passage''s central idea.

**Vibe:** Before filling any blank, force yourself to answer: "If I had to describe this passage in one line, what would I say?" If you can''t, you''ll keep mis-picking blanks. Look for:
- The **first sentence** often states the main idea
- The **last sentence** often re-states or concludes
- **Repeated keywords** signal the theme

---

### Question 2 — What is the author''s stance?

**What it is:** Whether the author is **for**, **against**, **neutral**, or **mixed** on the topic.

**Vibe:** Authors signal stance with loaded words. A pro-stance uses positive vocabulary (commendable, vital, necessary, beneficial, breakthrough). An anti-stance uses negative vocabulary (alarming, troubling, dangerous, regrettable, flawed). The blank''s tone must match the stance.

**Exam Keywords:** Passage uses "alarmingly," "deteriorating," "crisis" → stance is negative → fill blanks with negative-connotation words.

---

### Question 3 — Where is the passage going?

**What it is:** Tracking direction — is the passage building up to a conclusion, contrasting two sides, narrating a sequence, or describing a problem-solution?

**Vibe:** Common passage structures:
- **Problem → Solution** (first half describes issue, second half offers fix)
- **Cause → Effect** (event leads to consequence)
- **Argument → Counter-argument** (one view, then opposite)
- **General → Specific** (broad statement, then example)
- **Chronological** (event sequence in time)

Each structure has predictable connectors at predictable spots.

---

## 3. Coherence — Making Blanks Match the Flow

### Reference Words (Cohesion)

**What it is:** Pronouns, demonstratives, and determiners that link a sentence to what came before.

**Vibe:** Watch for:
- **This / that / these / those** point backward — the blank often points to a noun mentioned earlier
- **It / they** must agree in number with their antecedent
- **Such / similar / same** signal a previous reference
- **Another / other / one … other** indicate addition or contrast

**Exam Keywords:** "\_\_\_\_ trend has alarmed economists" — if previous sentence describes "rising inflation," then this/that fits, not "a."

---

### Logical Connectors (High-Frequency)

**What it is:** Words that signal the logical relationship between clauses.

**Vibe:** Memorize these by function:

| Function | Connectors |
|---|---|
| Adding | and, moreover, furthermore, additionally, besides, in addition |
| Contrasting | but, however, yet, nevertheless, on the other hand, despite, although, whereas |
| Cause | because, since, as, owing to, due to, on account of |
| Effect | so, therefore, thus, hence, consequently, as a result |
| Example | for instance, for example, such as, namely |
| Conclusion | in conclusion, to sum up, finally, in short |
| Condition | if, unless, provided that, in case, as long as |
| Time | when, while, before, after, as soon as, since |

**Exam Keywords:** Blank between two contrasting ideas → "however / yet / nevertheless." Blank introducing a result → "therefore / consequently."

---

## 4. Theme-Word Selection

### Matching Word to Theme

**What it is:** Picking the option whose meaning best supports the passage''s overall idea.

**Vibe:** A passage about **environmental degradation** wants words like: deplete, pollute, contaminate, endanger, threaten, deteriorate. The same passage rejects words like: enhance, beautify, flourish — even if they''re grammatically perfect.

A passage about **technological progress** wants: innovate, revolutionize, transform, advance, breakthrough. Not: stagnate, decline, lag.

A passage about **economic recovery** wants: rebound, revive, recover, surge, bolster. Not: plummet, slump, contract.

**Exam Keywords:** Theme = pollution → fill blanks with deplete / threaten / contaminate, not preserve / protect.

---

### Avoiding Theme-Breaking Options

**What it is:** Recognizing when a grammatically valid option contradicts the theme.

**Vibe:** Test-makers love placing one or two options that are **grammatically correct but thematically wrong**. If three options fit the theme and one breaks it, the breaker is a distractor — never the answer.

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Blank precedes vowel-sound word | "an" |
| Blank precedes consonant-sound word | "a" |
| Blank precedes a unique / already-mentioned noun | "the" |
| Blank joins two contrasting ideas | but / however / yet / although |
| Blank joins cause and effect | so / therefore / consequently |
| Blank requires verb after modal | base form |
| Blank requires verb after "have/has/had" | past participle |
| Blank requires verb form with "since / for" | present perfect |
| Passage tone is negative | fill with negative-connotation word |
| Passage tone is positive | fill with positive-connotation word |
| Blank''s option is grammatically valid but contradicts theme | wrong — pick theme-aligned option |
| Pronoun blank refers backward | match number with antecedent |

---

## 6. Common Traps

- **Trap — Switching theme mid-passage:** Students fill the first 3 blanks with negative words, then a blank seems to fit a positive word — they pick it without re-checking. If theme is negative, all blanks should lean negative unless a contrast connector appears.
- **Trap — Article before adjective:** "An useful tool" → wrong (useful starts with consonant "yu"); "a useful tool."
- **Trap — Connector reversal:** Picking "and" where the clauses contrast, or "but" where they agree. Always check both clauses, not just one.
- **Trap — "Since" with simple past:** "I have known him since five years" → wrong. "Since" needs present perfect ("have known him for five years" — note "for" with duration, "since" with start point).
- **Trap — Skipping the second read:** Many errors come from failing to re-read the filled passage. Always do a final pass.

---

## 7. Mini Process for a 7-Blank Passage

1. **Read end-to-end** without filling — get theme and tone
2. Identify **passage structure** (problem-solution, contrast, sequence?)
3. Mark **grammar blanks** (article / preposition / verb form) vs **vocabulary blanks**
4. Fill grammar blanks first — they''re mechanical
5. Fill vocabulary blanks second — match theme and tone
6. **Re-read** filled passage; flag any blank that sounds jarring
7. Re-attempt only those flagged blanks

> ⚡ **EXAM TIP:** Grammar blanks have **exactly one** right answer determined by rule. Vocabulary blanks have **one best** answer determined by theme + collocation. Use the right method for each blank type — don''t reason about meaning for an article slot.

> ⚡ **EXAM TIP:** The first and last sentences of a cloze passage are gold — they almost always reveal the central idea. When stuck on a middle blank, re-read sentence 1 and the last sentence.
', '2'),
  ('D7', 'ENG7.1', 'Sentence Rearrangement — Fixed Pattern (PQRS)', 'Find the opener (no backward pronoun, no contrast connector); para jumbles are an elimination game, not a construction game.', '# LO 7.1: Sentence Rearrangement — Fixed Pattern (PQRS)

> A para jumble gives you 4–6 sentences (usually labeled S1, P, Q, R, S, S2 — or P, Q, R, S only) that must be reordered to form a coherent paragraph. The four options are pre-set sequences (e.g., QRSP, PSRQ). Your job is **not** to discover the right order from scratch — it''s to **eliminate three options** by checking just two or three pair-junctions.

---

## 1. The Anchor-Sentence Method

### Step 1 — Identify the Opening Sentence

**What it is:** The sentence that must come **first** in the paragraph.

**Vibe:** An opening sentence has these signatures — pick whichever applies:
- Introduces a **new topic** with a full noun (proper name, definite description)
- Has **no pronoun** referring outside itself (no "he, she, it, this, that, these" without a clear in-sentence antecedent)
- Has **no connector** that requires prior context (no "however," "moreover," "therefore," "also," "thus")
- Often defines, names, or sets the scene

**Exam Keywords:** A sentence starting with "Mahatma Gandhi was…" can open. A sentence starting with "He was assassinated in 1948…" cannot open — "he" needs a prior antecedent.

---

### Step 2 — Identify the Closing Sentence

**What it is:** The sentence that must come **last**.

**Vibe:** A closing sentence often:
- States a **conclusion, result, or moral** ("Thus…", "Hence…", "In short…", "This led to…")
- Refers back to multiple earlier ideas with summary words
- Cannot be followed by anything because all references resolve backward

**Exam Keywords:** "This is why the policy was eventually scrapped" → closing position; "this" sums up prior reasoning.

---

### Step 3 — Find Tight Pairs

**What it is:** Two sentences that **must** be adjacent because one references the other directly.

**Vibe:** Once you find one or two pairs that are locked together, you can eliminate any option that breaks them. Pair signals:
- Sentence A names a noun; Sentence B starts with "**This/that/these/those + noun**" → B follows A
- Sentence A makes a statement; Sentence B starts with "**However / But / On the contrary**" and contradicts it → B follows A
- Sentence A gives a cause; Sentence B starts with "**As a result / Therefore / Hence**" → B follows A
- Sentence A introduces a person; Sentence B uses **he/she/they/his/her** referring to them → B follows A

**Exam Keywords:** If Q ends with "the Reserve Bank''s decision" and R starts with "This decision…" — QR is locked.

---

### Step 4 — Eliminate by Junction Check

**What it is:** Test each option''s junction points against your locked pairs and the no-pronoun rule for the opener.

**Vibe:** Don''t try to read each full option as a paragraph — that''s slow and confusing. Just check:
- Does the option start with your identified opener?
- Does the option preserve your locked pair?
- Does any pair-junction in the option violate a pronoun reference rule?

Three options usually fail one of these — leaving one survivor.

---

## 2. Pronoun & Reference Tracking

### Backward Pointing — The Cardinal Rule

**What it is:** Pronouns and demonstratives almost always point **backward**, never forward, in well-written paragraphs.

**Vibe:** A sentence with "**he**" needs a male person mentioned in an earlier sentence. A sentence with "**this idea / this policy / these measures**" needs the idea/policy/measures introduced earlier. Use this to chain sentences in only one direction.

**Tracking Table:**

| Reference word | Looks for | What comes before |
|---|---|---|
| He / him / his | A male person by name | Name mentioned earlier |
| She / her / hers | A female person by name | Name mentioned earlier |
| It / its | A singular thing / abstract noun | Thing/idea named earlier |
| They / them / their | A plural noun / group | Plural noun named earlier |
| This / that + noun | A specific noun | Noun mentioned in prior sentence |
| Such / similar | An example or instance | Example shown earlier |
| Former / latter | Two items in order | Two items named earlier |
| The + noun (definite) | A previously mentioned noun | Noun introduced earlier |

---

### Demonstrative Linking — "This X" / "These X"

**What it is:** When a sentence opens with "This + noun" or "These + plural noun," it almost always **immediately follows** the sentence that introduced that noun.

**Vibe:** This is one of the strongest junction signals. If you can find a "This trend / This decision / This phenomenon" sentence, locate the sentence that just named that exact noun — they are a locked pair.

---

## 3. Connector-Based Sequencing

### Continuation Connectors

**What it is:** Words signaling the sentence **continues** the prior idea.

**Vibe:** Sentences starting with these **follow** a sentence on the same topic:
- **Moreover, furthermore, in addition, additionally, besides, also**
- **Similarly, likewise**

If a sentence starts with "Moreover…" it cannot be the opener.

---

### Contrast Connectors

**What it is:** Words signaling the sentence **opposes** the prior idea.

**Vibe:** Sentences starting with these **follow** a sentence with the opposite stance:
- **However, but, yet, nevertheless, on the contrary, on the other hand, despite this, in contrast**

If one sentence says "X is dangerous" and another says "However, it has benefits," the second follows the first.

---

### Result Connectors

**What it is:** Words signaling the sentence is a **consequence** of the prior idea.

**Vibe:** Sentences starting with these **follow** a sentence describing a cause:
- **Therefore, hence, thus, consequently, as a result, so, accordingly**

---

### Time / Sequence Connectors

**What it is:** Words establishing chronological order.

**Vibe:** A paragraph narrating events follows time order. Use markers:
- **First, then, next, later, afterwards, finally, eventually**
- **In 1947 → in 1950 → by 1960** (year order)
- **As a child → as a teenager → as an adult** (life stage)

---

## 4. Article Progression — A → The

### From Indefinite to Definite

**What it is:** A noun is introduced with **"a / an"** on first mention, then referred to as **"the"** on subsequent mentions.

**Vibe:** This is a powerful but subtle clue. If one sentence has "**a young scientist**" and another has "**the scientist**," the "a" sentence comes first. The exam loves this pattern — train your eye to spot it.

**Exam Keywords:** "A leopard entered the village" comes before "The leopard was eventually tranquillized."

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Sentence starts with "He / She / It / They" (no antecedent in itself) | Cannot be the opener |
| Sentence starts with "However / Moreover / Therefore / Also" | Cannot be the opener |
| Sentence starts with "This / These + noun" | Must follow the sentence introducing that noun |
| Sentence uses "a + noun" | Comes before any "the + same noun" sentence |
| Sentence ends with "X." and another starts with "This X…" | Pair locked, adjacent |
| Sentence concludes with "Thus / Hence / In short" | Likely the closing sentence |
| Two sentences contradict each other with "however / but" | Statement first, contrast second |
| Two sentences have cause and effect connector "therefore / hence" | Cause first, effect second |
| Sentences mention time markers (1947, 1950, later, finally) | Order chronologically |
| Sentence introduces a person by full name | Likely opener or follows only intro sentence |

---

## 6. Common Traps

- **Trap — Reading whole options aloud:** Wastes time and confuses you. Instead, identify the **opener** first; this alone eliminates 2 of 4 options usually.
- **Trap — Multiple plausible openers:** When two sentences both look like they could open, check which one introduces a noun that the **other** sentence references with "the / this / he / she." The one with full noun introduction opens.
- **Trap — Ignoring "the" as a clue:** "The X" implies X was named earlier — it''s not just a stylistic choice.
- **Trap — Picking the option that "sounds nice":** The right answer is determined by **reference logic**, not aesthetic flow. If logic says QRSP, even if PQRS "reads smoother," QRSP is correct.
- **Trap — Forgetting fixed PQ/PS slots:** In PQRS-type questions, sometimes S1 and S2 are pre-fixed (given as paragraph start/end). Only P, Q, R, S need ordering. Read the instruction carefully.

---

## 7. A Worked Example

**Sentences (jumbled):**
- **P:** This dramatic shift has been driven largely by smartphone adoption.
- **Q:** Internet usage in rural India has surged over the past decade.
- **R:** As a result, e-commerce platforms now report that 60% of new users come from villages.
- **S:** Today, more rural users are online than urban ones.

**Process:**
- Q is the opener (introduces "Internet usage in rural India," no backward pronoun)
- P opens with "This dramatic shift" → P follows the sentence describing the shift → P follows Q
- S elaborates the shift with a comparison → S follows P? Or S follows Q directly? Check: S says "Today, more rural users are online than urban ones" — this **describes** the shift, so it could come right after Q. P then says "This dramatic shift has been driven by smartphones" — explaining the cause of what S described. So order: Q → S → P
- R starts with "As a result" → R follows the cause (P) → R closes

**Final order:** Q → S → P → R

---

## 8. Practical Sequence for Any PQRS Question

1. **Read all four sentences** quickly once
2. Identify **the opener** (no backward pronoun, no contrast connector)
3. Identify **the closer** (summary / result words at start)
4. Find **one locked pair** using "this/that/it/he/she" pointing backward
5. Match your opener + closer + pair against the four options
6. The one option that satisfies all three constraints is the answer

> ⚡ **EXAM TIP:** Para jumbles are an **elimination game**, not a construction game. You don''t need to know the perfect order — you need to spot two violations in three options. Be ruthless in cutting options that break a pronoun reference.

> ⚡ **EXAM TIP:** Never start with a sentence beginning with "However / Moreover / Therefore / This / That / He / She / It / They" — these all require prior context. This rule alone eliminates 50–75% of wrong options.
', '1'),
  ('D7', 'ENG7.2', 'Odd Sentence Out & Paragraph Coherence', 'Highlight the main noun of each sentence — four will share a theme, one will not. That outlier is the odd sentence.', '# LO 7.2: Odd Sentence Out & Paragraph Coherence

> An "odd sentence" question gives you 5–6 sentences that almost form a paragraph — but one breaks the theme, logic, tone, or sequence. Your job: identify which sentence **doesn''t belong**. The trick is to find the **central thread** of the rest, then test each sentence against it.

---

## 1. The Coherence Filter

### What Makes a Paragraph Coherent?

**What it is:** A coherent paragraph has **one central idea**, all sentences support it, and they flow in a logical order.

**Vibe:** Three things bind a paragraph:
- **Topic unity** — every sentence is about the same subject
- **Tone consistency** — same register (formal/informal), same stance (positive/negative)
- **Logical progression** — each sentence builds on, contrasts with, or follows from the previous one

The odd sentence breaks at least one of these.

---

### Step 1 — Find the Central Idea

**What it is:** A one-sentence summary of what the passage is about.

**Vibe:** Read all sentences once. Ask: "What single topic does the majority of these sentences talk about?" Often 4 out of 5 sentences will obviously share a theme — the 5th is the suspect.

**Exam Keywords:** If four sentences are about "rising fuel prices and their impact on transportation" and one is about "the history of fuel taxation policy," the historical one is the odd sentence — it''s tangentially related but off-topic.

---

### Step 2 — Test Each Sentence Against the Theme

**What it is:** Ask of each sentence: "Does this directly support the central idea?"

**Vibe:** A sentence might be **true, well-written, and topically adjacent** — but still be odd if it doesn''t advance the central argument. The exam exploits this: distractors look thematically similar but pull the paragraph in a different direction.

---

## 2. Types of "Odd" Sentences

### Type 1 — Off-Topic

**What it is:** The sentence talks about something genuinely different from the others.

**Vibe:** This is the easiest type — usually the topic shift is obvious if you read carefully. Don''t overthink it; if a sentence introduces a new subject that the others don''t mention, it''s the odd one.

**Example:** Four sentences describe air pollution causes; the fifth describes water pollution levels. The water-pollution sentence is odd, even though both are environmental.

---

### Type 2 — Wrong Tone or Stance

**What it is:** The sentence''s emotional tone or argumentative stance contradicts the rest.

**Vibe:** If four sentences criticize a policy (negative tone) and one praises it (positive tone), the praising sentence is odd — unless one of the other sentences explicitly signals a contrast with "however" or "on the other hand." Tone shifts without warning are a give-away.

**Example:** Four sentences describe the dangers of social media for teenagers; one mentions its educational benefits without any transition. The benefits sentence is odd.

---

### Type 3 — Wrong Time Frame or Sequence

**What it is:** The sentence''s time period or stage of argument doesn''t fit.

**Vibe:** In a paragraph describing a process or chronology, the odd sentence may refer to an entirely different time. If four sentences are set in modern India and one references ancient Mauryan administration, the ancient reference may be the odd sentence — unless the paragraph is explicitly historical comparison.

---

### Type 4 — Wrong Level of Specificity

**What it is:** The sentence is much more **general** or much more **specific** than the others.

**Vibe:** If four sentences give specific statistics and one offers a generic philosophical observation, the philosophical one may be odd. Or the reverse — a paragraph of broad claims with one oddly specific datum.

---

### Type 5 — Breaks Cause-Effect Chain

**What it is:** The sentence inserts an event/idea that doesn''t fit the cause-effect flow of the rest.

**Vibe:** If sentences A → B → C → D form a clear causal chain (A causes B, B leads to C, etc.) and sentence E sits outside this chain, E is odd.

---

## 3. Building the Theme Skeleton

### What the Paragraph Is "Doing"

**What it is:** The discourse function of the paragraph as a whole.

**Vibe:** Most exam paragraphs do one of these:
- **Describe** a phenomenon (its features, scope, examples)
- **Argue** for or against something (with reasons and evidence)
- **Narrate** a sequence of events
- **Explain** a cause-effect chain
- **Compare** two things

Once you know what the paragraph is doing, the odd sentence is the one that doesn''t help do it.

---

### Keyword Overlap Test

**What it is:** Counting which keywords or noun phrases recur across sentences.

**Vibe:** Highlight the main noun in each sentence. The sentence whose main noun appears in **no other sentence** is suspect. Conversely, the sentence whose noun appears in 3+ other sentences is likely central.

**Example:**
- S1: …rising sea levels…
- S2: …coastal flooding…
- S3: …glacial melting…
- S4: …deforestation in tropical regions…
- S5: …island nations submerging…

S4 mentions deforestation — a different climate issue. The other four all relate directly to sea level and coastal effects. S4 is odd.

---

## 4. Coherence-Breaking Signals

### Internal Pronouns Without Antecedent

**What it is:** A sentence uses "he/she/it/this" but no other sentence introduces what it refers to.

**Vibe:** If the supposed antecedent isn''t anywhere in the other sentences, the sentence with the dangling pronoun is the odd one — it was orphaned from a different paragraph.

---

### Connector with No Match

**What it is:** A sentence opens with "however / on the contrary / for example" but no other sentence sets up the contrast or claim being illustrated.

**Vibe:** "However" requires a prior statement to contradict. "For example" requires a prior claim to illustrate. If the supposed contrast or claim is missing, the connector-bearing sentence is misplaced — possibly the odd one.

---

### New Named Entity

**What it is:** A sentence introduces a person, organization, or place that no other sentence references.

**Vibe:** Paragraphs are usually about a small set of entities. A newly named entity that doesn''t recur is suspect — unless its purpose is clearly illustrative.

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Four sentences share a topic, one is on a different topic | The different-topic sentence is odd |
| Four sentences have negative stance, one is positive (no contrast connector) | The positive-stance sentence is odd |
| Four sentences are in present, one is in distant past (no historical frame) | The past-tense sentence is odd |
| Four sentences give specific data, one is a generic philosophical line | Generic line is odd |
| Sentence opens with "however" but no preceding contrast exists | That sentence is odd |
| Sentence uses pronoun whose antecedent appears nowhere else | That sentence is odd |
| Sentence introduces a name/entity mentioned nowhere else | Possibly odd (test against theme) |
| All sentences fit the theme uniformly | Re-read; check for subtle tone shift |

---

## 6. Common Traps

- **Trap — The closest-to-theme sentence:** Often the odd sentence **looks** highly relevant but, on close reading, addresses a slightly different aspect. Don''t accept surface relevance — demand exact theme match.
- **Trap — Eliminating the truth:** Students sometimes mark a sentence "odd" because they personally disagree with its claim. Truth is irrelevant — only **fit with the paragraph** matters.
- **Trap — Mistaking style for oddity:** A sentence can be in a different style (more formal, more vivid) but still topically central. Don''t mark on style alone.
- **Trap — Picking the first sentence as odd:** Students unfamiliar with the format sometimes assume the topic sentence is odd because it''s broader. The topic sentence often legitimately sets the frame.
- **Trap — Overthinking equally-fitting sentences:** If you can''t decide, look for **connector violations** (a "however" with no contrast, a "this" with no antecedent) — these are the cleanest tells.

---

## 7. Coherence Quick-Check Tools

| Tool | How to use |
|---|---|
| **Keyword highlighting** | Mark the main noun in each sentence; spot the outlier |
| **Tone scoring** | Tag each sentence + / − / 0; the odd one has a different tag |
| **Connector audit** | Check every "however / for example / this" — does it have a match? |
| **Time-frame check** | Are all sentences in the same era / stage? |
| **Discourse function** | Is each sentence describing / arguing / explaining the same thing? |

---

## 8. A Worked Example

**Sentences:**
- **A.** Bengaluru has rapidly emerged as India''s premier technology hub over the past two decades.
- **B.** The city now hosts the regional headquarters of most major IT multinationals.
- **C.** Pune, often called the Oxford of the East, has a long tradition of higher education.
- **D.** Software exports from Bengaluru account for nearly 40% of India''s total IT revenue.
- **E.** The city''s startup ecosystem is ranked among the top ten globally.

**Theme of A, B, D, E:** Bengaluru as India''s tech hub. Each sentence supports this with a specific claim.

**Sentence C:** Talks about Pune as an education hub. Different city, different theme.

**Answer:** C is the odd one.

> ⚡ **EXAM TIP:** Identify the **subject noun** of each sentence first. Four sentences will share a subject (or close variants); the fifth will not. That''s almost always the odd sentence.

> ⚡ **EXAM TIP:** Watch for sentences that are **almost** on theme but pull sideways. The exam rarely uses obviously off-topic sentences — the odd one is usually adjacent to the theme but doesn''t directly advance it.
', '2'),
  ('D8', 'ENG8.1', 'Synonyms, Antonyms & Contextual Word Usage', 'In word-swap, the wrong word looks confidently right — read literally and ask if its plain meaning conflicts with the sentence.', '# LO 8.1: Synonyms, Antonyms & Contextual Word Usage

> Vocabulary questions in SSC/IBPS/Banking come in three forms: a word in isolation needing a synonym/antonym, a sentence with a word that must be replaced (word swap), or a sentence with an underlined word whose meaning must be identified. The unifying skill is **knowing word meaning + sensing word context** — pure rote learning fails when context matters.

---

## 1. Synonyms — Same Meaning, Different Words

### Levels of Synonymy

**What it is:** Words can share meaning at three levels — **identical, near, or remote**.

**Vibe:** True identical synonyms are rare. Most "synonyms" share core meaning but differ in **shade, intensity, or register**:
- **Big / large / huge / massive** — identical core meaning, escalating intensity
- **Begin / start / commence / initiate** — same meaning, formality increases left to right
- **Smart / clever / intelligent / brilliant** — same idea, increasing depth
- **Tired / exhausted / drained / weary** — escalating fatigue

For exam isolation questions, pick the **closest core meaning**; intensity matters less. For in-sentence usage, the **shade** matters most.

---

### High-Frequency Synonym Sets

**What it is:** Word groups the exam reuses across years.

**Vibe:** Master these 25 sets — they cover 60% of synonym questions:

| Core word | Common synonyms |
|---|---|
| **Abate** | diminish, lessen, subside, decrease, ebb |
| **Abundant** | plentiful, ample, copious, profuse, bountiful |
| **Acrimonious** | bitter, hostile, rancorous, caustic, harsh |
| **Adept** | skilled, proficient, expert, accomplished |
| **Admonish** | reprimand, scold, rebuke, chide, warn |
| **Alleviate** | ease, relieve, lessen, mitigate, soothe |
| **Amalgamate** | merge, combine, unite, fuse, blend |
| **Ambiguous** | unclear, vague, equivocal, obscure |
| **Apathy** | indifference, lethargy, disinterest, unconcern |
| **Audacious** | bold, daring, fearless, intrepid, brazen |
| **Belligerent** | hostile, aggressive, combative, pugnacious |
| **Benevolent** | kind, generous, charitable, benign |
| **Candid** | frank, honest, open, straightforward |
| **Capricious** | unpredictable, whimsical, fickle, volatile |
| **Clandestine** | secret, covert, surreptitious, stealthy |
| **Coerce** | force, compel, pressure, intimidate |
| **Concise** | brief, succinct, terse, pithy |
| **Diligent** | hardworking, industrious, assiduous |
| **Eloquent** | articulate, expressive, fluent, persuasive |
| **Frugal** | thrifty, economical, sparing, prudent |
| **Lethargic** | sluggish, lazy, listless, languid |
| **Meticulous** | careful, thorough, painstaking, precise |
| **Reluctant** | unwilling, hesitant, averse, disinclined |
| **Tenacious** | persistent, determined, dogged, resolute |
| **Vehement** | intense, passionate, fervent, forceful |

---

## 2. Antonyms — Opposite in Meaning

### Direct Opposites vs Counterparts

**What it is:** A direct opposite reverses meaning fully; a counterpart shifts meaning along one dimension.

**Vibe:** Some pairs are pure opposites: **hot / cold, dead / alive, present / absent**. Others are counterparts in a spectrum: **hot / warm / cool / cold** — pick the most distant point for antonym questions.

For exam questions, the right answer is usually the **strongest opposite available**, not a mild contrast.

---

### High-Frequency Antonym Pairs

**What it is:** Word pairs the exam tests repeatedly.

**Vibe:** Master these 25 pairs:

| Word | Antonym |
|---|---|
| **Abundant** | scarce, scant, sparse, meager |
| **Affluent** | poor, destitute, impoverished, indigent |
| **Augment** | reduce, diminish, lessen, curtail |
| **Benevolent** | malicious, cruel, malevolent |
| **Cautious** | reckless, rash, careless, impulsive |
| **Concur** | disagree, dissent, oppose, differ |
| **Condemn** | praise, commend, laud, applaud |
| **Conceal** | reveal, disclose, expose, divulge |
| **Coward** | brave, fearless, valiant, courageous |
| **Defend** | attack, assault, criticize |
| **Diligent** | lazy, idle, slothful, indolent |
| **Eloquent** | inarticulate, tongue-tied, mute |
| **Frugal** | extravagant, wasteful, lavish, prodigal |
| **Generous** | stingy, miserly, parsimonious, mean |
| **Honest** | dishonest, deceitful, fraudulent |
| **Ignorant** | knowledgeable, learned, erudite |
| **Innocent** | guilty, culpable, blameworthy |
| **Liberty** | bondage, captivity, slavery |
| **Modest** | arrogant, boastful, vain, conceited |
| **Optimist** | pessimist, cynic, defeatist |
| **Praise** | criticize, blame, censure, condemn |
| **Reveal** | conceal, hide, mask, cloak |
| **Tedious** | exciting, interesting, engaging |
| **Triumph** | defeat, failure, loss |
| **Wise** | foolish, unwise, imprudent |

---

## 3. Contextual Word Usage (Word Swap)

### What Word Swap Tests

**What it is:** A sentence in which one or more words must be replaced — the words are grammatically correct but **semantically wrong** in context.

**Vibe:** This is the hardest vocabulary type because grammar gives no clue. You have to **read for meaning**: does the word actually mean what the sentence requires? If a sentence says "She **acquitted** the guests warmly," the word looks fine grammatically but is wrong — "acquitted" means "freed from charge." The right word is "greeted."

---

### Common Word-Swap Confusions

**What it is:** Pairs of words that look or sound similar but mean different things.

**Vibe:** Memorize these — the exam recycles them every paper:

| Word | Meaning | Often confused with |
|---|---|---|
| **Affect** (verb) | to influence | **Effect** (noun) — a result |
| **Accept** | to receive willingly | **Except** — excluding |
| **Adapt** | to adjust | **Adopt** — to take up as one''s own |
| **Adverse** | unfavourable | **Averse** — opposed to |
| **Allude** | to refer indirectly | **Elude** — to escape |
| **Beside** | next to | **Besides** — in addition to |
| **Compliment** | praise | **Complement** — completes |
| **Council** | a body of people | **Counsel** — advice / advise |
| **Disinterested** | impartial | **Uninterested** — bored |
| **Eminent** | famous | **Imminent** — about to happen |
| **Farther** | physical distance | **Further** — additional / metaphor |
| **Fewer** | for countables | **Less** — for uncountables |
| **Loose** | not tight | **Lose** — fail to keep |
| **Personal** | private | **Personnel** — staff |
| **Precede** | come before | **Proceed** — go forward |
| **Principal** | chief / head | **Principle** — a rule |
| **Stationary** | not moving | **Stationery** — writing materials |
| **Their / there / they''re** | possessive / place / "they are" | — |
| **Then** | time | **Than** — comparison |

**Exam Keywords:** "He was an imminent scientist" → wrong; "eminent." "I will counsel you tomorrow" might be correct (advise) or might need "council" if the sentence is about an assembly.

---

### Reading for Word-Swap

**What it is:** A systematic scan technique for word-swap questions.

**Vibe:** Read each underlined word and ask:
- **Does this word''s literal meaning match the sentence''s intent?**
- Could the writer have meant a similar-sounding word?
- Does the sentence contradict itself if I take this word literally?

If yes to any, you''ve found the swap target. Often two words need swapping with each other (e.g., "compliment" and "complement" exchanged in the same sentence).

---

## 4. Contextual Synonym Selection

### When Two Synonyms Both "Fit"

**What it is:** A sentence offers options that are all synonyms of the underlined word — but only one fits the **specific sense** used.

**Vibe:** Words have **multiple senses**. The right synonym matches the **active sense** in the sentence:

- "She **ran** for office" — sense = "campaigned" (not "sprinted")
- "He **ran** a small business" — sense = "managed" (not "operated physically")
- "The river **ran** through the valley" — sense = "flowed"
- "The dye **ran** in the wash" — sense = "leaked / spread"

If the options include "campaigned, sprinted, managed, flowed" — pick the one matching the **sense** in context.

---

### Register Match

**What it is:** Picking a synonym whose formality matches the sentence''s tone.

**Vibe:** A casual sentence ("He got the answer right away") wants "received / got." A formal sentence ("She \_\_\_\_ a commendation from the President") wants "received" — never "got." Always read the surrounding sentence for register.

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Two options share core meaning; differ in intensity | Match intensity to sentence''s emotional cues |
| Word is positive in tone; options include neg/pos synonyms | Pick positive synonym only |
| Sentence is formal; options include casual + formal synonyms | Pick formal synonym |
| Sentence''s underlined word has a similar-sounding confusion | Check if confused word is the right meaning |
| Word swap question: word looks fine but contradicts sentence''s meaning | That''s the swap target |
| Antonym choice question; multiple opposites available | Pick the strongest, most direct opposite |
| "Affect / effect / accept / except" appear | Test for noun vs verb usage |
| Word''s literal meaning doesn''t fit sentence''s intent | It needs swapping |

---

## 6. Common Traps

- **Trap — Dictionary-perfect synonym, sentence-wrong:** A word that''s a true synonym in one sense may not be a synonym in the sentence''s sense. Always test in context.
- **Trap — Same prefix / suffix illusion:** "Conjure" and "conjugate" share a prefix but mean entirely different things. Don''t pick by spelling resemblance.
- **Trap — Strong vs weak opposite:** When choosing antonyms, "scant" is a stronger opposite of "abundant" than "less." Pick the strongest.
- **Trap — Near-synonym dressed as the answer:** The exam often lists three synonyms and one near-miss. The near-miss is the trap.
- **Trap — Modern vs archaic usage:** Some words have shifted meaning. "Awful" once meant awe-inspiring; today it means terrible. Trust modern usage unless the passage is clearly archaic.

---

## 7. Quick-Win Word List by Theme

| Theme | Power Words |
|---|---|
| **Praise** | laud, commend, extol, applaud, hail, acclaim |
| **Criticize** | denounce, condemn, censure, decry, rebuke, lambast |
| **Increase** | augment, escalate, amplify, magnify, surge, bolster |
| **Decrease** | diminish, dwindle, wane, abate, curtail, taper |
| **Hide** | conceal, camouflage, shroud, veil, obscure |
| **Reveal** | disclose, divulge, unveil, expose, betray |
| **Brave** | valiant, intrepid, audacious, dauntless, gallant |
| **Cowardly** | timorous, pusillanimous, faint-hearted, craven |
| **Skilled** | adept, deft, proficient, accomplished, dexterous |
| **Lazy** | indolent, slothful, lethargic, languid |
| **Generous** | magnanimous, munificent, benevolent, philanthropic |
| **Stingy** | miserly, parsimonious, niggardly, frugal (mild) |

> ⚡ **EXAM TIP:** Before answering any synonym/antonym question, mentally **place the word in a sentence**. If you can''t, your understanding is shaky — and you''re guessing. Reading practice builds this instinct.

> ⚡ **EXAM TIP:** For word-swap questions, the wrong word often **looks confidently right** — that''s why it slipped past the editor. Read literally; if any word''s plain meaning conflicts with the sentence''s intent, it''s the answer.
', '1'),
  ('D8', 'ENG8.2', 'Idioms, Phrases, One-Word Substitution & Spelling', 'For idioms, never pick the literal-meaning option — idioms are figurative by definition.', '# LO 8.2: Idioms, Phrases, One-Word Substitution & Spelling

> These four sub-skills are pure memorization plus light context-checking. Idioms must be learned as **whole units** (you can''t deduce them word by word). One-word substitution rewards a wide vocabulary. Spelling tests whether you know the standard form of commonly confused words.

---

## 1. Idioms & Phrases — Whole-Unit Meaning

### What an Idiom Is

**What it is:** A fixed expression whose meaning **cannot** be guessed from individual words.

**Vibe:** "Kick the bucket" doesn''t involve a foot or a bucket — it means "to die." "Once in a blue moon" doesn''t refer to a colored moon — it means "rarely." Idioms must be learned as units; literal interpretation always fails. The exam tests whether you recognize the idiom and pick the option that **paraphrases** it.

---

### High-Frequency Idioms (Memorize These 40)

**What it is:** Idioms recycled across SSC/IBPS papers.

| Idiom | Meaning |
|---|---|
| **A bolt from the blue** | a sudden, unexpected event |
| **A piece of cake** | very easy |
| **At the eleventh hour** | at the last possible moment |
| **Beat about the bush** | avoid the main topic |
| **Bite the bullet** | endure a difficult situation bravely |
| **Bury the hatchet** | end a dispute, make peace |
| **By and large** | mostly, in general |
| **Call a spade a spade** | speak plainly, frankly |
| **Cut corners** | do something cheaply or poorly to save effort |
| **Down in the dumps** | feeling sad |
| **Face the music** | accept criticism / consequences |
| **Get cold feet** | become nervous, lose courage |
| **Go to the dogs** | deteriorate, decline |
| **Hit the nail on the head** | identify exactly what''s right |
| **In a nutshell** | briefly, summarily |
| **In the long run** | over an extended period |
| **Jump on the bandwagon** | join a popular trend |
| **Keep an eye on** | watch carefully |
| **Let the cat out of the bag** | reveal a secret |
| **Look down upon** | regard with contempt |
| **Make a clean breast of** | confess everything |
| **Make ends meet** | manage on a limited budget |
| **Off the cuff** | spontaneous, unprepared |
| **On cloud nine** | extremely happy |
| **Out of the blue** | unexpectedly |
| **Pass the buck** | shift responsibility to someone else |
| **Pull strings** | use influence to get something done |
| **Put one''s foot down** | refuse firmly |
| **Rain cats and dogs** | rain very heavily |
| **Read between the lines** | understand the hidden meaning |
| **Ring a bell** | sound familiar |
| **See eye to eye** | agree |
| **Smell a rat** | suspect something is wrong |
| **Spill the beans** | reveal a secret |
| **Take with a pinch of salt** | not take entirely seriously |
| **The lion''s share** | the largest portion |
| **Through thick and thin** | through all difficulties |
| **Turn a blind eye** | ignore deliberately |
| **Under the weather** | feeling unwell |
| **Walk on eggshells** | be very careful not to upset |

---

### Idiom Recognition Process

**What it is:** A scan technique for idiom questions.

**Vibe:**
- Read the sentence; identify the **fixed phrase** (usually 3–5 words that feel unusual)
- Ask: "Does this phrase make literal sense?" If no, it''s almost certainly an idiom
- Recall the figurative meaning
- Match it to one of the four options

If you don''t know the idiom, eliminate options that **describe the literal action** of the phrase — these are always traps.

**Exam Keywords:** "He took the bull by the horns" → don''t pick "rode a bull" (literal trap) → pick "confronted the problem directly."

---

## 2. One-Word Substitution

### What It Is

**What it is:** A phrase or description is given, and you must pick the single word that captures it precisely.

**Vibe:** This is a vocabulary breadth test. The exam recycles the same 200-300 substitutions. Memorize categories:

---

### People — Professions, Traits, Beliefs

| Description | One Word |
|---|---|
| Someone who studies plants | botanist |
| Someone who studies stars | astronomer |
| Someone who walks in sleep | somnambulist |
| Someone who cannot make a mistake | infallible |
| Someone who eats everything | omnivore |
| Someone who eats only vegetables | vegetarian |
| Someone who eats human flesh | cannibal |
| Someone who hates mankind | misanthrope |
| Someone who loves mankind | philanthropist |
| Someone who believes in God | theist |
| Someone who doesn''t believe in God | atheist |
| Someone who is doubtful about God''s existence | agnostic |
| Someone speaking many languages | polyglot |
| Someone who writes about their own life | autobiographer |
| Someone good at many things | versatile |
| Someone who is new to a profession | novice / neophyte |
| Someone who collects coins | numismatist |
| Someone who collects stamps | philatelist |
| Someone who cannot read or write | illiterate |
| Someone who looks on the bright side | optimist |
| Someone who looks on the dark side | pessimist |

---

### Places & Conditions

| Description | One Word |
|---|---|
| A place where books are kept | library |
| A place where animals are kept for show | zoo / menagerie |
| A place where birds are kept | aviary |
| A place where dead bodies are kept | mortuary |
| A place where bees are kept | apiary |
| A list of dishes available | menu |
| A medicine that kills germs | antiseptic |
| Government by the people | democracy |
| Government by a king | monarchy |
| Government by a few | oligarchy |
| Government by the rich | plutocracy |
| Government by religious leaders | theocracy |
| Rule by no one (chaos) | anarchy |

---

### Actions & States

| Description | One Word |
|---|---|
| To give up one''s throne | abdicate |
| Words spoken on the spur of the moment | extempore |
| To free from blame | exonerate |
| To take in food | ingest |
| To send out of one''s country | exile / banish |
| To call back | recall |
| To bring something back to life | revive / resuscitate |
| To make holy | sanctify / consecrate |
| One who is greedy | avaricious / covetous |
| Capable of being broken | breakable / fragile |
| Capable of being heard | audible |
| Capable of being seen | visible |
| Cannot be defeated | invincible |
| Cannot be read | illegible |

---

## 3. Spelling — Standard Forms

### Commonly Misspelled Words

**What it is:** Words students consistently spell wrong; the exam offers four options with subtle errors.

**Vibe:** Memorize the correct form letter by letter — there''s no rule to derive it. High-frequency errors:

| Correct | Wrong forms to reject |
|---|---|
| **accommodation** | accomodation, accomadation |
| **acquaintance** | aquaintance, acquaintence |
| **bureaucracy** | beuracracy, bureucracy |
| **business** | buisness, bussiness |
| **calendar** | calender, calandar |
| **cemetery** | cemetary, cemetry |
| **committee** | comitee, committe |
| **conscience** | conscious (different word), consceince |
| **definitely** | definately, definatly |
| **embarrass** | embarass, embarras |
| **environment** | enviroment, environement |
| **exaggerate** | exagerate, exaggarate |
| **government** | goverment, governmant |
| **harass** | harrass, harras |
| **hierarchy** | heirarchy, hierachy |
| **independent** | independant, indipendant |
| **maintenance** | maintainance, maintenence |
| **millennium** | millenium, milennium |
| **necessary** | neccessary, necesary |
| **occasion** | occassion, ocasion |
| **occurrence** | occurence, occurrance |
| **parallel** | paralel, parellel |
| **privilege** | privelege, priviledge |
| **questionnaire** | questionaire, questionnair |
| **receive** | recieve, receeve |
| **referred** | refered, refferred |
| **separate** | seperate, separete |
| **succeed** | succede, suceed |
| **tomorrow** | tommorrow, tomorow |
| **until** | untill |

---

### "I before E" and Other Mini-Rules

**What it is:** Spelling heuristics for common patterns.

**Vibe:**
- **"I before E except after C"**: believe, achieve, friend — but receive, deceive, conceive (after C → ei)
- Exceptions: weird, seize, either, neither, leisure, foreign (memorize)
- Doubling final consonant when adding -ed / -ing: short vowel + single consonant → double (run → running, plan → planned). Long vowel → no double (read → reading)
- Words ending in silent E drop the E before vowel suffixes: hope → hoping, write → writing
- Words ending in Y after consonant change Y → I before suffixes: happy → happier, study → studied. Y after vowel stays: play → played

---

### Homophones (Sound-Alike Spelling Confusion)

**What it is:** Different-meaning words pronounced the same.

**Vibe:** The exam loves these:

| Homophones | Meanings |
|---|---|
| **Bear / bare** | tolerate, animal / uncovered |
| **Brake / break** | slow down / shatter, pause |
| **Cite / sight / site** | quote / vision / location |
| **Compliment / complement** | praise / completes |
| **Dual / duel** | two-fold / a fight |
| **Hair / hare** | head growth / rabbit |
| **Hole / whole** | gap / complete |
| **Knight / night** | warrior / dark time |
| **Pair / pare / pear** | two / trim / fruit |
| **Plain / plane** | simple, flat land / aircraft |
| **Principal / principle** | head / rule |
| **Right / write / rite** | correct / scribe / ritual |
| **Stationary / stationery** | unmoving / writing materials |
| **Their / there / they''re** | possessive / place / contraction |
| **Weather / whether** | climate / if |

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Sentence has 3-5 words that don''t make literal sense | Idiom present; pick figurative meaning |
| Options include literal description of the idiom | Trap — pick the figurative match |
| One-word question asks for "place where ___" | Memorized list (library, aviary, apiary, etc.) |
| One-word question asks for "person who ___" | Memorized list (philanthropist, misanthrope, etc.) |
| Spelling options differ in double consonants | Apply rule: short vowel doubles, long vowel doesn''t |
| "Receive / believe / friend" type words | "I before E except after C" |
| Two options sound the same but mean different things | Homophone — check meaning in sentence |
| Idiom unknown but options visible | Eliminate literal-meaning options first |

---

## 5. Common Traps

- **Trap — Picking the literal meaning of an idiom:** "Eat humble pie" doesn''t mean to eat pie. The literal option is always a distractor.
- **Trap — Near-miss one-word substitutions:** "Misanthrope" (hates mankind) vs "misogynist" (hates women). The exam may offer both — read the description carefully.
- **Trap — Confused homophones in word-swap:** Sentences like "He gave his complement to the chef" (wrong — should be "compliment").
- **Trap — Singular vs double consonants:** "Embarrass" has two R''s and two S''s. "Harass" has one R and two S''s. The exam will offer "embarass / harrass" to trick you.
- **Trap — Foreign loanwords with unusual spelling:** Memorize: bureaucracy, hierarchy, rendezvous, entrepreneur, questionnaire — no spelling rule explains these.

---

## 6. One-Word Substitution — Quick-Win Set

| Description | Word |
|---|---|
| Speech delivered without preparation | extempore |
| Words spoken to one''s self | soliloquy / monologue |
| Animal living in water | aquatic |
| Animal living on land | terrestrial |
| Animal living on both | amphibian |
| One who studies the past | historian |
| One who studies rocks | geologist |
| One who studies weather | meteorologist |
| One who studies elections / voting | psephologist |
| Words written on a tomb | epitaph |
| A short stay at a place | sojourn |
| Lasting for a very short time | ephemeral / transient |
| One who hates women | misogynist |
| One who hates marriage | misogamist |
| One who studies maps | cartographer |
| A drug that produces sleep | sedative / soporific |
| The science of human races | ethnology |
| Existing at the same time | contemporary |
| Animal that eats grass | herbivore / graminivorous |

> ⚡ **EXAM TIP:** For idioms, **never** pick the option that describes the literal action of the idiom''s words. Idioms are figurative by definition — literal options are always wrong.

> ⚡ **EXAM TIP:** Build a spelling diary. Whenever you misspell a word in practice, write it correctly three times. The exam recycles the same 50-100 problem words.
', '2'),
  ('D9', 'ENG9.1', 'Single Fillers — Vocabulary & Grammar', 'Predict the answer before looking at options; reverse engineering avoids attractive-but-wrong distractors.', '# LO 9.1: Single Fillers — Vocabulary & Grammar

> A single-filler question is one sentence with one blank and four options. The win condition: pick the word whose **meaning, grammar, and word-partner** all fit. Most students solve fillers by "what sounds right" — that''s how they miss easy points. The disciplined method below makes single fillers nearly automatic.

---

## 1. The Filler Decision Tree

### Step 1 — Identify the Blank Type

**What it is:** Decide whether the blank needs a **vocabulary word** or a **grammar word**.

**Vibe:** Look at the four options:
- All four are nouns / verbs / adjectives with different meanings → **vocabulary filler**
- All four are articles, prepositions, conjunctions, pronouns → **grammar filler**
- Options are phrasal verbs → **phrasal verb filler**

The solution method differs by type — don''t mix them.

---

### Step 2 — For Vocabulary Fillers, Find the Anchor Word

**What it is:** The word in the sentence that **most constrains** the answer.

**Vibe:** Every sentence has 1-2 words that tell you what the blank must mean. They might be:
- An **adjective** describing the blank''s noun (a "modest" \_\_\_\_ → must mean "person/sum/amount of small size")
- A **verb** the blank acts on (he \_\_\_\_ the proposal → must be a verb that can be done to a proposal)
- A **time / tone marker** (suddenly, gradually, fiercely → match intensity)
- A **connector** (however, because, despite → flip or follow direction)

Find the anchor, then test each option against it.

---

### Step 3 — For Grammar Fillers, Apply the Rule

**What it is:** Use the grammar rule that fits the slot.

**Vibe:** Grammar fillers always have one correct answer determined by:
- **Article** → sound rule + specificity rule
- **Preposition** → fixed collocation
- **Conjunction** → relationship between the two clauses
- **Pronoun** → number + case + antecedent

These never depend on personal taste — only rules.

---

## 2. Vocabulary Single Fillers

### Sub-Type — Verb Fillers

**What it is:** The blank is a verb; options are four verbs with shades of difference.

**Vibe:** Match the verb''s intensity, register, and connotation to the rest of the sentence. Example:

> The government decided to \_\_\_\_ the new policy after months of debate. (a) implement (b) start (c) try (d) begin

Reasoning: "After months of debate" implies a formal, deliberate decision; "implement" beats "start" / "try" / "begin" on register. Answer: **(a) implement**.

---

### Sub-Type — Adjective Fillers

**What it is:** The blank is an adjective; options are four with shades.

**Vibe:** Check three things — does the adjective match (1) intensity, (2) tone, (3) the noun it describes?

Example:
> Her speech was so \_\_\_\_ that the audience gave a standing ovation. (a) good (b) impressive (c) decent (d) acceptable

Reasoning: "Standing ovation" requires a strong positive — "impressive" beats "good / decent / acceptable." Answer: **(b) impressive**.

---

### Sub-Type — Noun Fillers

**What it is:** The blank is a noun; options are four with related but distinct meanings.

**Vibe:** The clue is the **action done to** the noun and the **modifier** before it.

Example:
> The committee reached a \_\_\_\_ after extensive discussion. (a) decision (b) destination (c) location (d) construction

Reasoning: "Reached a" + post-discussion → "decision" is the only one that pairs naturally with discussion. Answer: **(a) decision**.

---

## 3. Grammar Single Fillers

### Article Fillers

**What it is:** Blank requires a / an / the / no article.

**Vibe:** Apply rules:
- Vowel sound following → **an**
- Consonant sound following → **a**
- Specific or already mentioned noun → **the**
- General plural / uncountable / proper name → **no article**

Example:
> She is \_\_\_\_ honourable lady. (a) a (b) an (c) the (d) no article

Reasoning: "Honourable" starts with silent H → vowel sound → **an**. Answer: **(b) an**.

---

### Preposition Fillers

**What it is:** Blank requires a specific preposition by collocation.

**Vibe:** No reasoning — memorized pairs:

Example:
> The court accused him \_\_\_\_ embezzlement. (a) of (b) for (c) with (d) about

Reasoning: "Accused of" is the fixed collocation. Answer: **(a) of**.

---

### Conjunction Fillers

**What it is:** Blank joins two clauses; pick the right relationship word.

**Vibe:** Read both clauses and ask: agreement, contrast, cause, effect, condition, time?

Example:
> He worked hard \_\_\_\_ he could not pass the exam. (a) so (b) but (c) because (d) and

Reasoning: Clauses contrast (worked hard / didn''t pass) → contrast connector → **but**. Answer: **(b) but**.

---

### Pronoun Fillers

**What it is:** Blank requires the right pronoun by number, case, person.

**Vibe:** Identify the antecedent, then pick matching number, gender, case (subject/object/possessive).

Example:
> Each of the students must submit \_\_\_\_ assignment by Friday. (a) their (b) his or her (c) its (d) them

Reasoning: "Each" is singular → singular pronoun → "his or her" in formal English. Answer: **(b) his or her**.

---

## 4. Phrasal Verb Fillers

### What It Is

**What it is:** The blank requires a particle (in, on, off, up, down, out, away, with) that completes a phrasal verb.

**Vibe:** Memorize high-frequency phrasal verbs (see ENG6.1 for the full set). The question gives you a verb + blank + context, and you must pick the right particle.

Example:
> The meeting was called \_\_\_\_ due to the storm. (a) in (b) off (c) on (d) up

Reasoning: "Call off" = cancel. Storm caused cancellation. Answer: **(b) off**.

---

### Common Particle Meanings

| Particle | Common functions |
|---|---|
| **up** | completion (eat up, drink up), increase (price went up), start (set up) |
| **down** | reduction (calm down, slow down), failure (break down), record (write down) |
| **off** | departure (set off), cancellation (call off), removal (take off) |
| **on** | continuation (carry on), wearing (put on), supporting (hang on) |
| **out** | departure (go out), distribution (hand out), discovery (find out) |
| **in** | entry (come in), submission (hand in), starting (begin) |
| **away** | distance (move away), permanent (give away), storage (put away) |
| **with** | agreement (go along with), tolerance (put up with) |

---

## 5. Eliminating Distractor Options

### When Two Options Both Fit Meaning

**What it is:** The exam often offers two near-synonyms; only one fits the **collocation** or **register**.

**Vibe:** Apply tiebreakers in order:
1. **Collocation match** — does the word naturally pair with the surrounding word?
2. **Register match** — formal context wants formal word
3. **Idiomatic match** — does the option create a standard phrase?
4. **Intensity match** — strong context wants strong word

If after all four checks two options still feel equal, pick the one with the **more specific** meaning.

---

### Eliminating Obvious Wrong Options

**What it is:** Quickly cutting options that fail basic checks.

**Vibe:**
- Wrong part of speech (verb option for an adjective slot) → cut
- Wrong tone (positive word in negative sentence) → cut
- Wrong tense (past tense in present-tense sentence) → cut
- Wrong number (plural noun for singular slot) → cut

In 5 seconds, two options usually drop out. The remaining two need the finer test.

---

## 6. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| All options are verbs with different shades | Match to anchor (object verb acts on / time marker) |
| All options are adjectives | Match to noun + intensity from rest of sentence |
| Options are articles | Apply sound + specificity rules |
| Options are prepositions | Use fixed collocation (memorize verb-prep pairs) |
| Options are conjunctions | Identify clause relationship (and/but/so/because) |
| Options are pronouns | Match number + gender + case + person |
| Options are phrasal verb particles | Recall phrasal verb''s idiomatic meaning |
| Two options seem equally good | Apply tiebreakers: collocation → register → intensity |
| Negative tone sentence | Cut all positive-tone options |
| Formal register sentence | Cut all casual options |

---

## 7. Common Traps

- **Trap — "Sounds right" reasoning:** Many students pick options that "sound natural" without checking rules or collocation. Sound is a weak signal; the exam loves to make the wrong answer sound smooth.
- **Trap — Ignoring the second clause:** In conjunction fillers, students read only the first clause and pick. Always read **both** clauses.
- **Trap — Picking by length / complexity:** Choosing the fanciest-looking option is a recipe for losses. Simple words are often correct.
- **Trap — Mixing up "since / for / from":**
  - **Since** = a starting point (since 2010, since Monday)
  - **For** = a duration (for five years, for two days)
  - **From** = a starting point with a reference to an endpoint (from 9 to 5)
- **Trap — Article-noun mismatch:** "An MBA" (correct — M sounds like vowel "em"); "A university" (correct — U sounds like consonant "yu"). Sound, not spelling.

---

## 8. High-Yield Filler Patterns

| Pattern | Likely Answer |
|---|---|
| "Despite his efforts, he \_\_\_\_ to succeed" | failed (contrast) |
| "He worked hard \_\_\_\_ he could succeed" | so that (purpose) |
| "Although she was tired, she \_\_\_\_ working" | continued / kept (concession) |
| "The crowd \_\_\_\_ in cheers as he scored" | erupted / burst (intensity) |
| "His health has been \_\_\_\_ lately" | deteriorating / declining (gradual negative) |
| "The committee will \_\_\_\_ the matter" | look into / investigate (formal action) |
| "Prices have \_\_\_\_ sharply this quarter" | risen / surged (intensity match) |
| "He gave a \_\_\_\_ reply" | curt / blunt (matches "gave a") |

> ⚡ **EXAM TIP:** Read the **full sentence first**, ignoring the blank. Decide what the blank **should mean** before looking at options. Then match the options to your prediction. Reverse engineering avoids being influenced by attractive-but-wrong choices.

> ⚡ **EXAM TIP:** Connector words (despite, although, however, because, so) carry the most meaning. Never skim past them — they decide the blank''s direction.
', '1'),
  ('D9', 'ENG9.2', 'Double Fillers & Sentence Completion', 'Test BOTH words of every pair — a perfect first word with a failing second word is the #1 trap.', '# LO 9.2: Double Fillers & Sentence Completion

> A double-filler question has two blanks in one sentence — and each option offers a pair of words. Only one pair fits **both** slots correctly. A sentence-completion question gives a sentence with a missing clause/phrase and four options to complete it. Both reward the same skill: **internal consistency** across two parts of one sentence.

---

## 1. Double Fillers — The Both-Words-Must-Fit Rule

### The Cardinal Principle

**What it is:** Both words in the pair must fit perfectly — if either word fails, eliminate the option.

**Vibe:** Students often pick a pair because one word fits perfectly, ignoring the other. **This is the #1 mistake.** Test both words independently first. If either fails, the pair fails — no matter how appealing the other word is.

---

### The Two-Pass Method

**What it is:** Test each option twice — once for blank 1, once for blank 2.

**Vibe:**
- **Pass 1:** Plug only the first word of each option into blank 1. Eliminate any pair whose first word clearly fails.
- **Pass 2:** Among surviving options, plug the second word into blank 2. The pair where both words work is the answer.

This filters out options that pass blank 1 but fail blank 2 — a common trap.

---

### Worked Example

**Sentence:**
> The minister \_\_\_\_ the protesters'' demands and \_\_\_\_ to negotiate a settlement.

**Options:**
- (a) accepted / refused
- (b) acknowledged / agreed
- (c) rejected / agreed
- (d) supported / declined

**Pass 1 (blank 1):**
- (a) "accepted the protesters'' demands" — possible
- (b) "acknowledged the protesters'' demands" — possible
- (c) "rejected the protesters'' demands" — possible
- (d) "supported the protesters'' demands" — possible

All four pass blank 1. Move to Pass 2.

**Pass 2 (blank 2):**
- (a) "accepted ... and refused to negotiate" — contradiction (why accept then refuse?)
- (b) "acknowledged ... and agreed to negotiate" — consistent (recognized concerns, willing to talk)
- (c) "rejected ... and agreed to negotiate" — contradiction
- (d) "supported ... and declined to negotiate" — contradiction (if supportive, why decline talks?)

**Answer: (b) acknowledged / agreed.**

The other three fail the internal-consistency check.

---

## 2. Parallel Structure in Double Fillers

### What Parallel Structure Means

**What it is:** Two parts of a sentence joined by "and / or / but / not only ... but also / either ... or" must be **grammatically and semantically similar**.

**Vibe:** If blank 1 is filled with a verb in -ing form, blank 2 must also be -ing (or whatever parallel form). Test:

> She enjoys \_\_\_\_ books and \_\_\_\_ documentaries.

Options like "to read / to watch" (infinitive pair) or "reading / watching" (gerund pair) both maintain parallel structure. Mixed pairs like "reading / to watch" break parallelism — always wrong.

---

### Parallel Connectors to Watch

| Connector | Parallel pair pattern |
|---|---|
| **Both ... and** | Both X and Y (same form) |
| **Either ... or** | Either X or Y |
| **Neither ... nor** | Neither X nor Y |
| **Not only ... but also** | Not only X but also Y |
| **As well as** | X as well as Y |
| **Rather than** | X rather than Y |
| **From ... to** | From X to Y |

If a double filler uses any of these, ensure the two blanks are in **matching form** (both nouns, both -ing verbs, both adjectives, etc.).

---

## 3. Contextual Double Fillers — Tone & Direction

### Contrasting Blanks

**What it is:** A sentence sets up a contrast; blank 1 and blank 2 must take **opposing senses**.

**Vibe:** Watch for connectors: "although / despite / however / on the other hand / whereas." When these appear between the two blanks, the words usually have opposite tones.

Example:
> Although he was \_\_\_\_, his work was surprisingly \_\_\_\_.

Pair must be opposite-toned: (lazy / brilliant), (modest / outstanding) — never (lazy / poor) or (modest / mediocre).

---

### Reinforcing Blanks

**What it is:** A sentence builds in one direction; blank 1 and blank 2 share the same tone.

**Vibe:** Watch for connectors: "and / moreover / furthermore / as well as / not only ... but also." When the sentence reinforces, blanks share tone.

Example:
> The new policy is both \_\_\_\_ and \_\_\_\_, addressing concerns from all sides.

Both blanks need positive tone: (comprehensive / balanced), (inclusive / equitable). Not (vague / harsh).

---

### Cause-Effect Blanks

**What it is:** Blank 1 establishes a cause; blank 2 must describe a consistent effect.

**Vibe:** Watch for connectors: "because / since / as / so / therefore / consequently / as a result."

Example:
> Because of the \_\_\_\_ drought, the crop yields have \_\_\_\_ dramatically.

Cause-effect must align: (severe / dropped), (prolonged / declined). Not (minor / dropped) or (severe / increased).

---

## 4. Sentence Completion Questions

### Format

**What it is:** A sentence with a missing **clause or phrase** (not just a word) and four full-clause options.

**Vibe:** This is a longer version of fillers. The right option must satisfy:
- **Grammatical fit** — verb tense, mood, voice match the rest of the sentence
- **Logical fit** — the completion makes sense given the sentence''s setup
- **Idiomatic fit** — the resulting full sentence sounds natural in formal English

---

### Common Sentence-Completion Patterns

**What it is:** Recurring sentence frames with predictable completion patterns.

**Vibe:**

| Sentence frame | Completion expected |
|---|---|
| "Hardly had he ... when ..." | past simple in the "when" clause |
| "No sooner had he ... than ..." | past simple after "than" |
| "If I were you, I would ..." | base verb (modal + base) |
| "Had I known earlier, I would have ..." | past participle (modal perfect) |
| "The more you practice, the better ..." | comparative form |
| "Not until X did Y ..." | inversion (auxiliary + subject + verb) |
| "It is high time ..." | past tense (subjunctive) |
| "She prefers X to Y" | noun / gerund, never infinitive after "to" |

---

### Inversion in Sentence Completion

**What it is:** When a negative/restrictive phrase starts a sentence, the auxiliary verb moves before the subject.

**Vibe:** Memorize these triggers — all require inverted word order:
- **Never** has he seen such beauty (not "he has never seen")
- **Hardly** had I arrived when the phone rang
- **Not only** does she sing, but she also dances
- **Seldom** do we see such talent
- **Only after** the meeting did he realize his mistake
- **No sooner** had he left than it started raining

Wrong: "Never he has seen..." — Correct: "Never has he seen..."

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Both blanks separated by "and / moreover" | Pair must share same tone |
| Both blanks separated by "but / although / however" | Pair must have contrasting tones |
| Both blanks linked by cause-effect connector | Pair must align cause → effect |
| Blanks linked by "both ... and" / "either ... or" | Same grammatical form needed |
| Sentence completion starts with "Hardly / No sooner / Never" | Need inversion in answer |
| Sentence completion starts with "If I were" | Need "would + base" |
| Sentence completion starts with "Had + subject" | Need "would have + V3" |
| One word fits perfectly but other word fails | Eliminate the pair |
| Pair fits both blanks but creates internal contradiction | Eliminate |

---

## 6. Common Traps

- **Trap — Falling for the "perfect first word":** A pair offers a beautiful word for blank 1 and a passable word for blank 2. Students grab the pair for blank 1''s appeal. **Always test blank 2 independently.**
- **Trap — Ignoring the connector:** "Despite his \_\_\_\_, he was \_\_\_\_" needs opposites. Students pick pairs of similar words because they didn''t notice "despite."
- **Trap — Subtle tense mismatch in sentence completion:** A completion option with the wrong tense feels "almost right." Always check tense alignment.
- **Trap — "Hardly ... than" mix-up:**
  - **Hardly ... when** (correct)
  - **No sooner ... than** (correct)
  - **Scarcely ... when** (correct)
  - **Hardly ... than** (wrong)
- **Trap — Misreading "the more ... the more":** Both halves take comparatives. "The more you read, the more you learn." Wrong: "the more you read, the most you learn."

---

## 7. Quick-Win Sentence Completion Patterns

| Frame | Standard Completion |
|---|---|
| "Hardly had X ___" | when Y (past simple) |
| "No sooner had X ___" | than Y |
| "Scarcely had X ___" | when Y |
| "If only I ___" | had + V3 (regret) or were (wish) |
| "It is time we ___" | past simple |
| "I wish I ___" | were / had + V3 |
| "He behaves as if ___" | were / past simple |
| "Lest he ___" | should + base |
| "Such ... that ___" | result clause |
| "So ... that ___" | result clause |
| "Too ... to ___" | infinitive base form |
| "Enough ... to ___" | infinitive base form |

---

## 8. Worked Example — Sentence Completion

**Sentence:**
> No sooner had the bell rung \_\_\_\_.

**Options:**
- (a) than the students rushed out
- (b) when the students rushed out
- (c) than the students would rush out
- (d) when the students were rushing out

**Analysis:**
- "No sooner ... than" is the fixed pair → eliminate (b) and (d) which use "when"
- Past simple needed after "than" (parallel with past perfect "had rung") → "would rush" in (c) wrong
- (a) uses past simple "rushed" — correct

**Answer: (a) than the students rushed out.**

> ⚡ **EXAM TIP:** For double fillers, never settle for an option until you''ve verified **both** words fit. If you eliminate by blank 1 alone, you''ll fall for traps where a single great word disguises a wrong pair.

> ⚡ **EXAM TIP:** For sentence completion starting with negative/restrictive phrases (Never, Hardly, Seldom, Not only, Only after), the answer **must** show inverted word order — auxiliary verb before subject. This is the easiest 1-mark tell.
', '2'),
  ('D10', 'ENG10.1', 'Phrase & Clause Matching from Two Columns', 'Validate each pairing on three layers: grammar, meaning, idiom. The exam crafts pairs that pass one and fail another.', '# LO 10.1: Phrase & Clause Matching from Two Columns

> A column-matching question gives two columns (A and B). Column A contains sentence beginnings (or one half of a phrase); Column B contains endings (or the other half). You must pair them correctly. The four options are pre-set pairings (e.g., A1-B3, A2-B1). Your task: validate each pairing on **grammar, meaning, and idiomatic fit** — then eliminate broken pairings.

---

## 1. The Matching Method

### Step 1 — Read Each Column Once

**What it is:** Skim Column A and Column B once each, in order, to grasp the pool of possibilities.

**Vibe:** Don''t try to match yet. Just understand what each fragment is **about** and what **grammatical form** it takes (does the half-sentence in Column A end in a verb? a preposition? a comma?). This 30-second read saves time later.

---

### Step 2 — Tag Each Column A Fragment

**What it is:** Mark each Column A entry with what it needs grammatically.

**Vibe:** A Column A fragment ending in "…that" expects a clause. Ending in a verb expects an object. Ending in "for / to / in / about" expects a noun or gerund. Ending in a comma after a participle expects a main clause.

This tagging tells you which Column B options are even **eligible** before you check meaning.

---

### Step 3 — For Each Pair, Run Three Tests

**What it is:** Validate each proposed pairing on three layers.

**Vibe:**
1. **Grammar test** — does the joined sentence work grammatically? (No tense clash, no subject-verb error, no broken article-noun chain.)
2. **Meaning test** — does the joined sentence make sense? Not absurd, not contradictory.
3. **Idiom test** — does the joined sentence form a natural English phrase, not a forced literal stitch?

A pair must pass all three. If any test fails, the pair is wrong.

---

### Step 4 — Cross-Check the Full Option

**What it is:** Once you find one or two solid pairs, verify the full answer option preserves them.

**Vibe:** Each option provides multiple pairings (e.g., A1-B3, A2-B1, A3-B2). If your verified pair (say A2-B1) appears in only one option, that option is likely correct. If it appears in two options, you need another locked pair to decide.

---

## 2. The Three Tests in Detail

### Grammar Test

**What it is:** Joining Column A and Column B must produce a grammatically clean sentence.

**Vibe:** Common failures to spot:
- **Tense clash:** A says "He had been working since 2010 and" + B says "now plans to retire" → tense mismatch unresolved
- **Subject-verb disagreement:** A''s subject is plural but B''s verb is singular
- **Preposition leftover:** A ends in "for" but B starts with another preposition
- **Article-noun gap:** A ends in "a" but B starts with a vowel-sound noun ("a apple" → wrong)
- **Pronoun reference broken:** B uses "he" but A''s subject is "she" or plural

If joining creates any of these errors, the pair fails.

---

### Meaning Test

**What it is:** The joined sentence must make logical sense in real-world terms.

**Vibe:** Sometimes grammar passes but meaning is absurd. Example:
- A: "The student studied diligently for months and"
- B: "decided to skip the exam altogether."

Grammatically fine. Logically absurd — why study hard then skip? Meaning test fails.

The exam loves these traps. After grammar passes, ask: **does a real human say things this way?**

---

### Idiom Test

**What it is:** The joined sentence must form a recognized English construction.

**Vibe:** Some pairings produce grammatically correct but stylistically wrong English. Example:
- A: "He was not only intelligent but"
- B: "also was very kind."

Grammar passes. But "not only ... but also" needs parallel structure → "but **also** kind" (drop the "was"). The pair has a parallelism error — idiom test fails.

---

## 3. High-Frequency Matching Patterns

### Cause → Effect

**What it is:** Column A presents a cause; Column B contains effects.

**Vibe:** Look for cause-signal words in A: "because of," "owing to," "due to," "as a result of." The effect in B should logically follow.

Example:
- A: "Due to the heavy monsoon rains" — needs an effect
- B options: "the streets were flooded" / "the harvest was excellent" / "tourism declined"

Pick the option matching the actual consequence of heavy rain in context — "flooded" is the most direct.

---

### Subject → Predicate

**What it is:** Column A has a subject phrase; Column B has the predicate (verb + completion).

**Vibe:** The verb in B must agree with A''s subject in number and tense. Watch for:
- A: "The team of doctors" (collective noun, treated as singular here) → B verb singular
- A: "A bouquet of flowers" → singular verb
- A: "The committee members" → plural verb

---

### Beginning → Completion (Idiom)

**What it is:** Column A starts an idiom; Column B completes it.

**Vibe:** Memorize idiom stems. Some are unmistakable:
- A: "Out of the blue" → "I received a phone call"
- A: "The early bird" → "catches the worm"
- A: "Once in a blue moon" → "we go to a fancy restaurant"

If A is a recognized idiom-stem, B must complete it in the standard way.

---

### Comparison → Object

**What it is:** Column A sets up a comparison; Column B provides what''s being compared.

**Vibe:** Look for comparison words in A: "more ... than," "less ... than," "as ... as," "the ... -er the ... -er."

Example:
- A: "She is more talented than" — needs comparison object
- B: "her sister" — fits; "she" — also fits; "more" — wrong

Watch case: after "than" or "as," informal English allows object case ("than her") but formal exams often expect subject case ("than she [is]").

---

### Conditional → Result

**What it is:** Column A is a conditional clause; Column B is the result.

**Vibe:** Apply conditional rules:
- A "If + present" → B "will + base"
- A "If + past" → B "would + base"
- A "If + past perfect" → B "would have + V3"

Mismatched conditionals fail the grammar test.

---

## 4. Distractor Analysis

### Why Wrong Options Look Right

**What it is:** The exam crafts wrong pairings that pass one or two tests but fail another.

**Vibe:** Common distractor types:
- **Grammar passes, meaning fails** — sentence sounds smooth but says something absurd
- **Meaning passes, grammar fails** — idea makes sense but tense / agreement / preposition wrong
- **Both pass for individual halves, but joining produces redundancy** — "He returned back to his home" (redundant — return already implies back)
- **Idiom half-completion** — uses 3 out of 4 words of a fixed idiom, swapping one

Train yourself to test all three layers; otherwise distractors will catch you.

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Column A ends in "because / due to / since" | Column B must state an effect / consequence |
| Column A ends in "although / despite" | Column B must state a contrasting result |
| Column A ends in "if + present tense" | Column B must use "will + base" |
| Column A ends in "if + past" | Column B must use "would + base" |
| Column A subject is singular (each / one of / news) | Column B verb must be singular |
| Column A starts a recognized idiom | Column B must complete the idiom exactly |
| Joined sentence is grammatically OK but absurd | Wrong pair — fails meaning test |
| Joined sentence creates redundancy ("return back," "free gift") | Wrong pair — fails idiom test |
| Two options preserve one verified pair | Need second verified pair to decide |
| Grammatical joining requires both halves to share tone (positive-positive) | Eliminate options that mix tones |

---

## 6. Common Traps

- **Trap — Grammar-only checking:** Students stop at "this joins grammatically" and pick. The meaning and idiom tests catch what grammar misses.
- **Trap — Tense mismatch hidden by distance:** When A is long, students forget A''s tense by the time they read B. Always re-check tense alignment.
- **Trap — Preposition continuity:** A ends "He was accused of" → B must start with a gerund or noun, not "with bribery" (double preposition).
- **Trap — Comparative fragments:** A says "She is far more intelligent" → B must contain "than" + comparison object, not a new sentence.
- **Trap — Apparent contradictions that are actually fine:** "Although he was tired, he kept working" — contradiction in surface but logically consistent (despite + persistence). Don''t reject pairs that are contrastive by design.

---

## 7. Worked Example

**Column A:**
1. Hardly had he reached home
2. Not only is she intelligent
3. The new policy will be implemented

**Column B:**
P. but she is also very kind
Q. only after extensive public consultation
R. when the phone rang

**Options:**
- (a) 1-P, 2-Q, 3-R
- (b) 1-R, 2-P, 3-Q
- (c) 1-Q, 2-R, 3-P
- (d) 1-P, 2-R, 3-Q

**Analysis:**
- A1 "Hardly had he reached home" — fixed pair: "Hardly ... when" → B must start with "when" → R ("when the phone rang"). Locked: **1-R**.
- A2 "Not only is she intelligent" — fixed pair: "not only ... but also" → B must start with "but also" or "but ... also" → P ("but she is also very kind"). Locked: **2-P**.
- A3 "The new policy will be implemented" — needs adverb / time clause → Q ("only after extensive public consultation"). Locked: **3-Q**.

**Answer:** 1-R, 2-P, 3-Q = **(b)**.

---

## 8. Memorized Pair-Starters (Always Reliable)

| Column A starter | Column B starter |
|---|---|
| Hardly had X ... | when Y |
| No sooner had X ... | than Y |
| Scarcely had X ... | when Y |
| Not only ... | but also |
| Both X ... | and Y |
| Either X ... | or Y |
| Neither X ... | nor Y |
| Such X ... | that Y |
| So X ... | that Y |
| Too X ... | to Y |
| If X ... | then Y / will Y / would Y / would have Y |
| The more X ... | the more / less Y |
| Lest X ... | should Y |

These are **always** the right pairings when both halves appear — the rest of the test is just confirming the meaning fits.

> ⚡ **EXAM TIP:** When Column A contains a recognized fixed-pair starter (Hardly / No sooner / Not only / Either / Neither / Such / So / Too / Lest), Column B''s other half is **determined** — don''t bother testing other pairings.

> ⚡ **EXAM TIP:** Run all three tests (grammar / meaning / idiom) before locking a pair. The exam crafts options that pass one test and fail another — checking only one is how students lose easy marks.
', '1'),
  ('D11', 'ENG11.1', 'Sentence Joining & Connector Usage', 'Name the relationship (contrast/cause/condition) before picking the connector. Default to "and" only for neutral addition.', '# LO 11.1: Sentence Joining & Connector Usage

> A sentence-joining question gives two short sentences and asks you to combine them into one using the right connector — **or** gives one combined sentence with a connector blank and four options. Both forms test the same skill: knowing **which connector reflects the actual relationship** between two ideas.

---

## 1. The Relationship Map

### Step 1 — Identify the Relationship

**What it is:** Before picking a connector, name the relationship between the two ideas.

**Vibe:** Every pair of clauses has exactly one primary relationship. Ask:
- Do they **agree / add up**? → addition
- Do they **disagree / contrast**? → contrast
- Does one **cause** the other? → cause-effect
- Is one a **condition** for the other? → condition
- Is one a **time reference** for the other? → time
- Is one a **purpose** of the other? → purpose / goal
- Is one an **example** of the other? → exemplification

Pinpoint this first; then connectors fall out.

---

### Step 2 — Pick the Right Connector for that Relationship

**What it is:** Use the right connector from the family that matches the relationship.

**Vibe:** Each relationship has multiple connector options. Pick by:
- **Formality** — formal context wants formal connectors
- **Position** — some connectors only sit between clauses, others can start a sentence
- **Subordination vs Coordination** — main clause + subordinate vs two equal clauses

---

## 2. Coordinating Conjunctions (FANBOYS)

### The Seven

**What it is:** Coordinators that join two **independent** clauses as equals.

**Vibe:** Memorize FANBOYS:

| Conjunction | Function |
|---|---|
| **F**or | because (formal, written) |
| **A**nd | addition |
| **N**or | negative addition |
| **B**ut | contrast |
| **O**r | alternative |
| **Y**et | contrast (similar to but, more formal) |
| **S**o | result |

**Usage rule:** A comma goes **before** the FANBOYS conjunction when joining two independent clauses.

Example:
- "He was tired, **so** he went home." (cause-effect)
- "She studied hard, **but** she failed." (contrast)
- "It was raining, **yet** they went out." (formal contrast)

---

### Comma Splice — A Common Error

**What it is:** Joining two clauses with only a comma (no conjunction) — always wrong.

**Vibe:**
- Wrong: "He was tired, he went home."
- Right: "He was tired, **so** he went home."
- Right: "He was tired**;** he went home." (semicolon)
- Right: "He was tired**.** He went home." (period)

The exam tests this — if an option uses only a comma between clauses, it''s wrong.

---

## 3. Subordinating Conjunctions

### Function

**What it is:** Connectors that make one clause **dependent** on another (subordinate clause).

**Vibe:** A subordinate clause cannot stand alone; it leans on the main clause. The subordinating conjunction sits at the **start of the subordinate clause**, which can come before or after the main clause.

---

### High-Frequency Subordinators by Function

| Function | Subordinators |
|---|---|
| **Time** | when, while, before, after, since, until, as soon as, by the time |
| **Cause** | because, since, as, now that |
| **Condition** | if, unless, provided that, in case, as long as |
| **Concession / Contrast** | although, though, even though, whereas, while |
| **Purpose** | so that, in order that, lest |
| **Result** | so ... that, such ... that |
| **Comparison** | than, as, as if, as though |
| **Place** | where, wherever |

**Example:**
- "**Although** he was tired, he kept working." (concession)
- "He passed **because** he studied hard." (cause)
- "**If** it rains, we''ll cancel." (condition)
- "She worked **so that** she could afford college." (purpose)

---

### Punctuation Rule for Subordinators

**What it is:** When the subordinate clause comes **first**, use a comma. When it comes **second**, no comma.

**Vibe:**
- "Although he was tired, he kept working." (subordinate first → comma)
- "He kept working although he was tired." (subordinate second → no comma)

Watch for punctuation in answer options — wrong punctuation often signals a wrong answer.

---

## 4. Transitional Phrases (Conjunctive Adverbs)

### Function

**What it is:** Adverbial phrases that connect two **independent** clauses, usually with a semicolon before and comma after.

**Vibe:** These are more formal than FANBOYS and are very common in editorial writing. Examples:

| Phrase | Function |
|---|---|
| **However** | contrast |
| **Moreover / Furthermore** | addition |
| **Nevertheless / Nonetheless** | concession |
| **Therefore / Hence / Thus / Consequently** | result |
| **Otherwise** | alternative result |
| **Meanwhile** | simultaneous time |
| **In addition** | addition |
| **In fact** | emphasis |
| **For example / For instance** | exemplification |
| **On the other hand** | contrast |
| **On the contrary** | direct opposition |
| **In conclusion / In short** | conclusion |

---

### Punctuation Pattern

**What it is:** The standard punctuation for transitional phrases.

**Vibe:**
- "She was tired**; however,** she finished the task."
- "He didn''t study**; consequently,** he failed."
- "**Moreover,** the policy is unpopular among voters."

Note: semicolon (or period) before the transitional phrase; comma after. Using a comma alone before "however" between two clauses creates a comma splice — wrong.

---

## 5. Relative Clauses

### Function

**What it is:** Clauses that modify a noun, introduced by **who / whom / whose / which / that / where / when**.

**Vibe:** Use relative clauses to combine two sentences when one provides extra info about a noun in the other.

Example:
- Two sentences: "Mr. Sharma is our principal. He is retiring next year."
- Combined: "Mr. Sharma, **who** is retiring next year, is our principal." (non-restrictive — extra info)
- Or: "Mr. Sharma is our principal **who** is retiring next year." (restrictive — defining)

---

### Which Pronoun to Use

| Pronoun | Use for |
|---|---|
| **Who** | people, subject ("the boy who came") |
| **Whom** | people, object (formal) ("the boy whom I met") |
| **Whose** | possession ("the boy whose book...") |
| **Which** | things / animals ("the book which...") |
| **That** | people or things, restrictive only ("the book that I read") |
| **Where** | place ("the house where I live") |
| **When** | time ("the day when we met") |

**Note:** "That" is **never** preceded by a comma. "Which" with comma is non-restrictive; without comma is restrictive (older usage — modern usage prefers "that" for restrictive).

---

## 6. Combining Sentences — Choose the Best Form

### Rule of Concision

**What it is:** When combining, the resulting sentence should be **shorter or clearer** than the two originals, not longer or more awkward.

**Vibe:** If an option combines two short sentences into one bulky, awkward sentence, it''s usually wrong. Good combination preserves meaning while improving flow.

Example:
- Two sentences: "He failed the exam. He didn''t study."
- Best combine: "He failed the exam **because** he didn''t study." (concise, causal)
- Awkward: "Owing to the fact that he didn''t study, he failed the exam." (longer, fancier — wrong choice)

---

### Preserving Meaning

**What it is:** The combined sentence must mean **exactly** what the two originals together mean — no addition, no loss.

**Vibe:** If a combined sentence introduces a relationship not in the original (e.g., changes cause to condition), it''s wrong. Always re-check: does my combined sentence say only what the two originals say?

Example:
- Originals: "He is rich. He is generous."
- "He is rich, **so** he is generous" — wrong, introduces causation not implied
- "He is rich **and** generous" — correct, neutral addition
- "He is **not only** rich **but also** generous" — correct, balanced emphasis

---

## 7. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Two clauses agree / add up | and / moreover / furthermore / in addition |
| Two clauses contrast | but / however / yet / although / despite |
| One clause is cause, other is effect | because / since / so / therefore / hence |
| One clause is condition for the other | if / unless / provided that |
| One clause introduces purpose | so that / in order that / lest |
| Two clauses are about the same noun (extra info) | relative pronoun (who / which / that) |
| Joining requires comma + FANBOYS | "He studied, **so** he passed" |
| Joining uses transitional phrase (however / therefore) | semicolon before, comma after |
| Subordinate clause comes first | comma after the subordinate clause |
| Subordinate clause comes second | no comma |
| Original sentences neutral, option introduces causation | wrong — adds meaning |

---

## 8. Common Traps

- **Trap — Picking "and" by default:** Students who can''t decide pick "and." But "and" is rarely the most precise. If there''s contrast → "but." If there''s cause → "because." Only pick "and" when there''s genuine **neutral addition**.
- **Trap — Mixing connectors:** "Although he was tired, but he kept working" — wrong (don''t pair "although" with "but"). One subordinator is enough.
- **Trap — "Because" + "so":** "Because it rained, so we cancelled" — wrong. Pick one: "Because it rained, we cancelled" OR "It rained, so we cancelled."
- **Trap — Comma splice with "however":** "He was tired, however he finished" — wrong. Use "He was tired; however, he finished" or "He was tired. However, he finished."
- **Trap — Wrong relative pronoun for people:** "The boy which came" → wrong; "The boy who came" / "The boy that came."
- **Trap — Restrictive comma misuse:** "The book, that I read, was great" → wrong (no comma with "that").

---

## 9. Connector Quick Reference by Tone

| Tone needed | Best connector |
|---|---|
| Formal contrast | nevertheless, nonetheless, however |
| Casual contrast | but, yet |
| Formal cause | because, since, as, owing to |
| Casual cause | because, so |
| Formal result | therefore, consequently, hence, thus |
| Casual result | so |
| Formal addition | moreover, furthermore, in addition |
| Casual addition | and, also, plus |
| Concession (despite something) | although, even though, despite the fact that |
| Direct opposition | on the contrary, conversely |

---

## 10. Worked Example

**Two sentences:**
> He had not studied for the exam. He passed with distinction.

**Options to combine:**
- (a) He had not studied for the exam, so he passed with distinction.
- (b) He had not studied for the exam, but he passed with distinction.
- (c) Because he had not studied, he passed with distinction.
- (d) He had not studied for the exam; therefore, he passed with distinction.

**Analysis:**
- Relationship: surprising contrast (didn''t study → still passed)
- (a) "so" implies cause-effect — wrong; not studying doesn''t cause distinction
- (b) "but" captures the contrast — correct
- (c) "because" introduces wrong causation — wrong
- (d) "therefore" implies result — wrong

**Answer: (b).**

> ⚡ **EXAM TIP:** Name the **relationship** before picking the connector. If you can''t say "this is a contrast" or "this is cause-effect," you''ll pick by feel — and feel is unreliable.

> ⚡ **EXAM TIP:** Watch the punctuation. A semicolon means a strong break (use with transitional phrases like "however," "therefore"). A comma is enough with FANBOYS (and, but, so). A wrong punctuation mark often gives away a wrong option.
', '1'),
  ('D11', 'ENG11.2', 'Logical Inference & Sentence Improvement', 'For inference, demand strict logical necessity — "could be true" is not enough. For sentence improvement, trust "No improvement needed" when no rule is broken.', '# LO 11.2: Logical Inference & Sentence Improvement

> Two related question types: (1) **Logical inference** — given a statement, pick the conclusion that must be true; (2) **Sentence improvement** — given a sentence with an underlined part, pick the option that improves the underlined part or "No improvement needed." Both demand precise reading and a sense for what is **actually said** vs **assumed**.

---

## 1. Logical Inference — The Strict Reading Rule

### What Inference Means in This Exam

**What it is:** A conclusion that **must** be true given the statement — not "could be true," not "is likely true," but **must** be true.

**Vibe:** This is the single biggest source of errors. Students pick options that **could be true** in the real world but don''t strictly follow from the statement. The right answer follows the statement **logically and necessarily**.

**Example:**
> Statement: All birds have feathers. The crow has feathers.
> Wrong inference: The crow is a bird. (Doesn''t follow — having feathers doesn''t make it a bird; statement only says birds have feathers, not that everything with feathers is a bird.)

---

### The Four Inference Pitfalls

**What it is:** Common ways students draw illegal inferences.

**Vibe:**

1. **Reverse implication** — Statement: "All A are B" does NOT mean "All B are A." (All cats are mammals ≠ all mammals are cats.)
2. **Probability mistaken for certainty** — Statement implies likely; student picks certain. (Most students like ice cream ≠ Ram, a student, likes ice cream.)
3. **Adding outside knowledge** — Student uses real-world facts not in the statement. (Statement says nothing about climate; student picks an option about climate change.)
4. **Negation mishandling** — Statement: "Not all X are Y" does NOT mean "All X are not Y." Means "Some X may not be Y."

Train yourself to flag these moves in any tempting wrong option.

---

### The Five Types of Valid Inferences

**What it is:** Patterns of inference that **are** logically valid.

**Vibe:**

1. **Direct restatement** — Same meaning, different words.
2. **Subset inference** — If "All A are B" and "X is A," then "X is B."
3. **Contradiction inference** — If statement says A is true, then "A is false" is invalid.
4. **Necessary consequence** — Logical fallout that cannot be avoided.
5. **Definitional inference** — Drawing on the definition of a term used in the statement.

If an option matches one of these patterns, it''s safe.

---

## 2. Inference Question Anatomy

### Reading the Statement Precisely

**What it is:** Parsing the statement word by word, marking quantifiers, modifiers, and exceptions.

**Vibe:** Quantifiers decide everything:
- **All / every / each** — total scope (no exceptions)
- **Most / many / some / few** — partial scope (exceptions allowed)
- **No / none** — total negation
- **Some are not** — partial negation

Mark the quantifier first. Wrong inferences usually misread the quantifier — treating "some" as "all," or "most" as "every."

---

### Comparing the Options to the Statement

**What it is:** Testing each option by asking "does this *necessarily* follow?"

**Vibe:** For each option:
- If the option says something **stronger** than the statement → wrong (overreach)
- If the option says something **weaker** but still implied → could be right
- If the option uses **new information** not in the statement → wrong
- If the option **directly restates** with synonyms → likely right

---

### Worked Example — Inference

**Statement:**
> Most engineering students take an internship in their final year, although it is not mandatory.

**Options:**
- (a) All engineering students take an internship in their final year.
- (b) An internship is required for engineering students.
- (c) Some engineering students do not take an internship in their final year.
- (d) Internships are not allowed in the final year.

**Analysis:**
- (a) Overreach — statement says "most," not "all." Wrong.
- (b) Contradicts statement (says "not mandatory"). Wrong.
- (c) Follows directly — if "most" take internship, "some" don''t. Right.
- (d) Direct contradiction. Wrong.

**Answer: (c).**

---

## 3. Sentence Improvement — Identifying What''s Wrong

### What the Question Looks Like

**What it is:** A sentence with an underlined portion; four options to replace the underlined part; one option is "No improvement needed."

**Vibe:** Common error categories in the underlined portion:
- **Tense error**
- **Subject-verb agreement error**
- **Wrong preposition**
- **Wrong word usage (vocabulary)**
- **Awkward phrasing / redundancy**
- **Wrong article**
- **Wrong pronoun case / number**
- **Misplaced modifier**

Read the underlined part with the error categories in mind. If none of these apply, "No improvement needed" might be correct.

---

### The Process

**What it is:** A step-by-step diagnostic.

**Vibe:**
1. Read the full sentence once to understand its meaning.
2. Focus on the underlined part — does it sound right?
3. If wrong, identify the **error category** (tense / preposition / agreement / etc.).
4. Read each option, looking for the one that **fixes the specific error** without introducing new errors.
5. If the underlined part has no error you can identify, choose "No improvement needed."

---

### Why "No Improvement Needed" Is Often Right

**What it is:** Roughly 20-25% of sentence-improvement questions have no error.

**Vibe:** Students under exam pressure assume there must be an error — so they pick a fancier-sounding option. **Don''t do this.** If you genuinely cannot find a rule that''s broken, trust the original.

---

## 4. Sentence Improvement — Common Errors to Spot

### Tense Errors

**What it is:** Underlined part uses wrong tense for the time signaled.

**Vibe:** Watch for time signals elsewhere in the sentence:
- "Since 2010" + underlined "I work" → should be "I have been working"
- "Yesterday" + underlined "has gone" → should be "went"
- "By the time he arrived" + underlined "I have left" → should be "had left"

---

### Preposition Errors

**What it is:** Underlined part uses the wrong preposition for a verb / adjective.

**Vibe:** Apply the fixed collocations:
- "discuss about" → "discuss" (no preposition)
- "married with" → "married to"
- "different than" → "different from"
- "senior than" → "senior to"

---

### Wrong Word / Redundancy

**What it is:** Underlined part uses a word with wrong meaning or is repetitive.

**Vibe:** Watch for:
- **Pleonasms:** "return back" (return implies back), "free gift," "advance planning," "future plans," "past history"
- **Confused words:** "less people" (should be "fewer people"), "amount of students" (should be "number of students")
- **Wrong word:** "He acquitted the crowd warmly" (should be "greeted")

---

### Modifier Errors

**What it is:** Underlined part has a misplaced or dangling modifier.

**Vibe:**
- Misplaced: "He only ate vegetables" (ambiguous) — should be "He ate only vegetables"
- Dangling: "Walking down the street, the building looked beautiful" — building wasn''t walking. Should be: "Walking down the street, **I saw the building looked beautiful**."

---

### Agreement Errors

**What it is:** Subject and verb disagree, or pronoun and antecedent disagree.

**Vibe:**
- "Each of the boys have" → "Each of the boys has"
- "The team are playing" → "The team is playing" (collective treated as unit)
- "Everyone brought their books" → "Everyone brought his/her book" (formal English)

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Inference statement says "most" / "some" | Don''t infer "all" / "none" |
| Inference option uses real-world fact not in statement | Wrong — outside knowledge |
| Inference option directly restates with synonyms | Likely right |
| Inference option says "always" / "never" from statement with modifiers | Wrong — overreach |
| Sentence has "since" + time + underlined verb in simple present | Should be present perfect |
| Sentence has "discuss" / "enter" / "marry" + preposition in underlined | Remove preposition |
| Sentence has "less" + countable noun | Should be "fewer" |
| Sentence has "return back" / "free gift" / "advance planning" | Redundancy — drop extra word |
| Sentence has "each / every / one of" + plural verb | Should be singular |
| Underlined part follows all rules, no awkwardness | Pick "No improvement needed" |

---

## 6. Common Traps

- **Trap — Inference: picking the "real-world right" answer:** Just because something is true in reality doesn''t mean it follows from the statement. The exam tests logic, not knowledge.
- **Trap — Inference: confusing inverse and converse:** "If A then B" does NOT mean "If B then A" or "If not A then not B." Watch this carefully.
- **Trap — Sentence improvement: changing what''s not wrong:** Students pick fancier options thinking they must be improvements. If the original is grammatically correct and unambiguous, **leave it alone**.
- **Trap — Sentence improvement: fixing one error, introducing another:** Always re-read the full sentence with the chosen option. The option should fix only what''s broken.
- **Trap — Mistaking style for error:** A formal sentence and a casual sentence can both be correct. Style differences aren''t errors unless the register is wrong for the context.

---

## 7. High-Yield Redundancies (Memorize)

| Redundant phrase | Correct form |
|---|---|
| Return back | Return |
| Repeat again | Repeat |
| Free gift | Gift |
| Advance planning | Planning |
| Future plans | Plans |
| Past history | History |
| Final outcome | Outcome |
| Each and every | Each / Every |
| Mutual cooperation | Cooperation |
| New innovation | Innovation |
| Reason ... is because | Reason is that |
| Cause is due to | Cause is / Due to |
| Connect together | Connect |
| Combine together | Combine |
| Merge together | Merge |
| Reverted back | Reverted |
| Discussed about | Discussed |
| Entered into the room | Entered the room |
| Reached at the station | Reached the station |

---

## 8. Worked Example — Sentence Improvement

**Sentence:**
> The committee will discuss about the proposal in tomorrow''s meeting.

**Options for the underlined "discuss about the proposal":**
- (a) discuss about the proposal
- (b) discuss the proposal
- (c) discuss on the proposal
- (d) discuss with the proposal

**Analysis:**
- "Discuss" takes no preposition — verb + direct object only.
- (a) "discuss about" — wrong (preposition error)
- (b) "discuss the proposal" — correct
- (c) "discuss on" — wrong
- (d) "discuss with" — wrong (with would apply to a person, not a proposal)

**Answer: (b).**

---

## 9. Worked Example — Inference

**Statement:**
> Whenever Ravi goes to Mumbai, he stays at the same hotel near the airport.

**Options:**
- (a) Ravi has been to Mumbai at least twice.
- (b) Ravi prefers airports to city centers.
- (c) The hotel near the airport is the cheapest option in Mumbai.
- (d) Ravi will go to Mumbai again next month.

**Analysis:**
- (a) "Whenever" + "the same hotel" implies multiple visits — at least two. Follows necessarily. **Right.**
- (b) Pure speculation — convenience, business, family could all explain hotel choice. Wrong.
- (c) Not stated; introduces price not in statement. Wrong.
- (d) Future not in statement. Wrong.

**Answer: (a).**

> ⚡ **EXAM TIP:** For inference, ask the strict question: "Is there any possible world consistent with the statement where this option is FALSE?" If yes, the option doesn''t follow necessarily — eliminate.

> ⚡ **EXAM TIP:** For sentence improvement, treat "No improvement needed" as a serious option. If you can''t name the rule that''s broken, the original is probably correct. ~1 in 4 questions has no error.
', '2')
) AS v(domain_code, lo_code, title, exam_tip, content, sort_order)
WHERE d.code = v.domain_code
ON CONFLICT (domain_id, code) DO NOTHING;

-- ---------- STEP 4: Insert subtopics ----------
INSERT INTO subtopics (lo_id, code, title, subtopic_type, sort_order)
SELECT l.id, v.code, v.title, v.stype, v.sort_order::int
FROM los l,
(VALUES
  ('ENG5.1', 'k-eng-5-1-1', 'Noun Number & Case Errors', 'knowledge', '1'),
  ('ENG5.1', 'k-eng-5-1-2', 'Pronoun Reference & Case Errors', 'knowledge', '2'),
  ('ENG5.1', 'k-eng-5-1-3', 'Adjective Degree of Comparison', 'knowledge', '3'),
  ('ENG5.1', 's-eng-5-1-1', 'Misplaced & Dangling Modifiers', 'skill', '4'),
  ('ENG5.1', 's-eng-5-1-2', 'Spotting the Error — Mixed Parts of Speech', 'skill', '5'),
  ('ENG5.2', 'k-eng-5-2-1', 'Tense Consistency & Sequence of Tenses', 'knowledge', '1'),
  ('ENG5.2', 'k-eng-5-2-2', 'Modal Verb Usage (can/could/should/would/must)', 'knowledge', '2'),
  ('ENG5.2', 'k-eng-5-2-3', 'Conditional Sentences (If clauses)', 'knowledge', '3'),
  ('ENG5.2', 's-eng-5-2-1', 'Active/Passive Voice Errors', 'skill', '4'),
  ('ENG5.2', 's-eng-5-2-2', 'Direct/Indirect Speech Errors', 'skill', '5'),
  ('ENG5.3', 'k-eng-5-3-1', 'Subject-Verb Agreement Rules', 'knowledge', '1'),
  ('ENG5.3', 'k-eng-5-3-2', 'Collective Noun & Either/Neither Agreement', 'knowledge', '2'),
  ('ENG5.3', 'k-eng-5-3-3', 'Article Usage (a / an / the / zero article)', 'knowledge', '3'),
  ('ENG5.3', 's-eng-5-3-1', 'Preposition Error Spotting', 'skill', '4'),
  ('ENG5.3', 's-eng-5-3-2', 'Conjunction & Connector Misuse', 'skill', '5'),
  ('ENG6.1', 'k-eng-6-1-1', 'Synonyms & Collocations in Cloze', 'knowledge', '1'),
  ('ENG6.1', 'k-eng-6-1-2', 'Phrasal Verbs & Idioms as Blanks', 'knowledge', '2'),
  ('ENG6.1', 's-eng-6-1-1', 'Register & Tone Matching in Passage', 'skill', '3'),
  ('ENG6.1', 's-eng-6-1-2', 'Eliminating Options by Context', 'skill', '4'),
  ('ENG6.2', 'k-eng-6-2-1', 'Article, Preposition & Conjunction Blanks', 'knowledge', '1'),
  ('ENG6.2', 'k-eng-6-2-2', 'Verb Form Blanks in Passage', 'knowledge', '2'),
  ('ENG6.2', 's-eng-6-2-1', 'Theme Coherence Across the Passage', 'skill', '3'),
  ('ENG6.2', 's-eng-6-2-2', 'Narrative Flow & Paragraph Unity', 'skill', '4'),
  ('ENG7.1', 'k-eng-7-1-1', 'Identifying Opening & Closing Sentences', 'knowledge', '1'),
  ('ENG7.1', 'k-eng-7-1-2', 'Pronoun-Antecedent Linkage Across Sentences', 'knowledge', '2'),
  ('ENG7.1', 'k-eng-7-1-3', 'Discourse Markers & Transitional Connectors', 'knowledge', '3'),
  ('ENG7.1', 's-eng-7-1-1', 'Chronological & Logical Sequencing', 'skill', '4'),
  ('ENG7.1', 's-eng-7-1-2', 'PQRS / 1-2-3-4 Type Fixed Arrangement', 'skill', '5'),
  ('ENG7.2', 'k-eng-7-2-1', 'Theme Consistency Detection', 'knowledge', '1'),
  ('ENG7.2', 's-eng-7-2-1', 'Identifying the Irrelevant/Odd Sentence', 'skill', '2'),
  ('ENG7.2', 's-eng-7-2-2', 'Flow Disruption & Paragraph Unity', 'skill', '3'),
  ('ENG8.1', 'k-eng-8-1-1', 'Synonyms — Isolation & In-Context', 'knowledge', '1'),
  ('ENG8.1', 'k-eng-8-1-2', 'Antonyms — Isolation & In-Context', 'knowledge', '2'),
  ('ENG8.1', 'k-eng-8-1-3', 'Commonly Confused Words (affect/effect, etc.)', 'knowledge', '3'),
  ('ENG8.1', 's-eng-8-1-1', 'Context-Based Word Choice & Word Swap', 'skill', '4'),
  ('ENG8.1', 's-eng-8-1-2', 'Identifying Incorrect Word Usage in Sentence', 'skill', '5'),
  ('ENG8.2', 'k-eng-8-2-1', 'Common Idioms & Phrases (Meaning & Usage)', 'knowledge', '1'),
  ('ENG8.2', 'k-eng-8-2-2', 'One-Word Substitution', 'knowledge', '2'),
  ('ENG8.2', 'k-eng-8-2-3', 'Commonly Misspelled Words', 'knowledge', '3'),
  ('ENG8.2', 's-eng-8-2-1', 'Homophones & Spelling in Context', 'skill', '4'),
  ('ENG8.2', 's-eng-8-2-2', 'Idiom Usage in Sentence Context', 'skill', '5'),
  ('ENG9.1', 'k-eng-9-1-1', 'Vocabulary Single Fillers (Nouns/Verbs/Adjectives)', 'knowledge', '1'),
  ('ENG9.1', 'k-eng-9-1-2', 'Grammar Single Fillers (Articles/Prepositions/Conjunctions)', 'knowledge', '2'),
  ('ENG9.1', 's-eng-9-1-1', 'Phrasal Verb Single Fillers', 'skill', '3'),
  ('ENG9.1', 's-eng-9-1-2', 'Eliminating Options by Grammatical Fit', 'skill', '4'),
  ('ENG9.2', 'k-eng-9-2-1', 'Parallel Structure in Double Fillers', 'knowledge', '1'),
  ('ENG9.2', 's-eng-9-2-1', 'Contextual Double Fillers (Both Words Must Fit)', 'skill', '2'),
  ('ENG9.2', 's-eng-9-2-2', 'Sentence Completion — Missing Clause', 'skill', '3'),
  ('ENG10.1', 'k-eng-10-1-1', 'Subject-Predicate Column Matching', 'knowledge', '1'),
  ('ENG10.1', 'k-eng-10-1-2', 'Idiom / Phrase Completion from Columns', 'knowledge', '2'),
  ('ENG10.1', 's-eng-10-1-1', 'Cause-Effect Column Matching', 'skill', '3'),
  ('ENG10.1', 's-eng-10-1-2', 'Grammatical Fit Across Two Columns', 'skill', '4'),
  ('ENG11.1', 'k-eng-11-1-1', 'Coordinating Conjunctions (and/but/or/so/yet)', 'knowledge', '1'),
  ('ENG11.1', 'k-eng-11-1-2', 'Subordinating Conjunctions & Relative Clauses', 'knowledge', '2'),
  ('ENG11.1', 'k-eng-11-1-3', 'Transitional Phrases (however/therefore/moreover)', 'knowledge', '3'),
  ('ENG11.1', 's-eng-11-1-1', 'Combining Two Sentences Without Changing Meaning', 'skill', '4'),
  ('ENG11.1', 's-eng-11-1-2', 'Choosing the Best Connector for Context', 'skill', '5'),
  ('ENG11.2', 'k-eng-11-2-1', 'Drawing Logical Conclusions from Statements', 'knowledge', '1'),
  ('ENG11.2', 's-eng-11-2-1', 'Sentence Improvement — Replace Underlined Part', 'skill', '2'),
  ('ENG11.2', 's-eng-11-2-2', 'Phrase Replacement & Redundancy Removal', 'skill', '3'),
  ('ENG11.2', 's-eng-11-2-3', 'Assumption & Argument Evaluation', 'skill', '4')
) AS v(lo_code, code, title, stype, sort_order)
WHERE l.code = v.lo_code
ON CONFLICT (lo_id, code) DO NOTHING;

-- ---------- STEP 5: Insert LO -> question type mappings ----------
INSERT INTO lo_question_types (lo_id, question_type_id)
SELECT l.id, qt.id
FROM (VALUES
  ('ENG5.1', 'mc'),
  ('ENG5.2', 'mc'),
  ('ENG5.3', 'mc'),
  ('ENG6.1', 'mc'),
  ('ENG6.2', 'mc'),
  ('ENG7.1', 'mc'),
  ('ENG7.2', 'mc'),
  ('ENG8.1', 'mc'),
  ('ENG8.2', 'mc'),
  ('ENG9.1', 'mc'),
  ('ENG9.2', 'mc'),
  ('ENG10.1', 'mc'),
  ('ENG11.1', 'mc'),
  ('ENG11.2', 'mc')
) AS l_qt(lo_code, qt_code)
JOIN los l               ON l.code  = l_qt.lo_code
JOIN question_types qt   ON qt.code = l_qt.qt_code
ON CONFLICT (lo_id, question_type_id) DO NOTHING;

-- ---------- VERIFY (optional) ----------
-- SELECT e.code AS exam, d.code AS domain, l.code AS lo, l.title AS lo_title,
--        COUNT(DISTINCT s.id) AS subtopics,
--        STRING_AGG(DISTINCT qt.code, ', ') AS question_types
-- FROM exams e
-- JOIN domains d ON d.exam_id = e.id
-- JOIN los l ON l.domain_id = d.id
-- LEFT JOIN subtopics s ON s.lo_id = l.id
-- LEFT JOIN lo_question_types lqt ON lqt.lo_id = l.id
-- LEFT JOIN question_types qt ON qt.id = lqt.question_type_id
-- WHERE e.code = 'COMP-ENG-01'
-- GROUP BY e.code, d.code, l.code, l.title
-- ORDER BY d.code, l.code;
