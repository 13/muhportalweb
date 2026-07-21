import { describe, it, expect } from 'vitest'
import { topicMatchesPattern, parseJson } from '#shared/utils/mqtt'

describe('topicMatchesPattern', () => {
  it('matches exact topics', () => {
    expect(topicMatchesPattern('muh/alarm/state', 'muh/alarm/state')).toBe(true)
    expect(topicMatchesPattern('muh/alarm/state', 'muh/alarm/set')).toBe(false)
  })

  it('matches single-level + wildcard', () => {
    expect(topicMatchesPattern('muh/portal/+/json', 'muh/portal/G/json')).toBe(true)
    expect(topicMatchesPattern('muh/portal/+/json', 'muh/portal/HDL/json')).toBe(true)
    expect(topicMatchesPattern('muh/portal/+/json', 'muh/portal/G/D/json')).toBe(false)
    expect(topicMatchesPattern('muh/portal/+/json', 'muh/portal/G')).toBe(false)
  })

  it('matches multi-level # wildcard', () => {
    expect(topicMatchesPattern('muh/pc/#', 'muh/pc/server1')).toBe(true)
    expect(topicMatchesPattern('muh/pc/#', 'muh/pc/a/b/c')).toBe(true)
    expect(topicMatchesPattern('muh/pc/#', 'muh/wol')).toBe(false)
  })

  it('does not treat regex special characters as syntax', () => {
    expect(topicMatchesPattern('muh/+/data', 'muh/$SYS/data')).toBe(true)
    expect(topicMatchesPattern('a.b/c', 'axb/c')).toBe(false)
    expect(topicMatchesPattern('a(b)/c', 'a(b)/c')).toBe(true)
  })

  it('requires same level count without wildcards', () => {
    expect(topicMatchesPattern('a/b', 'a/b/c')).toBe(false)
    expect(topicMatchesPattern('a/b/c', 'a/b')).toBe(false)
  })
})

describe('parseJson', () => {
  it('parses valid JSON', () => {
    expect(parseJson('{"state":1}')).toEqual({ state: 1 })
    expect(parseJson('[1,2]')).toEqual([1, 2])
  })

  it('returns null on invalid JSON', () => {
    expect(parseJson('ARM_AWAY')).toBeNull()
    expect(parseJson('')).toBeNull()
    expect(parseJson('{broken')).toBeNull()
  })
})
