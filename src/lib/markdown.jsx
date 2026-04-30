import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold text-blue-900 mt-8 mb-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-blue-900 mt-8 mb-4" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-semibold text-teal-700 mt-6 mb-3" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-gray-900" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="text-gray-600 not-italic font-medium" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-6 space-y-2 my-3" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 space-y-2 my-3" {...props} />
  ),
  li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
  p: ({ node, ...props }) => (
    <p className="text-gray-700 leading-relaxed mb-4" {...props} />
  ),
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      />
    ) : (
      <code className="font-mono text-sm" {...props} />
    ),
  pre: ({ node, ...props }) => (
    <pre
      className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-200 pl-4 italic text-gray-600 my-4"
      {...props}
    />
  ),
  a: ({ node, ...props }) => (
    <a className="text-blue-600 hover:underline" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-200" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th
      className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-gray-200 px-3 py-2" {...props} />
  ),
}

export function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children || ''}
    </ReactMarkdown>
  )
}
