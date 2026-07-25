// 答案判分工具
export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"’‘“”]/g, '')
    .replace(/\s+/g, ' ')
}

export function isCorrect(user: unknown, correct: unknown): boolean {
  if (Array.isArray(correct)) {
    if (!Array.isArray(user)) return false
    if (user.length !== correct.length) return false
    return correct.every((c, i) => normalize(String(user[i])) === normalize(String(c)))
  }
  return normalize(String(user)) === normalize(String(correct))
}

export function arrEq(a: string[], b: string[]): boolean {
  return isCorrect(a, b)
}
