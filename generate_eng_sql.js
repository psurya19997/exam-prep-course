// generate_eng_sql.js
// One-off generator for Competitive English (COMP-ENG-01) Phase 2 SQL.
// Reads LO content from lo_content/*.md, escapes single quotes, and emits
// migrations/COMP-ENG-01.sql ready to paste into the Supabase SQL Editor.
//
// Run: node generate_eng_sql.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXAM = {
  code: 'COMP-ENG-01',
  title: 'Competitive English — SSC / IBPS / Banking / Airforce',
  provider: 'General Competition',
  version: 'v1.0',
  passing_score: null,
};

const DOMAINS = [
  { code: 'D5',  title: 'Grammar & Error Detection',                    sort_order: 1 },
  { code: 'D6',  title: 'Cloze Test',                                    sort_order: 2 },
  { code: 'D7',  title: 'Para Jumbles & Sentence Arrangement',           sort_order: 3 },
  { code: 'D8',  title: 'Vocabulary',                                    sort_order: 4 },
  { code: 'D9',  title: 'Fillers',                                       sort_order: 5 },
  { code: 'D10', title: 'Column Matching',                               sort_order: 6 },
  { code: 'D11', title: 'Connectors, Inference & Sentence Improvement',  sort_order: 7 },
];

const LOS = [
  // D5
  { domain: 'D5', code: 'ENG5.1',  title: 'Parts of Speech Errors (Noun, Pronoun, Adjective, Adverb)',
    exam_tip: 'Scan each underlined part against a 4-point checklist: noun number, pronoun reference, degree of comparison, adverb position. If none break, the answer is "No error."',
    sort_order: 1 },
  { domain: 'D5', code: 'ENG5.2',  title: 'Tense, Verb Form & Voice Errors',
    exam_tip: 'Match time signals to tense, modal to base verb, "if" clause to conditional rule. "Since/for" always demands present perfect.',
    sort_order: 2 },
  { domain: 'D5', code: 'ENG5.3',  title: 'Subject-Verb Agreement, Articles & Prepositions',
    exam_tip: 'Strip interrupters to find the real subject; sound (not spelling) decides a/an; verb-preposition pairs are memorized.',
    sort_order: 3 },
  // D6
  { domain: 'D6', code: 'ENG6.1',  title: 'Vocabulary-Based Cloze (Word Fit)',
    exam_tip: 'Read full passage first for theme and tone; each blank is decided by meaning + collocation, not "what sounds nice."',
    sort_order: 1 },
  { domain: 'D6', code: 'ENG6.2',  title: 'Grammar & Theme-Based Cloze',
    exam_tip: 'Separate grammar blanks (rule-decided) from vocabulary blanks (theme-decided). Solve grammar slots first.',
    sort_order: 2 },
  // D7
  { domain: 'D7', code: 'ENG7.1',  title: 'Sentence Rearrangement — Fixed Pattern (PQRS)',
    exam_tip: 'Find the opener (no backward pronoun, no contrast connector); para jumbles are an elimination game, not a construction game.',
    sort_order: 1 },
  { domain: 'D7', code: 'ENG7.2',  title: 'Odd Sentence Out & Paragraph Coherence',
    exam_tip: 'Highlight the main noun of each sentence — four will share a theme, one will not. That outlier is the odd sentence.',
    sort_order: 2 },
  // D8
  { domain: 'D8', code: 'ENG8.1',  title: 'Synonyms, Antonyms & Contextual Word Usage',
    exam_tip: 'In word-swap, the wrong word looks confidently right — read literally and ask if its plain meaning conflicts with the sentence.',
    sort_order: 1 },
  { domain: 'D8', code: 'ENG8.2',  title: 'Idioms, Phrases, One-Word Substitution & Spelling',
    exam_tip: 'For idioms, never pick the literal-meaning option — idioms are figurative by definition.',
    sort_order: 2 },
  // D9
  { domain: 'D9', code: 'ENG9.1',  title: 'Single Fillers — Vocabulary & Grammar',
    exam_tip: 'Predict the answer before looking at options; reverse engineering avoids attractive-but-wrong distractors.',
    sort_order: 1 },
  { domain: 'D9', code: 'ENG9.2',  title: 'Double Fillers & Sentence Completion',
    exam_tip: 'Test BOTH words of every pair — a perfect first word with a failing second word is the #1 trap.',
    sort_order: 2 },
  // D10
  { domain: 'D10', code: 'ENG10.1', title: 'Phrase & Clause Matching from Two Columns',
    exam_tip: 'Validate each pairing on three layers: grammar, meaning, idiom. The exam crafts pairs that pass one and fail another.',
    sort_order: 1 },
  // D11
  { domain: 'D11', code: 'ENG11.1', title: 'Sentence Joining & Connector Usage',
    exam_tip: 'Name the relationship (contrast/cause/condition) before picking the connector. Default to "and" only for neutral addition.',
    sort_order: 1 },
  { domain: 'D11', code: 'ENG11.2', title: 'Logical Inference & Sentence Improvement',
    exam_tip: 'For inference, demand strict logical necessity — "could be true" is not enough. For sentence improvement, trust "No improvement needed" when no rule is broken.',
    sort_order: 2 },
];

const SUBTOPICS = [
  // ENG5.1 — Parts of Speech Errors
  { lo: 'ENG5.1', code: 'k-eng-5-1-1', title: 'Noun Number & Case Errors',                        type: 'knowledge', sort_order: 1 },
  { lo: 'ENG5.1', code: 'k-eng-5-1-2', title: 'Pronoun Reference & Case Errors',                  type: 'knowledge', sort_order: 2 },
  { lo: 'ENG5.1', code: 'k-eng-5-1-3', title: 'Adjective Degree of Comparison',                   type: 'knowledge', sort_order: 3 },
  { lo: 'ENG5.1', code: 's-eng-5-1-1', title: 'Misplaced & Dangling Modifiers',                   type: 'skill',     sort_order: 4 },
  { lo: 'ENG5.1', code: 's-eng-5-1-2', title: 'Spotting the Error — Mixed Parts of Speech',       type: 'skill',     sort_order: 5 },
  // ENG5.2 — Tense, Verb Form & Voice
  { lo: 'ENG5.2', code: 'k-eng-5-2-1', title: 'Tense Consistency & Sequence of Tenses',           type: 'knowledge', sort_order: 1 },
  { lo: 'ENG5.2', code: 'k-eng-5-2-2', title: 'Modal Verb Usage (can/could/should/would/must)',   type: 'knowledge', sort_order: 2 },
  { lo: 'ENG5.2', code: 'k-eng-5-2-3', title: 'Conditional Sentences (If clauses)',               type: 'knowledge', sort_order: 3 },
  { lo: 'ENG5.2', code: 's-eng-5-2-1', title: 'Active/Passive Voice Errors',                      type: 'skill',     sort_order: 4 },
  { lo: 'ENG5.2', code: 's-eng-5-2-2', title: 'Direct/Indirect Speech Errors',                    type: 'skill',     sort_order: 5 },
  // ENG5.3 — SVA, Articles & Prepositions
  { lo: 'ENG5.3', code: 'k-eng-5-3-1', title: 'Subject-Verb Agreement Rules',                     type: 'knowledge', sort_order: 1 },
  { lo: 'ENG5.3', code: 'k-eng-5-3-2', title: 'Collective Noun & Either/Neither Agreement',       type: 'knowledge', sort_order: 2 },
  { lo: 'ENG5.3', code: 'k-eng-5-3-3', title: 'Article Usage (a / an / the / zero article)',      type: 'knowledge', sort_order: 3 },
  { lo: 'ENG5.3', code: 's-eng-5-3-1', title: 'Preposition Error Spotting',                       type: 'skill',     sort_order: 4 },
  { lo: 'ENG5.3', code: 's-eng-5-3-2', title: 'Conjunction & Connector Misuse',                   type: 'skill',     sort_order: 5 },
  // ENG6.1 — Vocabulary-Based Cloze
  { lo: 'ENG6.1', code: 'k-eng-6-1-1', title: 'Synonyms & Collocations in Cloze',                 type: 'knowledge', sort_order: 1 },
  { lo: 'ENG6.1', code: 'k-eng-6-1-2', title: 'Phrasal Verbs & Idioms as Blanks',                 type: 'knowledge', sort_order: 2 },
  { lo: 'ENG6.1', code: 's-eng-6-1-1', title: 'Register & Tone Matching in Passage',              type: 'skill',     sort_order: 3 },
  { lo: 'ENG6.1', code: 's-eng-6-1-2', title: 'Eliminating Options by Context',                   type: 'skill',     sort_order: 4 },
  // ENG6.2 — Grammar & Theme-Based Cloze
  { lo: 'ENG6.2', code: 'k-eng-6-2-1', title: 'Article, Preposition & Conjunction Blanks',        type: 'knowledge', sort_order: 1 },
  { lo: 'ENG6.2', code: 'k-eng-6-2-2', title: 'Verb Form Blanks in Passage',                      type: 'knowledge', sort_order: 2 },
  { lo: 'ENG6.2', code: 's-eng-6-2-1', title: 'Theme Coherence Across the Passage',               type: 'skill',     sort_order: 3 },
  { lo: 'ENG6.2', code: 's-eng-6-2-2', title: 'Narrative Flow & Paragraph Unity',                 type: 'skill',     sort_order: 4 },
  // ENG7.1 — Para Jumbles Fixed Pattern
  { lo: 'ENG7.1', code: 'k-eng-7-1-1', title: 'Identifying Opening & Closing Sentences',          type: 'knowledge', sort_order: 1 },
  { lo: 'ENG7.1', code: 'k-eng-7-1-2', title: 'Pronoun-Antecedent Linkage Across Sentences',      type: 'knowledge', sort_order: 2 },
  { lo: 'ENG7.1', code: 'k-eng-7-1-3', title: 'Discourse Markers & Transitional Connectors',      type: 'knowledge', sort_order: 3 },
  { lo: 'ENG7.1', code: 's-eng-7-1-1', title: 'Chronological & Logical Sequencing',               type: 'skill',     sort_order: 4 },
  { lo: 'ENG7.1', code: 's-eng-7-1-2', title: 'PQRS / 1-2-3-4 Type Fixed Arrangement',            type: 'skill',     sort_order: 5 },
  // ENG7.2 — Odd Sentence Out
  { lo: 'ENG7.2', code: 'k-eng-7-2-1', title: 'Theme Consistency Detection',                      type: 'knowledge', sort_order: 1 },
  { lo: 'ENG7.2', code: 's-eng-7-2-1', title: 'Identifying the Irrelevant/Odd Sentence',          type: 'skill',     sort_order: 2 },
  { lo: 'ENG7.2', code: 's-eng-7-2-2', title: 'Flow Disruption & Paragraph Unity',                type: 'skill',     sort_order: 3 },
  // ENG8.1 — Synonyms, Antonyms & Word Usage
  { lo: 'ENG8.1', code: 'k-eng-8-1-1', title: 'Synonyms — Isolation & In-Context',                type: 'knowledge', sort_order: 1 },
  { lo: 'ENG8.1', code: 'k-eng-8-1-2', title: 'Antonyms — Isolation & In-Context',                type: 'knowledge', sort_order: 2 },
  { lo: 'ENG8.1', code: 'k-eng-8-1-3', title: 'Commonly Confused Words (affect/effect, etc.)',    type: 'knowledge', sort_order: 3 },
  { lo: 'ENG8.1', code: 's-eng-8-1-1', title: 'Context-Based Word Choice & Word Swap',            type: 'skill',     sort_order: 4 },
  { lo: 'ENG8.1', code: 's-eng-8-1-2', title: 'Identifying Incorrect Word Usage in Sentence',     type: 'skill',     sort_order: 5 },
  // ENG8.2 — Idioms, OWS, Spelling
  { lo: 'ENG8.2', code: 'k-eng-8-2-1', title: 'Common Idioms & Phrases (Meaning & Usage)',        type: 'knowledge', sort_order: 1 },
  { lo: 'ENG8.2', code: 'k-eng-8-2-2', title: 'One-Word Substitution',                            type: 'knowledge', sort_order: 2 },
  { lo: 'ENG8.2', code: 'k-eng-8-2-3', title: 'Commonly Misspelled Words',                        type: 'knowledge', sort_order: 3 },
  { lo: 'ENG8.2', code: 's-eng-8-2-1', title: 'Homophones & Spelling in Context',                 type: 'skill',     sort_order: 4 },
  { lo: 'ENG8.2', code: 's-eng-8-2-2', title: 'Idiom Usage in Sentence Context',                  type: 'skill',     sort_order: 5 },
  // ENG9.1 — Single Fillers
  { lo: 'ENG9.1', code: 'k-eng-9-1-1', title: 'Vocabulary Single Fillers (Nouns/Verbs/Adjectives)', type: 'knowledge', sort_order: 1 },
  { lo: 'ENG9.1', code: 'k-eng-9-1-2', title: 'Grammar Single Fillers (Articles/Prepositions/Conjunctions)', type: 'knowledge', sort_order: 2 },
  { lo: 'ENG9.1', code: 's-eng-9-1-1', title: 'Phrasal Verb Single Fillers',                      type: 'skill',     sort_order: 3 },
  { lo: 'ENG9.1', code: 's-eng-9-1-2', title: 'Eliminating Options by Grammatical Fit',           type: 'skill',     sort_order: 4 },
  // ENG9.2 — Double Fillers
  { lo: 'ENG9.2', code: 'k-eng-9-2-1', title: 'Parallel Structure in Double Fillers',             type: 'knowledge', sort_order: 1 },
  { lo: 'ENG9.2', code: 's-eng-9-2-1', title: 'Contextual Double Fillers (Both Words Must Fit)',  type: 'skill',     sort_order: 2 },
  { lo: 'ENG9.2', code: 's-eng-9-2-2', title: 'Sentence Completion — Missing Clause',             type: 'skill',     sort_order: 3 },
  // ENG10.1 — Column Matching
  { lo: 'ENG10.1', code: 'k-eng-10-1-1', title: 'Subject-Predicate Column Matching',              type: 'knowledge', sort_order: 1 },
  { lo: 'ENG10.1', code: 'k-eng-10-1-2', title: 'Idiom / Phrase Completion from Columns',         type: 'knowledge', sort_order: 2 },
  { lo: 'ENG10.1', code: 's-eng-10-1-1', title: 'Cause-Effect Column Matching',                   type: 'skill',     sort_order: 3 },
  { lo: 'ENG10.1', code: 's-eng-10-1-2', title: 'Grammatical Fit Across Two Columns',             type: 'skill',     sort_order: 4 },
  // ENG11.1 — Sentence Joining & Connectors
  { lo: 'ENG11.1', code: 'k-eng-11-1-1', title: 'Coordinating Conjunctions (and/but/or/so/yet)',  type: 'knowledge', sort_order: 1 },
  { lo: 'ENG11.1', code: 'k-eng-11-1-2', title: 'Subordinating Conjunctions & Relative Clauses',  type: 'knowledge', sort_order: 2 },
  { lo: 'ENG11.1', code: 'k-eng-11-1-3', title: 'Transitional Phrases (however/therefore/moreover)', type: 'knowledge', sort_order: 3 },
  { lo: 'ENG11.1', code: 's-eng-11-1-1', title: 'Combining Two Sentences Without Changing Meaning', type: 'skill',     sort_order: 4 },
  { lo: 'ENG11.1', code: 's-eng-11-1-2', title: 'Choosing the Best Connector for Context',        type: 'skill',     sort_order: 5 },
  // ENG11.2 — Inference & Sentence Improvement
  { lo: 'ENG11.2', code: 'k-eng-11-2-1', title: 'Drawing Logical Conclusions from Statements',    type: 'knowledge', sort_order: 1 },
  { lo: 'ENG11.2', code: 's-eng-11-2-1', title: 'Sentence Improvement — Replace Underlined Part', type: 'skill',     sort_order: 2 },
  { lo: 'ENG11.2', code: 's-eng-11-2-2', title: 'Phrase Replacement & Redundancy Removal',        type: 'skill',     sort_order: 3 },
  { lo: 'ENG11.2', code: 's-eng-11-2-3', title: 'Assumption & Argument Evaluation',               type: 'skill',     sort_order: 4 },
];

// All LOs use mc only (as confirmed by user).
const LO_QUESTION_TYPES = LOS.map(lo => ({ lo: lo.code, qt: 'mc' }));

// ---------- SQL escape helper ----------
const esc = (s) => (s == null ? null : String(s).replace(/'/g, "''"));
const sqlStr = (s) => (s == null ? 'NULL' : `'${esc(s)}'`);
const sqlInt = (n) => (n == null ? 'NULL' : String(n));

// ---------- Build SQL ----------
const lines = [];
lines.push(`-- =====================================================================`);
lines.push(`-- COMP-ENG-01 — Competitive English (SSC / IBPS / Banking / Airforce)`);
lines.push(`-- Phase 2 Seed: exam → domains → LOs → subtopics → lo_question_types`);
lines.push(`-- Run each STEP block separately in Supabase SQL Editor.`);
lines.push(`-- All blocks use ON CONFLICT DO NOTHING — safe to re-run.`);
lines.push(`-- =====================================================================`);
lines.push('');

// --- STEP 1: exam ---
lines.push(`-- ---------- STEP 1: Insert exam ----------`);
lines.push(`INSERT INTO exams (code, title, provider, version, passing_score, status)`);
lines.push(`VALUES (${sqlStr(EXAM.code)}, ${sqlStr(EXAM.title)}, ${sqlStr(EXAM.provider)}, ${sqlStr(EXAM.version)}, ${sqlInt(EXAM.passing_score)}, 'published')`);
lines.push(`ON CONFLICT (code) DO NOTHING;`);
lines.push('');

// --- STEP 2: domains ---
lines.push(`-- ---------- STEP 2: Insert domains ----------`);
lines.push(`INSERT INTO domains (exam_id, code, title, weight_percent, sort_order)`);
lines.push(`SELECT e.id, v.code, v.title, v.weight_pct::int, v.sort_order::int`);
lines.push(`FROM exams e,`);
lines.push(`(VALUES`);
DOMAINS.forEach((d, i) => {
  const tail = i === DOMAINS.length - 1 ? '' : ',';
  lines.push(`  (${sqlStr(d.code)}, ${sqlStr(d.title)}, NULL, '${d.sort_order}')${tail}`);
});
lines.push(`) AS v(code, title, weight_pct, sort_order)`);
lines.push(`WHERE e.code = ${sqlStr(EXAM.code)}`);
lines.push(`ON CONFLICT (exam_id, code) DO NOTHING;`);
lines.push('');

// --- STEP 3: LOs (with content from .md files) ---
lines.push(`-- ---------- STEP 3: Insert LOs (with study content) ----------`);
lines.push(`INSERT INTO los (domain_id, code, title, exam_tip_summary, content, sort_order)`);
lines.push(`SELECT d.id, v.lo_code, v.title, v.exam_tip, v.content, v.sort_order::int`);
lines.push(`FROM domains d,`);
lines.push(`(VALUES`);
LOS.forEach((lo, i) => {
  const contentPath = path.join(__dirname, 'lo_content', `${lo.code}.md`);
  if (!fs.existsSync(contentPath)) {
    throw new Error(`Missing LO content file: ${contentPath}`);
  }
  const content = fs.readFileSync(contentPath, 'utf8');
  const tail = i === LOS.length - 1 ? '' : ',';
  lines.push(`  (${sqlStr(lo.domain)}, ${sqlStr(lo.code)}, ${sqlStr(lo.title)}, ${sqlStr(lo.exam_tip)}, ${sqlStr(content)}, '${lo.sort_order}')${tail}`);
});
lines.push(`) AS v(domain_code, lo_code, title, exam_tip, content, sort_order)`);
lines.push(`WHERE d.code = v.domain_code`);
lines.push(`ON CONFLICT (domain_id, code) DO NOTHING;`);
lines.push('');

// --- STEP 4: subtopics ---
lines.push(`-- ---------- STEP 4: Insert subtopics ----------`);
lines.push(`INSERT INTO subtopics (lo_id, code, title, subtopic_type, sort_order)`);
lines.push(`SELECT l.id, v.code, v.title, v.stype, v.sort_order::int`);
lines.push(`FROM los l,`);
lines.push(`(VALUES`);
SUBTOPICS.forEach((s, i) => {
  const tail = i === SUBTOPICS.length - 1 ? '' : ',';
  lines.push(`  (${sqlStr(s.lo)}, ${sqlStr(s.code)}, ${sqlStr(s.title)}, ${sqlStr(s.type)}, '${s.sort_order}')${tail}`);
});
lines.push(`) AS v(lo_code, code, title, stype, sort_order)`);
lines.push(`WHERE l.code = v.lo_code`);
lines.push(`ON CONFLICT (lo_id, code) DO NOTHING;`);
lines.push('');

// --- STEP 5: lo_question_types ---
lines.push(`-- ---------- STEP 5: Insert LO -> question type mappings ----------`);
lines.push(`INSERT INTO lo_question_types (lo_id, question_type_id)`);
lines.push(`SELECT l.id, qt.id`);
lines.push(`FROM (VALUES`);
LO_QUESTION_TYPES.forEach((m, i) => {
  const tail = i === LO_QUESTION_TYPES.length - 1 ? '' : ',';
  lines.push(`  (${sqlStr(m.lo)}, ${sqlStr(m.qt)})${tail}`);
});
lines.push(`) AS l_qt(lo_code, qt_code)`);
lines.push(`JOIN los l               ON l.code  = l_qt.lo_code`);
lines.push(`JOIN question_types qt   ON qt.code = l_qt.qt_code`);
lines.push(`ON CONFLICT (lo_id, question_type_id) DO NOTHING;`);
lines.push('');

// --- Verify block ---
lines.push(`-- ---------- VERIFY (optional) ----------`);
lines.push(`-- SELECT e.code AS exam, d.code AS domain, l.code AS lo, l.title AS lo_title,`);
lines.push(`--        COUNT(DISTINCT s.id) AS subtopics,`);
lines.push(`--        STRING_AGG(DISTINCT qt.code, ', ') AS question_types`);
lines.push(`-- FROM exams e`);
lines.push(`-- JOIN domains d ON d.exam_id = e.id`);
lines.push(`-- JOIN los l ON l.domain_id = d.id`);
lines.push(`-- LEFT JOIN subtopics s ON s.lo_id = l.id`);
lines.push(`-- LEFT JOIN lo_question_types lqt ON lqt.lo_id = l.id`);
lines.push(`-- LEFT JOIN question_types qt ON qt.id = lqt.question_type_id`);
lines.push(`-- WHERE e.code = ${sqlStr(EXAM.code)}`);
lines.push(`-- GROUP BY e.code, d.code, l.code, l.title`);
lines.push(`-- ORDER BY d.code, l.code;`);
lines.push('');

// --- Write output ---
const outDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'COMP-ENG-01.sql');
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

console.log(`Wrote ${outFile}`);
console.log(`  ${DOMAINS.length} domains, ${LOS.length} LOs, ${SUBTOPICS.length} subtopics, ${LO_QUESTION_TYPES.length} LO→QT mappings`);
