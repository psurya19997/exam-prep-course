// Resume logic for a returning student.
// Returns one of:
//   { type: 'resume_quiz_dialog', lo_id, session_id }
//   { type: 'content', lo_id }
//   { type: 'quiz', lo_id }
//   { type: 'domain_exam', domain_id }
//   { type: 'completed' }

import { supabase } from '../lib/supabase.js'

export async function findCurrentPosition(userId, examId) {
  // 1. Active LO quiz session?
  const { data: activeQuiz } = await supabase
    .from('lo_quiz_sessions')
    .select('id, lo_id, session_id, sessions!inner(user_id, exam_id)')
    .eq('sessions.user_id', userId)
    .eq('sessions.exam_id', examId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (activeQuiz) {
    return {
      type: 'resume_quiz_dialog',
      lo_id: activeQuiz.lo_id,
      session_id: activeQuiz.session_id,
      lo_quiz_session_id: activeQuiz.id,
    }
  }

  // 2. Walk LOs in order
  const { data: domains } = await supabase
    .from('domains')
    .select('id, sort_order, los(id, sort_order)')
    .eq('exam_id', examId)
    .order('sort_order')

  if (!domains?.length) return { type: 'completed' }

  // Pull all completed content + quiz sessions for this user/exam in one go
  const { data: contentDone } = await supabase
    .from('content_progress')
    .select('lo_id, sessions!inner(user_id, exam_id)')
    .eq('sessions.user_id', userId)
    .eq('sessions.exam_id', examId)
    .eq('is_completed', true)

  const { data: quizDone } = await supabase
    .from('lo_quiz_sessions')
    .select('lo_id, sessions!inner(user_id, exam_id)')
    .eq('sessions.user_id', userId)
    .eq('sessions.exam_id', examId)
    .eq('status', 'completed')

  const { data: domainExamDone } = await supabase
    .from('domain_exam_sessions')
    .select('domain_id, sessions!inner(user_id, exam_id)')
    .eq('sessions.user_id', userId)
    .eq('sessions.exam_id', examId)
    .eq('status', 'completed')

  const contentSet = new Set((contentDone ?? []).map((r) => r.lo_id))
  const quizSet = new Set((quizDone ?? []).map((r) => r.lo_id))
  const domainExamSet = new Set((domainExamDone ?? []).map((r) => r.domain_id))

  const sortedDomains = [...domains].sort((a, b) => a.sort_order - b.sort_order)
  for (const d of sortedDomains) {
    const sortedLos = [...(d.los ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )
    for (const lo of sortedLos) {
      if (!contentSet.has(lo.id)) return { type: 'content', lo_id: lo.id }
      if (!quizSet.has(lo.id)) return { type: 'quiz', lo_id: lo.id }
    }
    if (!domainExamSet.has(d.id))
      return { type: 'domain_exam', domain_id: d.id }
  }

  return { type: 'completed' }
}
