-- ============================================================
-- EXAM PREP APP — SUPABASE SQL MIGRATION
-- Version: 1.1
-- Date: April 2026
-- 17 tables + 2 views + RLS policies + indexes + triggers
--
-- Changes from v1.0:
--   * Added public.auth_is_creator() SECURITY DEFINER helper to
--     break infinite recursion in RLS policies that previously
--     queried profiles inside profiles' own policy chain.
--   * All "creator" RLS checks now call auth_is_creator() instead
--     of EXISTS (SELECT 1 FROM profiles ...).
--   * handle_new_user() now declares SET search_path = public so
--     the SECURITY DEFINER trigger can resolve the profiles table
--     when fired from auth.users.
-- Run this in Supabase SQL Editor in order
-- ============================================================


-- ============================================================
-- SECTION 1: CONTENT TABLES (seeded via script, never by app)
-- ============================================================

-- 1. exams
CREATE TABLE exams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  title         text NOT NULL,
  provider      text NOT NULL,
  version       text,
  passing_score int,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE exams IS 'One row per certification exam. Top of content hierarchy.';
COMMENT ON COLUMN exams.status IS 'draft = invisible to students. published = students can enroll.';
COMMENT ON COLUMN exams.passing_score IS 'Nullable — not all exams publish a passing score.';


-- 2. domains
CREATE TABLE domains (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id        uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  code           text NOT NULL,
  title          text NOT NULL,
  weight_percent int,
  sort_order     int NOT NULL DEFAULT 0,
  UNIQUE (exam_id, code)
);

COMMENT ON TABLE domains IS 'One row per domain within an exam. MLA-C01 has 4 domains.';
COMMENT ON COLUMN domains.weight_percent IS 'Nullable — not all exams publish domain weights.';


-- 3. los (Learning Objectives)
CREATE TABLE los (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id        uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  code             text NOT NULL,
  title            text NOT NULL,
  exam_tip_summary text,
  content          text,
  sort_order       int NOT NULL DEFAULT 0,
  UNIQUE (domain_id, code)
);

COMMENT ON TABLE los IS 'One row per Learning Objective. Core unit of study. content holds full Markdown narrative student reads.';
COMMENT ON COLUMN los.content IS 'Full Markdown narrative the student reads. Written in service persona style with If-Then exam logic and cross-LO connections.';
COMMENT ON COLUMN los.exam_tip_summary IS 'One-line tip shown as callout above LO content.';


-- 4. subtopics
CREATE TABLE subtopics (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lo_id          uuid NOT NULL REFERENCES los(id) ON DELETE CASCADE,
  code           text NOT NULL,
  title          text NOT NULL,
  subtopic_type  text,
  sort_order     int NOT NULL DEFAULT 0,
  UNIQUE (lo_id, code)
);

COMMENT ON TABLE subtopics IS 'Internal tags only — no content. Used for question tagging and per-subtopic accuracy tracking. Students never see subtopic names.';
COMMENT ON COLUMN subtopics.subtopic_type IS 'Free text — knowledge or skill for MLA-C01. Other exams may use different values. Nullable.';


-- 5. question_types
CREATE TABLE question_types (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  label        text NOT NULL,
  scoring_rule text NOT NULL
);

COMMENT ON TABLE question_types IS 'Lookup table. 5 rows seeded once. Fixed by official exam guide.';

-- Seed question types immediately
INSERT INTO question_types (code, label, scoring_rule) VALUES
  ('mc',       'Multiple Choice',   '1 point for correct answer only'),
  ('mr',       'Multiple Response', 'All-or-nothing — all correct options selected and no incorrect options selected'),
  ('ordering', 'Ordering',          'All-or-nothing — all items in exact correct sequence'),
  ('matching', 'Matching',          'All-or-nothing — all pairs correctly matched'),
  ('case',     'Case Study',        'Each sub-question scored independently as mc or mr');


-- 6. lo_question_types (junction)
CREATE TABLE lo_question_types (
  lo_id            uuid NOT NULL REFERENCES los(id) ON DELETE CASCADE,
  question_type_id uuid NOT NULL REFERENCES question_types(id) ON DELETE CASCADE,
  PRIMARY KEY (lo_id, question_type_id)
);

COMMENT ON TABLE lo_question_types IS 'Junction table. Which question types are appropriate for each LO. Read at quiz generation time.';


-- 7. questions
CREATE TABLE questions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lo_id            uuid NOT NULL REFERENCES los(id) ON DELETE RESTRICT,
  question_type_id uuid NOT NULL REFERENCES question_types(id) ON DELETE RESTRICT,
  question_text    text NOT NULL,
  explanation      text NOT NULL,
  difficulty       text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  source           text NOT NULL CHECK (source IN ('ai-generated', 'community-reported', 'official-aws')),
  verified         bool NOT NULL DEFAULT false,
  reported_count   int NOT NULL DEFAULT 0,
  last_reviewed    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE questions IS 'Full question bank. Options stored in question_options. Correct answer expressed via answer_value on options.';
COMMENT ON COLUMN questions.verified IS 'Manually set to true after human review. Resets to false when question is edited.';
COMMENT ON COLUMN questions.reported_count IS 'Auto-incremented by trigger when a flag is inserted. Never manually updated.';


-- 8. question_options
CREATE TABLE question_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_key   text NOT NULL,
  option_text  text NOT NULL,
  answer_value text,
  sort_order   int NOT NULL DEFAULT 0,
  UNIQUE (question_id, option_key)
);

COMMENT ON TABLE question_options IS 'One row per option. answer_value meaning: mc/mr = true/false. ordering = correct position number. matching left = partner option_key. matching right = empty.';
COMMENT ON COLUMN question_options.answer_value IS 'mc/mr: true or false. ordering: correct position (1,2,3...). matching left side: partner option_key (e.g. R2). matching right side: empty.';


-- 9. question_subtopics (junction)
CREATE TABLE question_subtopics (
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  subtopic_id uuid NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  lo_id       uuid NOT NULL REFERENCES los(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, subtopic_id)
);

COMMENT ON TABLE question_subtopics IS 'Junction table. Links questions to subtopics they test. lo_id denormalized here to avoid chaining joins for cross-LO accuracy queries.';


-- ============================================================
-- SECTION 2: USER + PROGRESS TABLES (written by app at runtime)
-- ============================================================

-- 10. profiles
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  role         text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'creator')),
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'One row per registered user. id matches auth.users.id. Role defaults to student — creator set manually in Supabase dashboard.';
COMMENT ON COLUMN profiles.role IS 'student = study interface only. creator = can seed content and review flags. Enforced by RLS.';


-- 11. enrollments
CREATE TABLE enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id      uuid NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, exam_id)
);

COMMENT ON TABLE enrollments IS 'One row per user per exam enrolled. Enrollment at exam level. completed_at set when all domain exams are completed.';


-- ============================================================
-- SECTION 3: SESSION TABLES (thin parent + 3 children)
-- ============================================================

-- 12. sessions (thin parent)
CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id      uuid NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  session_type text NOT NULL CHECK (session_type IN ('content', 'lo_quiz', 'domain_exam')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE sessions IS 'Thin parent table. One row per activity sitting. attempts.session_id always points here regardless of session type.';


-- 13. content_progress (child)
CREATE TABLE content_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  lo_id        uuid NOT NULL REFERENCES los(id) ON DELETE RESTRICT,
  is_completed bool NOT NULL DEFAULT false,
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

COMMENT ON TABLE content_progress IS 'Tracks LO content reading. No score. is_completed set when student clicks Mark as Complete.';


-- 14. lo_quiz_sessions (child)
CREATE TABLE lo_quiz_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  lo_id              uuid NOT NULL REFERENCES los(id) ON DELETE RESTRICT,
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  correct_count      int,
  total_questions    int,
  time_taken_seconds int,
  started_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz
);

COMMENT ON TABLE lo_quiz_sessions IS 'Tracks LO practice quiz. Instant feedback per question. Resume or Restart dialog on return. correct_count and total_questions set on completion.';


-- 15. domain_exam_sessions (child)
CREATE TABLE domain_exam_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  domain_id          uuid NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  correct_count      int,
  total_questions    int,
  time_taken_seconds int,
  started_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz
);

COMMENT ON TABLE domain_exam_sessions IS 'Tracks domain exam. No feedback during exam — all answers shown at end. Always restarts on return — no resume dialog.';


-- 16. attempts
CREATE TABLE attempts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id      uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  question_type_id uuid NOT NULL REFERENCES question_types(id) ON DELETE RESTRICT,
  is_correct       bool NOT NULL,
  user_answer      jsonb NOT NULL,
  answered_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE attempts IS 'One row per question answered. Insert-only — never updated after insert. is_correct is a snapshot at time of answering — protects historical scores if question answer is later corrected.';


-- 17. flags
CREATE TABLE flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('wrong_answer', 'outdated', 'duplicate', 'unclear')),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  flagged_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

COMMENT ON TABLE flags IS 'Student-reported question problems. One flag per user per question enforced by unique constraint. reported_count on questions auto-incremented by trigger.';


-- ============================================================
-- SECTION 4: INDEXES
-- ============================================================

-- Content hierarchy traversal
CREATE INDEX idx_domains_exam_id      ON domains(exam_id);
CREATE INDEX idx_los_domain_id        ON los(domain_id);
CREATE INDEX idx_subtopics_lo_id      ON subtopics(lo_id);
CREATE INDEX idx_questions_lo_id      ON questions(lo_id);
CREATE INDEX idx_questions_type_id    ON questions(question_type_id);
CREATE INDEX idx_question_options_qid ON question_options(question_id);
CREATE INDEX idx_question_subs_qid    ON question_subtopics(question_id);
CREATE INDEX idx_question_subs_sid    ON question_subtopics(subtopic_id);
CREATE INDEX idx_question_subs_lid    ON question_subtopics(lo_id);

-- Progress queries
CREATE INDEX idx_enrollments_user     ON enrollments(user_id);
CREATE INDEX idx_enrollments_exam     ON enrollments(exam_id);
CREATE INDEX idx_sessions_user        ON sessions(user_id);
CREATE INDEX idx_sessions_exam        ON sessions(exam_id);
CREATE INDEX idx_content_prog_session ON content_progress(session_id);
CREATE INDEX idx_content_prog_lo      ON content_progress(lo_id);
CREATE INDEX idx_lo_quiz_session      ON lo_quiz_sessions(session_id);
CREATE INDEX idx_lo_quiz_lo           ON lo_quiz_sessions(lo_id);
CREATE INDEX idx_domain_exam_session  ON domain_exam_sessions(session_id);
CREATE INDEX idx_domain_exam_domain   ON domain_exam_sessions(domain_id);
CREATE INDEX idx_attempts_session     ON attempts(session_id);
CREATE INDEX idx_attempts_user        ON attempts(user_id);
CREATE INDEX idx_attempts_question    ON attempts(question_id);
CREATE INDEX idx_flags_question       ON flags(question_id);
CREATE INDEX idx_flags_status         ON flags(status);


-- ============================================================
-- SECTION 5: TRIGGERS
-- ============================================================

-- Trigger 1: Auto-create profile on auth.users insert
-- NOTE: SET search_path = public is REQUIRED. Without it, this
-- SECURITY DEFINER function runs with whatever search_path the
-- caller (auth schema) has, fails to find the profiles table,
-- and silently does nothing — leaving new users with no profile
-- row and breaking every FK that references profiles(id).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, created_at)
  VALUES (NEW.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Auto-creates a profile row when a new user signs up via Supabase Auth.';


-- Trigger 2: Increment reported_count when a flag is inserted
CREATE OR REPLACE FUNCTION increment_reported_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE questions
  SET reported_count = reported_count + 1
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_flag_inserted
  AFTER INSERT ON flags
  FOR EACH ROW EXECUTE FUNCTION increment_reported_count();

COMMENT ON FUNCTION increment_reported_count IS 'Auto-increments questions.reported_count when a student submits a flag.';


-- Trigger 3: Reset verified to false when a question is updated
CREATE OR REPLACE FUNCTION reset_verified_on_edit()
RETURNS trigger AS $$
BEGIN
  IF (
    OLD.question_text    IS DISTINCT FROM NEW.question_text OR
    OLD.explanation      IS DISTINCT FROM NEW.explanation OR
    OLD.question_type_id IS DISTINCT FROM NEW.question_type_id
  ) THEN
    NEW.verified = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_question_updated
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION reset_verified_on_edit();

COMMENT ON FUNCTION reset_verified_on_edit IS 'Resets verified to false when question_text, explanation, or question_type_id is changed.';


-- ============================================================
-- SECTION 6: ANALYTICS VIEWS
-- ============================================================

-- View 1: subtopic_accuracy
-- Per user, per subtopic accuracy — filterable by exam, domain, or LO
CREATE OR REPLACE VIEW subtopic_accuracy AS
SELECT
  a.user_id,
  qs.subtopic_id,
  qs.lo_id,
  l.domain_id,
  s.exam_id,
  COUNT(*)                                                        AS attempts,
  SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)                  AS correct,
  ROUND(
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::numeric
    / COUNT(*) * 100
  , 1)                                                            AS accuracy_pct
FROM attempts a
JOIN sessions s          ON a.session_id  = s.id
JOIN question_subtopics qs ON a.question_id = qs.question_id
JOIN los l               ON qs.lo_id      = l.id
WHERE s.session_type IN ('lo_quiz', 'domain_exam')
GROUP BY
  a.user_id,
  qs.subtopic_id,
  qs.lo_id,
  l.domain_id,
  s.exam_id;

COMMENT ON VIEW subtopic_accuracy IS 'Per-user per-subtopic accuracy. Filter by lo_id for LO-level, domain_id for domain-level, exam_id for exam-level. Excludes content sessions.';


-- View 2: question_type_accuracy
-- Per user, per question type accuracy — filterable by exam
CREATE OR REPLACE VIEW question_type_accuracy AS
SELECT
  a.user_id,
  a.question_type_id,
  qt.code                                                         AS question_type_code,
  qt.label                                                        AS question_type_label,
  s.exam_id,
  COUNT(*)                                                        AS attempts,
  SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)                  AS correct,
  ROUND(
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::numeric
    / COUNT(*) * 100
  , 1)                                                            AS accuracy_pct
FROM attempts a
JOIN sessions s       ON a.session_id       = s.id
JOIN question_types qt ON a.question_type_id = qt.id
WHERE s.session_type IN ('lo_quiz', 'domain_exam')
GROUP BY
  a.user_id,
  a.question_type_id,
  qt.code,
  qt.label,
  s.exam_id;

COMMENT ON VIEW question_type_accuracy IS 'Per-user per-question-type accuracy. Shows if student struggles with ordering vs multiple choice. Filter by exam_id.';


-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE exams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains              ENABLE ROW LEVEL SECURITY;
ALTER TABLE los                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lo_question_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options     ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_subtopics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lo_quiz_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags                ENABLE ROW LEVEL SECURITY;


-- ── HELPER: creator role check ──────────────────────────────
-- SECURITY DEFINER bypasses RLS on profiles when checking the
-- caller's role. Without this, any policy that did
-- EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='creator')
-- would re-trigger profiles' own SELECT policy and infinite-recurse.
CREATE OR REPLACE FUNCTION public.auth_is_creator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'creator'
  );
$$;

COMMENT ON FUNCTION public.auth_is_creator IS
  'Returns true if the current user has role=creator. SECURITY DEFINER to bypass profiles RLS and avoid recursion.';

GRANT EXECUTE ON FUNCTION public.auth_is_creator() TO anon, authenticated;


-- ── CONTENT TABLES ──────────────────────────────────────────
-- Students: read published exam content only
-- Creators: read and write all content

CREATE POLICY "students read published exams"
  ON exams FOR SELECT
  USING (status = 'published' OR auth_is_creator());

CREATE POLICY "creators manage exams"
  ON exams FOR ALL
  USING (auth_is_creator());

CREATE POLICY "students read domains of published exams"
  ON domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = domains.exam_id AND exams.status = 'published'
    )
    OR auth_is_creator()
  );

CREATE POLICY "creators manage domains"
  ON domains FOR ALL
  USING (auth_is_creator());

CREATE POLICY "students read los of published exams"
  ON los FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM domains
      JOIN exams ON exams.id = domains.exam_id
      WHERE domains.id = los.domain_id AND exams.status = 'published'
    )
    OR auth_is_creator()
  );

CREATE POLICY "creators manage los"
  ON los FOR ALL
  USING (auth_is_creator());

CREATE POLICY "students read subtopics of published exams"
  ON subtopics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM los
      JOIN domains ON domains.id = los.domain_id
      JOIN exams ON exams.id = domains.exam_id
      WHERE los.id = subtopics.lo_id AND exams.status = 'published'
    )
    OR auth_is_creator()
  );

CREATE POLICY "creators manage subtopics"
  ON subtopics FOR ALL
  USING (auth_is_creator());

-- question_types, lo_question_types, questions, question_options, question_subtopics
-- Students: read only. Creators: all.

CREATE POLICY "all users read question_types"
  ON question_types FOR SELECT USING (true);

CREATE POLICY "all users read lo_question_types"
  ON lo_question_types FOR SELECT USING (true);

CREATE POLICY "creators manage lo_question_types"
  ON lo_question_types FOR ALL
  USING (auth_is_creator());

CREATE POLICY "students read questions of published exams"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM los
      JOIN domains ON domains.id = los.domain_id
      JOIN exams ON exams.id = domains.exam_id
      WHERE los.id = questions.lo_id AND exams.status = 'published'
    )
    OR auth_is_creator()
  );

CREATE POLICY "creators manage questions"
  ON questions FOR ALL
  USING (auth_is_creator());

CREATE POLICY "students read question_options"
  ON question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN los ON los.id = questions.lo_id
      JOIN domains ON domains.id = los.domain_id
      JOIN exams ON exams.id = domains.exam_id
      WHERE questions.id = question_options.question_id AND exams.status = 'published'
    )
    OR auth_is_creator()
  );

CREATE POLICY "creators manage question_options"
  ON question_options FOR ALL
  USING (auth_is_creator());

CREATE POLICY "all users read question_subtopics"
  ON question_subtopics FOR SELECT USING (true);

CREATE POLICY "creators manage question_subtopics"
  ON question_subtopics FOR ALL
  USING (auth_is_creator());


-- ── PROFILES ────────────────────────────────────────────────
CREATE POLICY "users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "creators read all profiles"
  ON profiles FOR SELECT
  USING (auth_is_creator());


-- ── ENROLLMENTS ─────────────────────────────────────────────
CREATE POLICY "users read own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own enrollments"
  ON enrollments FOR UPDATE
  USING (auth.uid() = user_id);


-- ── SESSIONS ────────────────────────────────────────────────
CREATE POLICY "users read own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);


-- ── CONTENT PROGRESS ────────────────────────────────────────
CREATE POLICY "users read own content_progress"
  ON content_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = content_progress.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "users insert own content_progress"
  ON content_progress FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = content_progress.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "users update own content_progress"
  ON content_progress FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = content_progress.session_id AND sessions.user_id = auth.uid()));


-- ── LO QUIZ SESSIONS ────────────────────────────────────────
CREATE POLICY "users read own lo_quiz_sessions"
  ON lo_quiz_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = lo_quiz_sessions.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "users insert own lo_quiz_sessions"
  ON lo_quiz_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = lo_quiz_sessions.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "users update own lo_quiz_sessions"
  ON lo_quiz_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = lo_quiz_sessions.session_id AND sessions.user_id = auth.uid()));


-- ── DOMAIN EXAM SESSIONS ────────────────────────────────────
CREATE POLICY "users read own domain_exam_sessions"
  ON domain_exam_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = domain_exam_sessions.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "users insert own domain_exam_sessions"
  ON domain_exam_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = domain_exam_sessions.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "users update own domain_exam_sessions"
  ON domain_exam_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = domain_exam_sessions.session_id AND sessions.user_id = auth.uid()));


-- ── ATTEMPTS ────────────────────────────────────────────────
CREATE POLICY "users read own attempts"
  ON attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own attempts"
  ON attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update or delete on attempts — insert only


-- ── FLAGS ───────────────────────────────────────────────────
CREATE POLICY "users read own flags"
  ON flags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert flags"
  ON flags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Unique constraint already prevents duplicate flags per user per question

CREATE POLICY "creators read all flags"
  ON flags FOR SELECT
  USING (auth_is_creator());

CREATE POLICY "creators update flag status"
  ON flags FOR UPDATE
  USING (auth_is_creator());


-- ============================================================
-- DONE
-- ============================================================
-- Tables: 17
-- Views: 2 (subtopic_accuracy, question_type_accuracy)
-- Functions: 4 (handle_new_user, increment_reported_count,
--              reset_verified_on_edit, auth_is_creator)
-- Triggers: 3 (new user profile, reported_count increment, verified reset)
-- Indexes: 22
-- RLS policies: applied to all 17 tables
-- ============================================================
