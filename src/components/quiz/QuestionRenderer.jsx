import McQuestion from './McQuestion.jsx'
import MrQuestion from './MrQuestion.jsx'
import OrderingQuestion from './OrderingQuestion.jsx'
import MatchingQuestion from './MatchingQuestion.jsx'

export default function QuestionRenderer({
  questionTypeCode,
  options,
  value,
  onChange,
  disabled,
  feedback,
}) {
  const sorted = [...options].sort((a, b) => a.sort_order - b.sort_order)
  const props = { options: sorted, value, onChange, disabled, feedback }

  switch (questionTypeCode) {
    case 'mc':
      return <McQuestion {...props} />
    case 'mr':
      return <MrQuestion {...props} />
    case 'ordering':
      return <OrderingQuestion {...props} />
    case 'matching':
      return <MatchingQuestion {...props} />
    default:
      return (
        <p className="text-red-600 text-sm">
          Unsupported question type: {questionTypeCode}
        </p>
      )
  }
}
