// backfill_attempts.js
// ----------------------------------------------------------------
// Narrow rescore pass for ONE domain. After fixing a CSV casing bug
// in question_options.answer_value (TRUE/FALSE -> true/false) and
// reseeding the affected domain, past attempts still hold the
// is_correct value that was computed under the old answer_value.
//
// This script:
//   1. Resolves the domain by code (default "D1") and collects every
//      question_id with that domain_id.
//   2. Re-evaluates only those attempts using the SAME scoring
//      function the app uses (src/utils/scoring.js).
//   3. Updates only the attempts whose stored is_correct differs
//      from the recomputed value (idempotent).
//   4. Recomputes correct_count for the affected domain_exam_sessions
//      rows from the in-scope attempt sums and updates rows where
//      the stored count is stale.
//
// LO quizzes and lo_quiz_sessions are NEVER touched.
//
// Usage:
//   node --env-file=.env backfill_attempts.js [DOMAIN_CODE]            # dry run
//   node --env-file=.env backfill_attempts.js [DOMAIN_CODE] --apply    # write
//   (DOMAIN_CODE defaults to "D1")
// ----------------------------------------------------------------

import { createClient } from '@supabase/supabase-js'
import { calculateIsCorrect } from './src/utils/scoring.js'

const APPLY = process.argv.includes('--apply')
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const DOMAIN_CODE = positional[0] || 'D1'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function fetchAllIn(table, select, column, values) {
  // Pages an .in() filter — Supabase has a URL-length cap, so chunk the
  // value list and concat the pages.
  const chunkSize = 500
  const out = []
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize)
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .in(column, chunk)
    if (error) throw error
    out.push(...(data ?? []))
  }
  return out
}

async function main() {
  console.log(`▶ Scope: domain ${DOMAIN_CODE} only`)
  console.log(APPLY ? '▶ APPLY mode — writes enabled' : '▶ DRY RUN — no writes')

  // 1. Resolve domain
  const { data: domains, error: domErr } = await supabase
    .from('domains')
    .select('id, code, title, exam_id')
    .eq('code', DOMAIN_CODE)
  if (domErr) throw domErr
  if (!domains || domains.length === 0) {
    console.error(`✗ Domain ${DOMAIN_CODE} not found`)
    process.exit(1)
  }
  if (domains.length > 1) {
    console.error(
      `✗ Domain code "${DOMAIN_CODE}" matches ${domains.length} domains. Ambiguous.`
    )
    process.exit(1)
  }
  const domain = domains[0]
  console.log(`▶ Domain ${domain.code} → ${domain.id} (exam ${domain.exam_id})`)

  // 2. Load question_types lookup
  const { data: qts, error: qtErr } = await supabase
    .from('question_types')
    .select('id, code')
  if (qtErr) throw qtErr
  const typeCodeById = Object.fromEntries(qts.map((t) => [t.id, t.code]))

  // 3. Load D1 questions + options
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select(
      'id, question_type_id, question_options(option_key, answer_value, sort_order)'
    )
    .eq('domain_id', domain.id)
  if (qErr) throw qErr
  if (!questions || questions.length === 0) {
    console.log(`▶ No questions found for domain ${DOMAIN_CODE} — nothing to do.`)
    return
  }
  const qById = Object.fromEntries(questions.map((q) => [q.id, q]))
  const qIds = questions.map((q) => q.id)
  console.log(`▶ ${questions.length} questions in scope`)

  // 4. Load attempts limited to those questions
  const attempts = await fetchAllIn(
    'attempts',
    'id, session_id, question_id, question_type_id, is_correct, user_answer',
    'question_id',
    qIds
  )
  console.log(`▶ ${attempts.length} in-scope attempts to re-evaluate`)

  // 5. Recompute, collect updates
  let changed = 0
  let unchanged = 0
  const updates = []
  const byChangeKind = { false_to_true: 0, true_to_false: 0 }

  for (const a of attempts) {
    const q = qById[a.question_id]
    if (!q) continue // can't happen given the .in() filter, but defensive
    const code = typeCodeById[a.question_type_id]
    const newCorrect = calculateIsCorrect(code, a.user_answer, q.question_options)
    if (newCorrect === a.is_correct) {
      unchanged++
      continue
    }
    changed++
    if (a.is_correct === false && newCorrect === true) byChangeKind.false_to_true++
    else byChangeKind.true_to_false++
    updates.push({ id: a.id, is_correct: newCorrect })
  }

  console.log(
    `  ${unchanged} unchanged · ${changed} need rescoring  (false→true ${byChangeKind.false_to_true}, true→false ${byChangeKind.true_to_false})`
  )

  if (APPLY && updates.length) {
    console.log(`▶ Writing ${updates.length} attempt updates…`)
    for (let i = 0; i < updates.length; i++) {
      const u = updates[i]
      const { error } = await supabase
        .from('attempts')
        .update({ is_correct: u.is_correct })
        .eq('id', u.id)
      if (error) {
        console.error(`✗ update attempt ${u.id}: ${error.message}`)
        process.exit(1)
      }
      if ((i + 1) % 25 === 0 || i === updates.length - 1) {
        process.stdout.write(`  ${i + 1}/${updates.length}\r`)
      }
    }
    console.log('')
  }

  // 6. Reconcile correct_count on domain_exam_sessions for THIS domain only.
  //    Compute the post-state correct sum per session from in-scope attempts.
  const overlay = new Map(updates.map((u) => [u.id, u.is_correct]))
  const postState = attempts.map((a) => ({
    ...a,
    is_correct: APPLY
      ? a.is_correct // already written
      : overlay.has(a.id)
      ? overlay.get(a.id)
      : a.is_correct,
  }))
  // In --apply mode, refresh from DB so the count is exact even if anything
  // happened between the update loop and now.
  let attemptsForCount = postState
  if (APPLY) {
    const fresh = await fetchAllIn(
      'attempts',
      'id, session_id, is_correct',
      'question_id',
      qIds
    )
    attemptsForCount = fresh
  }

  const correctBySession = new Map()
  for (const a of attemptsForCount) {
    const k = a.session_id
    if (!correctBySession.has(k)) correctBySession.set(k, 0)
    if (a.is_correct) correctBySession.set(k, correctBySession.get(k) + 1)
  }

  const { data: desRows, error: desErr } = await supabase
    .from('domain_exam_sessions')
    .select('id, session_id, status, correct_count, total_questions')
    .eq('domain_id', domain.id)
  if (desErr) throw desErr

  let desChanged = 0
  for (const r of desRows ?? []) {
    if (r.status !== 'completed') continue
    const fresh = correctBySession.get(r.session_id) ?? 0
    if (fresh === r.correct_count) continue
    desChanged++
    console.log(
      `  domain_exam_sessions ${r.id}  correct_count: ${r.correct_count} → ${fresh} (of ${r.total_questions})`
    )
    if (APPLY) {
      const { error } = await supabase
        .from('domain_exam_sessions')
        .update({ correct_count: fresh })
        .eq('id', r.id)
      if (error) {
        console.error(`✗ update domain_exam_sessions ${r.id}: ${error.message}`)
        process.exit(1)
      }
    }
  }

  // 7. Summary
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Domain:                ${DOMAIN_CODE} (${domain.id})`)
  console.log(`  Mode:                  ${APPLY ? 'APPLY' : 'DRY RUN'}`)
  console.log(`  Attempts inspected:    ${attempts.length}`)
  console.log(`  Attempts rescored:     ${changed}`)
  console.log(`    false → true:        ${byChangeKind.false_to_true}`)
  console.log(`    true  → false:       ${byChangeKind.true_to_false}`)
  console.log(`  domain_exam_sessions:  ${desChanged} correct_count to update`)
  console.log(`  LO quizzes / sessions: NOT TOUCHED (out of scope)`)
  if (!APPLY) {
    console.log('')
    console.log('  Nothing was written. Re-run with --apply to commit.')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch((e) => {
  console.error('✗ Fatal:', e.message)
  process.exit(1)
})
