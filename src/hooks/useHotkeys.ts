import { useEffect } from 'react'

type Handler = (event: KeyboardEvent) => void

const isTypingElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  )
}

export function useHotkeys(bindings: Record<string, Handler>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const wantsGlobal = ['/', 'escape']

      if (isTypingElement(event.target) && !wantsGlobal.includes(key)) {
        return
      }

      const handler = bindings[key]
      if (!handler) return
      handler(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bindings])
}
