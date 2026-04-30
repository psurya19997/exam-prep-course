import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
    // Hard reload as a safety net — components might be in a corrupt state.
    if (typeof window !== 'undefined') window.location.assign('/exams')
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-600 mt-2">
            The page crashed unexpectedly. You can return to the exam catalog
            and try again. If this keeps happening, please report the question
            or refresh the browser.
          </p>
          <pre className="mt-4 text-xs text-left text-red-700 bg-red-50 border border-red-100 rounded p-3 overflow-auto max-h-40">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <button
            onClick={this.reset}
            className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md"
          >
            Back to exams
          </button>
        </div>
      </div>
    )
  }
}
