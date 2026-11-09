export const getBreakpoint = (): 'Mobile' | 'Desktop' =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
    ? 'Mobile'
    : 'Desktop'

export const getClassString = (el: Element): string => {
  if (el instanceof HTMLElement) return String(el.className ?? '')
  if (el instanceof SVGElement && el.className) {
    if (typeof el.className === 'string') return el.className
    return el.className.baseVal ?? ''
  }
  return el.getAttribute('class') ?? ''
}

export const isInsideWidget = (node: EventTarget | null, root: HTMLElement | null) => {
  if (!(node instanceof Element)) return false
  if (root?.contains(node)) return true
  return node.closest('[data-clipper-qa-root]') !== null
}

export const elementFromPointExcludingWidget = (
  x: number,
  y: number,
  root: HTMLElement | null
): Element | null => {
  const el = document.elementFromPoint(x, y)
  if (!el || isInsideWidget(el, root)) return null
  return el
}

export const captureContextFromElement = (el: Element) => {
  const fileEl = el.closest('[data-qa-file]')
  const compEl = el.closest('[data-qa-component]')
  const file = fileEl?.getAttribute('data-qa-file') ?? ''
  const component = compEl?.getAttribute('data-qa-component') ?? ''
  const classes = getClassString(el)
  return {
    file,
    component,
    classes,
    breakpoint: getBreakpoint(),
  }
}

export const restoreBodyCursor = () => {
  document.body.style.removeProperty('cursor')
}
