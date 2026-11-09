'use client'

import { useEffect, type MutableRefObject } from 'react'

import { OUTLINE_CAPTURE, OUTLINE_OFFSET } from './constants'
import { isInsideWidget, restoreBodyCursor } from './domCapture'

type Args = {
  rootRef: MutableRefObject<HTMLDivElement | null>
  inspectMode: boolean
  pendingCaptureTargetRef: MutableRefObject<Element | null>
  suppressHoverOutlineRef: MutableRefObject<boolean>
  addBugFromElement: (target: Element) => void
  clearHoverOutline: () => void
}

export function useClipperQaCapture({
  rootRef,
  inspectMode,
  pendingCaptureTargetRef,
  suppressHoverOutlineRef,
  addBugFromElement,
  clearHoverOutline,
}: Args) {
  useEffect(() => {
    const shouldIntercept = (e: MouseEvent) => {
      if (e.button !== 0) return false
      if (isInsideWidget(e.target, rootRef.current)) return false
      return inspectMode || e.altKey
    }

    const onMouseDown = (e: MouseEvent) => {
      if (!shouldIntercept(e)) return
      e.preventDefault()
      e.stopPropagation()

      const target = e.target
      if (!(target instanceof Element)) return

      pendingCaptureTargetRef.current = target
      suppressHoverOutlineRef.current = true

      clearHoverOutline()
      restoreBodyCursor()

      if (target instanceof HTMLElement || target instanceof SVGElement) {
        target.style.outline = OUTLINE_CAPTURE
        target.style.outlineOffset = OUTLINE_OFFSET
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return
      const pending = pendingCaptureTargetRef.current
      pendingCaptureTargetRef.current = null
      suppressHoverOutlineRef.current = false

      if (!pending) return

      if (pending instanceof HTMLElement || pending instanceof SVGElement) {
        pending.style.outline = ''
        pending.style.outlineOffset = ''
      }

      clearHoverOutline()
      restoreBodyCursor()

      if (!(pending instanceof Element)) return
      if (isInsideWidget(pending, rootRef.current)) return

      addBugFromElement(pending)
    }

    const onClickCapture = (e: MouseEvent) => {
      if (!shouldIntercept(e)) return
      e.preventDefault()
      e.stopImmediatePropagation()
    }

    window.addEventListener('mousedown', onMouseDown, true)
    window.addEventListener('mouseup', onMouseUp, true)
    window.addEventListener('click', onClickCapture, true)
    return () => {
      window.removeEventListener('mousedown', onMouseDown, true)
      window.removeEventListener('mouseup', onMouseUp, true)
      window.removeEventListener('click', onClickCapture, true)
      pendingCaptureTargetRef.current = null
      suppressHoverOutlineRef.current = false
      restoreBodyCursor()
    }
  }, [
    inspectMode,
    addBugFromElement,
    clearHoverOutline,
    pendingCaptureTargetRef,
    rootRef,
    suppressHoverOutlineRef,
  ])
}
