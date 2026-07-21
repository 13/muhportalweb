// MQTT topic matching per spec: '+' matches one level, '#' matches the rest.
// Level-based comparison instead of regex so special characters in topics
// ('$', '.', '(' etc.) can never break or over-match.
export function topicMatchesPattern(pattern: string, topic: string): boolean {
  const patternLevels = pattern.split('/')
  const topicLevels = topic.split('/')

  for (let i = 0; i < patternLevels.length; i++) {
    const level = patternLevels[i]
    if (level === '#') return true
    if (i >= topicLevels.length) return false
    if (level !== '+' && level !== topicLevels[i]) return false
  }

  return patternLevels.length === topicLevels.length
}

export function parseJson<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
