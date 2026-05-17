// seed_questions.js
// ----------------------------------------------------------------
// Seeds questions, question_options, and question_subtopics from a
// CSV in ./questions/<code>.csv. Two scope modes:
//
//   LO quizzes:    code matches an LO (e.g. TS1.1)  → questions.lo_id set
//   Domain exams:  code matches /^D\d+$/  (e.g. D1) → questions.domain_id set
//
// Usage:
//   node --env-file=.env seed_questions.js TS1.1     # LO quiz
//   node --env-file=.env seed_questions.js D1        # domain exam
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
// For domain exam CSVs, the lo_code column carries the domain code
// (e.g. "D1") rather than an LO code.
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
const codeArg = process.argv[2]
if (!codeArg) {
  console.error('Usage: node --env-file=.env seed_questions.js <CODE>')
  console.error('  Examples:  TS1.1 (LO quiz)   D1 (domain exam)')
  process.exit(1)
}

const DOMAIN_CODE_RE = /^D\d+$/i
const isDomainMode = DOMAIN_CODE_RE.test(codeArg)

// ── Env ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env. ' +
    'Run with: node --env-file=.env seed_questions.js <CODE>'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Helpers ──────────────────────────────────────────────────────
// Normalise answer_value to the canonical form the app's scoring
// expects. mc/mr must be the lowercase strings 'true'/'false';
// ordering ("1","2",…) and matching (e.g. "R2") values pass through
// unchanged, as does empty. Defensive against CSVs that ship with
// "TRUE"/"FALSE" or surrounding whitespace.
function normaliseAnswerValue(v) {
  const s = (v ?? '').trim()
  const lower = s.toLowerCase()
  if (lower === 'true') return 'true'
  if (lower === 'false') return 'false'
  return s
}

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

// ── Lookups ──────────────────────────────────────────────────────
async function fetchLoIdByCode(loCode) {
  const { data, error } = await supabase
    .from('los')
    .select('id, code')
    .eq('code', loCode)
    .maybeSingle()
  if (error) throw new Error(`LO lookup failed for ${loCode}: ${error.message}`)
  if (!data) throw new Error(`LO ${loCode} not found`)
  return data.id
}

async function fetchDomainByCode(domainCode) {
  const { data, error } = await supabase
    .from('domains')
    .select('id, code, exam_id')
    .eq('code', domainCode)
  if (error) throw new Error(`Domain lookup failed for ${domainCode}: ${error.message}`)
  if (!data || data.length === 0) {
    throw new Error(`Domain ${domainCode} not found`)
  }
  if (data.length > 1) {
    throw new Error(
      `Domain code "${domainCode}" matches ${data.length} domains across exams; ambiguous. ` +
      `Add an exam scope to disambiguate.`
    )
  }
  return data[0]
}

async function fetchQuestionTypeMap() {
  const { data, error } = await supabase.from('question_types').select('id, code')
  if (error) throw new Error(`question_types lookup failed: ${error.message}`)
  return Object.fromEntries(data.map((t) => [t.code, t.id]))
}

async function fetchSubtopicMapForLo(loId) {
  const { data, error } = await supabase
    .from('subtopics')
    .select('id, code, lo_id')
    .eq('lo_id', loId)
  if (error) throw new Error(`subtopics lookup failed: ${error.message}`)
  return Object.fromEntries(data.map((s) => [s.code, { id: s.id, lo_id: s.lo_id }]))
}

async function fetchSubtopicMapForDomain(domainId) {
  // All LOs in this domain
  const { data: loRows, error: loErr } = await supabase
    .from('los')
    .select('id, code')
    .eq('domain_id', domainId)
  if (loErr) throw new Error(`LO lookup for domain failed: ${loErr.message}`)
  const loIds = (loRows ?? []).map((l) => l.id)
  if (loIds.length === 0) return {}
  const { data, error } = await supabase
    .from('subtopics')
    .select('id, code, lo_id')
    .in('lo_id', loIds)
  if (error) throw new Error(`subtopics lookup failed: ${error.message}`)
  return Object.fromEntries(data.map((s) => [s.code, { id: s.id, lo_id: s.lo_id }]))
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const csvPath = path.join(__dirname, 'questions', `${codeArg}.csv`)

  console.log(`▶ Mode: ${isDomainMode ? 'DOMAIN EXAM' : 'LO QUIZ'}`)
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

  // ── Sanity-check: all rows share the same scope code ──
  const csvScopeCodes = new Set(records.map((r) => r.lo_code))
  if (csvScopeCodes.size !== 1 || !csvScopeCodes.has(codeArg)) {
    console.error(
      `✗ CSV lo_code mismatch. Expected only "${codeArg}", saw [${[...csvScopeCodes].join(', ')}]`
    )
    process.exit(1)
  }

  // ── Resolve scope target + subtopic map ──
  let loId = null
  let domainId = null
  let subtopicMap

  if (isDomainMode) {
    const domain = await fetchDomainByCode(codeArg)
    domainId = domain.id
    subtopicMap = await fetchSubtopicMapForDomain(domainId)
    console.log(`▶ Domain ${codeArg} → ${domainId} (exam ${domain.exam_id})`)
  } else {
    loId = await fetchLoIdByCode(codeArg)
    subtopicMap = await fetchSubtopicMapForLo(loId)
    console.log(`▶ LO ${codeArg} → ${loId}`)
  }
  console.log(
    `▶ Subtopics in scope: ${Object.keys(subtopicMap).join(', ') || '(none)'}`
  )

  const questionTypes = await fetchQuestionTypeMap()

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

    const subCodes = (head.subtopic_codes || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    const missingSubs = subCodes.filter((c) => !subtopicMap[c])
    if (missingSubs.length) {
      failures.push({
        ref,
        reason: `subtopic codes not found in ${codeArg}: ${missingSubs.join(', ')}`,
      })
      failed++
      continue
    }

    // 1. Upsert question by question_ref. Always set both lo_id and
    //    domain_id explicitly so the questions_scope_chk CHECK is
    //    satisfied even when re-targeting an existing row.
    const verified = String(head.verified).toLowerCase() === 'true'
    const payload = {
      question_ref: ref,
      lo_id: loId,
      domain_id: domainId,
      question_type_id: qtId,
      question_text: head.question_text,
      explanation: head.explanation,
      difficulty: head.difficulty || null,
      source: head.source,
      verified,
    }

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
      answer_value: normaliseAnswerValue(r.answer_value),
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

    // 3. Replace question_subtopics. Each row carries lo_id from the
    //    subtopic's parent LO (works for both LO and domain modes).
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
        subtopic_id: subtopicMap[c].id,
        lo_id: subtopicMap[c].lo_id,
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

  // ── lo_question_types upsert (LO mode only — junction is LO-scoped) ──
  if (!isDomainMode) {
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
  }

  // ── Summary ──
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Scope:     ${codeArg} (${isDomainMode ? 'domain' : 'lo'})`)
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
