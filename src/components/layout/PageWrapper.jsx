import Navbar from './Navbar.jsx'

export default function PageWrapper({ children, max = 'max-w-5xl' }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={`${max} mx-auto px-4 py-8`}>{children}</main>
    </div>
  )
}
