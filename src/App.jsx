import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ExamCatalog from './pages/exam/ExamCatalog.jsx'
import ExamDetail from './pages/exam/ExamDetail.jsx'
import StudyDashboard from './pages/study/StudyDashboard.jsx'
import LOContent from './pages/study/LOContent.jsx'
import LOQuiz from './pages/study/LOQuiz.jsx'
import DomainExam from './pages/study/DomainExam.jsx'
import ProgressDashboard from './pages/progress/ProgressDashboard.jsx'
import PageWrapper from './components/layout/PageWrapper.jsx'

function ComingSoon({ title }) {
  return (
    <PageWrapper>
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-2">Coming in the next session.</p>
    </PageWrapper>
  )
}

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/exams" element={<Protected><ExamCatalog /></Protected>} />
      <Route path="/exams/:examId" element={<Protected><ExamDetail /></Protected>} />

      <Route path="/study/:examId" element={<Protected><StudyDashboard /></Protected>} />
      <Route path="/study/:examId/lo/:loId/content" element={<Protected><LOContent /></Protected>} />
      <Route path="/study/:examId/lo/:loId/quiz" element={<Protected><LOQuiz /></Protected>} />
      <Route path="/study/:examId/domain/:domainId/exam" element={<Protected><DomainExam /></Protected>} />
      <Route path="/progress" element={<Protected><ProgressDashboard /></Protected>} />

      <Route path="/" element={<Navigate to="/exams" replace />} />
      <Route path="*" element={<Navigate to="/exams" replace />} />
    </Routes>
  )
}
