import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function Navbar() {
  const { user, signOut } = useAuth()

  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${
      isActive ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
    }`

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
        <Link to="/exams" className="text-lg font-bold text-gray-900">
          Exam Prep
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/exams" className={linkClass}>
            Exams
          </NavLink>
          <NavLink to="/progress" className={linkClass}>
            Progress
          </NavLink>
        </nav>
        <div className="flex items-center gap-4 text-sm ml-auto">
          {user && <span className="text-gray-500 hidden sm:inline">{user.email}</span>}
          <button onClick={signOut} className="text-blue-600 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
