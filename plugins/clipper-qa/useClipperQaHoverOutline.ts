'use client'

import { useEffect, type MutableRefObject } from 'react'

import { OUTLINE, OUTLINE_OFFSET } from './constants'
import { elementFromPointExcludingWidget, restoreBodyCursor } from './domCapture'

type Args = {
  rootRef: MutableRefObject<HTMLDivElement | null>
  inspectModeRef: MutableRefObject<boolean>
  hoverRef: MutableRefObject<Element | null>
  suppressHoverOutlineRef: MutableRefObject<boolean>
  clearHoverOutline: () => void
}

export function useClipperQaHoverOutline({
  rootRef,
  inspectModeRef,
  hoverRef,
  suppressHoverOutlineRef,
  clearHoverOutline,
}: Args) {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (suppressHoverOutlineRef.current) {
        return
      }

      const highlight = inspectModeRef.current || e.altKey
      if (!highlight) {
        const prev = hoverRef.current
        if (prev && (prev instanceof HTMLElement || prev instanceof SVGElement)) {
          prev.style.outline = ''
          prev.style.outlineOffset = ''
        }
        hoverRef.current = null
        restoreBodyCursor()
        return
      }

      const root = rootRef.current
      const hit = elementFromPointExcludingWidget(e.clientX, e.clientY, root)
      const prev = hoverRef.current
      if (prev && prev !== hit) {
        if (prev instanceof HTMLElement || prev instanceof SVGElement) {
          prev.style.outline = ''
          prev.style.outlineOffset = ''
        }
      }
      if (hit && (hit instanceof HTMLElement || hit instanceof SVGElement)) {
        hit.style.outline = OUTLINE
        hit.style.outlineOffset = OUTLINE_OFFSET
        hoverRef.current = hit

        if (hit.closest('[data-qa-file]') !== null) {
          document.body.style.cursor = 'copy'
        } else {
          restoreBodyCursor()
        }
      } else {
        hoverRef.current = null
        restoreBodyCursor()
      }
    }

    const onScroll = () => {
      clearHoverOutline()
      restoreBodyCursor()
    }

    const clearIfAltOnly = () => {
      if (!inspectModeRef.current) {
        clearHoverOutline()
        restoreBodyCursor()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'AltLeft' || e.code === 'AltRight' || e.key === 'Alt') {
        clearIfAltOnly()
      }
    }

    const onBlur = () => clearIfAltOnly()

    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur)
      clearHoverOutline()
      restoreBodyCursor()
    }
  }, [clearHoverOutline, hoverRef, inspectModeRef, rootRef, suppressHoverOutlineRef])
}
