import { describe, it, expect } from 'vitest'
import { validateItem, validatePack } from '../src/content/validate'

const goodItem = {
  id: 'dog',
  label: 'Dog',
  image: 'dog.svg',
  sound: 'bark',
  animation: 'wag',
  coPlayPrompt: "Say 'Dog!'",
  realWorldBridge: 'Go find a dog.',
}

describe('content validation', () => {
  it('accepts a well-formed item', () => {
    expect(validateItem(goodItem)?.id).toBe('dog')
  })

  it('rejects an item missing a required field', () => {
    const { label: _label, ...noLabel } = goodItem
    expect(validateItem(noLabel)).toBeNull()
  })

  it('defaults an unknown animation rather than crashing', () => {
    expect(validateItem({ ...goodItem, animation: 'explode' })?.animation).toBe(
      'bounce',
    )
  })

  it('silently skips bad items but keeps good ones in a pack', () => {
    const pack = validatePack({
      id: 'everyday',
      items: [goodItem, { id: 'broken' }, { ...goodItem, id: 'cat', label: 'Cat' }],
    })
    expect(pack?.items.map((i) => i.id)).toEqual(['dog', 'cat'])
  })

  it('rejects a pack with no valid items', () => {
    expect(validatePack({ id: 'x', items: [{ id: 'broken' }] })).toBeNull()
  })
})
