-- Allow unauthenticated users to read published exams (shown on login/signup page).
-- Exam titles, codes, and provider names are non-sensitive marketing information.

CREATE POLICY "public_read_published_exams"
  ON exams
  FOR SELECT
  TO anon
  USING (status = 'published');
