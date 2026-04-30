// Pure scoring logic. Identical contract to plan.md scoring rules.
// answer_value convention:
//   mc/mr      → 'true' for correct, 'false' for incorrect
//   ordering   → '1', '2', '3' ... = correct position number
//   matching L → partner option_key (e.g. 'R2'); R rows have empty answer_value

export function calculateIsCorrect(questionTypeCode, userAnswer, options) {
  if (!options?.length) return false

  switch (questionTypeCode) {
    case 'mc': {
      // userAnswer = 'A'
      const correct = options.find((o) => o.answer_value === 'true')
      return Boolean(correct) && userAnswer === correct.option_key
    }

    case 'mr': {
      // userAnswer = ['A', 'C']
      if (!Array.isArray(userAnswer)) return false
      const correctKeys = options
        .filter((o) => o.answer_value === 'true')
        .map((o) => o.option_key)
        .sort()
      const selected = [...userAnswer].sort()
      if (correctKeys.length === 0) return false
      return JSON.stringify(correctKeys) === JSON.stringify(selected)
    }

    case 'ordering': {
      // userAnswer = ['B', 'A', 'C'] — keys in user's chosen sequence
      if (!Array.isArray(userAnswer)) return false
      if (userAnswer.length !== options.length) return false
      return options.every((o) => {
        const userPos = userAnswer.indexOf(o.option_key) + 1
        return userPos === parseInt(o.answer_value, 10)
      })
    }

    case 'matching': {
      // userAnswer = { L1: 'R2', L2: 'R1' }
      if (!userAnswer || typeof userAnswer !== 'object') return false
      const lefts = options.filter((o) => o.option_key.startsWith('L'))
      if (lefts.length === 0) return false
      return lefts.every((o) => userAnswer[o.option_key] === o.answer_value)
    }

    default:
      return false
  }
}

// Per-question type, shape of an empty user answer (used to seed component state)
export function emptyAnswerFor(questionTypeCode) {
  switch (questionTypeCode) {
    case 'mc':
      return null
    case 'mr':
      return []
    case 'ordering':
      return [] // populated with option_keys in user's order
    case 'matching':
      return {} // { L1: 'R2', ... }
    default:
      return null
  }
}

// Has the student given an answer for this question?
export function isAnswered(questionTypeCode, userAnswer, options = []) {
  switch (questionTypeCode) {
    case 'mc':
      return Boolean(userAnswer)
    case 'mr':
      return Array.isArray(userAnswer) && userAnswer.length > 0
    case 'ordering':
      return Array.isArray(userAnswer) && userAnswer.length === options.length
    case 'matching': {
      if (!userAnswer || typeof userAnswer !== 'object') return false
      const lefts = options.filter((o) => o.option_key.startsWith('L'))
      return lefts.every((o) => Boolean(userAnswer[o.option_key]))
    }
    default:
      return false
  }
}

// Fisher–Yates shuffle (immutable)
export function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
