// seed_questions.js
// ----------------------------------------------------------------
// Seeds questions, question_options, and question_subtopics for one
// LO at a time from a CSV in ./questions/<lo_code>.csv.
//
// Usage:
//   node --env-file=.env seed_questions.js TS1.1
//
// The script is idempotent: re-running with the same CSV upserts
// questions by question_ref and rewrites their options + subtopic
// links so edits in the CSV always overwrite the DB cleanly.
//
// CSV columns (one row per option; rows for the same question
// share question_ref + question_text + explanation):
//   question_ref, lo_code, question_type, question_text,
//   explanation, subtopic_codes, difficulty, source, verified,
//   option_key, option_text, answer_value, sort_order
//
// subtopic_codes is pipe-separated (e.g. "k-1-1-1|s-1-1-1").
// answer_value:
//   mc/mr      → "true" / "false"
//   ordering   → position number as string ("1", "2", ...)
//   matching L → partner option_key (e.g. "R2")
//   matching R → empty string
// ----------------------------------------------------------------

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── CLI args ─────────────────────────────────────────────────────
const loArg = process.argv[2]
if (!loArg) {
  console.error('Usage: node --env-file=.env seed_questions.js <LO_CODE>')
  console.error('Example: node --env-file=.env seed_questions.js TS1.1')
  process.exit(1)
}

// ── Env ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. ' +
    'Run with: node --env-file=.env seed_questions.js <LO_CODE>'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── CSV parser (RFC-4180-ish) ────────────────────────────────────
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
      continue
    }
    if (c === '"') { inQuotes = true; continue }
    if (c === ',') { row.push(field); field = ''; continue }
    if (c === '\r') continue
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

function rowsToObjects(rows) {
  if (rows.length === 0) return []
  const [headers, ...body] = rows
  const trimmed = headers.map((h) => h.trim())
  return body
    .filter((r) => r.length > 1 || (r[0] && r[0].trim()))
    .map((r) => {
      const obj = {}
      trimmed.forEach((h, i) => { obj[h] = (r[i] ?? '').trim() })
      return obj
    })
}

// ── Lookups (cached) ─────────────────────────────────────────────
async function fetchLoIdByCode(loCode) {
  const { data, error } = await supabase
    .from('los')
    .select('id, code')
    .eq('code', loCode)
    .single()
  if (error) throw new Error(`LO lookup failed for ${loCode}: ${error.message}`)
  return data.id
}

async function fetchQuestionTypeMap() {
  const { data, error } = await supabase.from('question_types').select('id, code')
  if (error) throw new Error(`question_types lookup failed: ${error.message}`)
  return Object.fromEntries(data.map((t) => [t.code, t.id]))
}

async function fetchSubtopicMapForLo(loId) {
  const { data, error } = await supabase
    .from('subtopics')
    .select('id, code')
    .eq('lo_id', loId)
  if (error) throw new Error(`subtopics lookup failed: ${error.message}`)
  return Object.fromEntries(data.map((s) => [s.code, s.id]))
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const csvPath = path.join(__dirname, 'questions', `${loArg}.csv`)

  console.log(`▶ Reading ${csvPath}`)
  let raw
  try {
    raw = await readFile(csvPath, 'utf8')
  } catch (e) {
    console.error(`✗ Could not read ${csvPath}: ${e.message}`)
    process.exit(1)
  }

  const records = rowsToObjects(parseCSV(raw))
  if (records.length === 0) {
    console.error('✗ CSV is empty.')
    process.exit(1)
  }

  // ── Group by question_ref ──
  const byRef = new Map()
  for (const r of records) {
    if (!r.question_ref) continue
    if (!byRef.has(r.question_ref)) byRef.set(r.question_ref, [])
    byRef.get(r.question_ref).push(r)
  }
  console.log(`▶ Parsed ${records.length} CSV rows → ${byRef.size} unique questions`)

  // ── Sanity-check the LO ──
  const csvLoCodes = new Set(records.map((r) => r.lo_code))
  if (csvLoCodes.size !== 1 || !csvLoCodes.has(loArg)) {
    console.error(
      `✗ CSV lo_code mismatch. Expected only "${loArg}", saw [${[...csvLoCodes].join(', ')}]`
    )
    process.exit(1)
  }

  const loId = await fetchLoIdByCode(loArg)
  const questionTypes = await fetchQuestionTypeMap()
  const subtopicMap = await fetchSubtopicMapForLo(loId)
  console.log(`▶ LO ${loArg} → ${loId}`)
  console.log(`▶ Subtopics in LO: ${Object.keys(subtopicMap).join(', ') || '(none)'}`)

  // ── Per-question loop ──
  let inserted = 0
  let updated = 0
  let failed = 0
  const failures = []

  for (const [ref, rows] of byRef) {
    const head = rows[0]
    const qtCode = head.question_type
    const qtId = questionTypes[qtCode]
    if (!qtId) {
      failures.push({ ref, reason: `unknown question_type "${qtCode}"` })
      failed++
      continue
    }

    // Build subtopic id list for this question
    const subCodes = (head.subtopic_codes || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    const missingSubs = subCodes.filter((c) => !subtopicMap[c])
    if (missingSubs.length) {
      failures.push({
        ref,
        reason: `subtopic codes not found in LO ${loArg}: ${missingSubs.join(', ')}`,
      })
      failed++
      continue
    }

    // 1. Upsert question by question_ref
    const verified = String(head.verified).toLowerCase() === 'true'
    const payload = {
      question_ref: ref,
      lo_id: loId,
      question_type_id: qtId,
      question_text: head.question_text,
      explanation: head.explanation,
      difficulty: head.difficulty || null,
      source: head.source,
      verified,
    }

    // Lookup existing question by question_ref
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .eq('question_ref', ref)
      .maybeSingle()

    let questionId
    let didInsert = false
    if (existing) {
      questionId = existing.id
      const { error: updErr } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', questionId)
      if (updErr) {
        failures.push({ ref, reason: `update failed: ${updErr.message}` })
        failed++
        continue
      }
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('questions')
        .insert(payload)
        .select('id')
        .single()
      if (insErr) {
        failures.push({ ref, reason: `insert failed: ${insErr.message}` })
        failed++
        continue
      }
      questionId = ins.id
      didInsert = true
    }

    // 2. Replace question_options
    const { error: delOptErr } = await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId)
    if (delOptErr) {
      failures.push({ ref, reason: `delete options: ${delOptErr.message}` })
      failed++
      continue
    }
    const optionRows = rows.map((r) => ({
      question_id: questionId,
      option_key: r.option_key,
      option_text: r.option_text,
      answer_value: r.answer_value ?? '',
      sort_order: parseInt(r.sort_order, 10) || 0,
    }))
    const { error: insOptErr } = await supabase
      .from('question_options')
      .insert(optionRows)
    if (insOptErr) {
      failures.push({ ref, reason: `insert options: ${insOptErr.message}` })
      failed++
      continue
    }

    // 3. Replace question_subtopics
    const { error: delSubErr } = await supabase
      .from('question_subtopics')
      .delete()
      .eq('question_id', questionId)
    if (delSubErr) {
      failures.push({ ref, reason: `delete subtopics: ${delSubErr.message}` })
      failed++
      continue
    }
    if (subCodes.length) {
      const subRows = subCodes.map((c) => ({
        question_id: questionId,
        subtopic_id: subtopicMap[c],
        lo_id: loId,
      }))
      const { error: insSubErr } = await supabase
        .from('question_subtopics')
        .insert(subRows)
      if (insSubErr) {
        failures.push({ ref, reason: `insert subtopics: ${insSubErr.message}` })
        failed++
        continue
      }
    }

    if (didInsert) inserted++
    else updated++
    const tag = didInsert ? 'INS' : 'UPD'
    console.log(
      `  ${tag} ${ref}  ${qtCode.padEnd(8)} options=${rows.length} subs=${subCodes.length}`
    )
  }

  // ── Make sure lo_question_types covers what we just inserted ──
  const usedTypeIds = [
    ...new Set([...byRef.values()].map((rows) => questionTypes[rows[0].question_type])),
  ].filter(Boolean)
  if (usedTypeIds.length) {
    const { error: lqtErr } = await supabase
      .from('lo_question_types')
      .upsert(
        usedTypeIds.map((qt) => ({ lo_id: loId, question_type_id: qt })),
        { onConflict: 'lo_id,question_type_id', ignoreDuplicates: true }
      )
    if (lqtErr) {
      console.warn(`! lo_question_types upsert warning: ${lqtErr.message}`)
    }
  }

  // ── Summary ──
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  LO:        ${loArg}`)
  console.log(`  Inserted:  ${inserted}`)
  console.log(`  Updated:   ${updated}`)
  console.log(`  Failed:    ${failed}`)
  if (failures.length) {
    console.log('')
    console.log('  Failures:')
    for (const f of failures) console.log(`   - ${f.ref}: ${f.reason}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('✗ Fatal:', e.message)
  process.exit(1)
})
