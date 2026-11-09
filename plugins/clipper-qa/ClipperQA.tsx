'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { BugListItem } from './BugListItem'
import { copyTextToClipboard } from './clipboard'
import { postBugsToAi, postWellDoneCommand } from './clipperQaApi'
import { ClipperQaCollapsed } from './ClipperQaCollapsed'
import { ClipperQaFooter } from './ClipperQaFooter'
import { ClipperQaHeader } from './ClipperQaHeader'
import { WIDGET_INTERACTIVE_CLASS } from './constants'
import { captureContextFromElement, restoreBodyCursor } from './domCapture'
import { buildClipperExportMeta, formatBugsForJira } from './formatBugsForJira'
import { getClipperQaActionMode } from './clipperQaMode'
import type { ClippedBug } from './types'
import { useClipperQaCapture } from './useClipperQaCapture'
import { useClipperQaHoverOutline } from './useClipperQaHoverOutline'
import { useClipperQaStorage } from './useClipperQaStorage'

export type { ClippedBug, ClipperQaActionMode } from './types'

export const ClipperQA = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<Element | null>(null)
  const inspectModeRef = useRef(false)
  const suppressHoverOutlineRef = useRef(false)
  const pendingCaptureTargetRef = useRef<Element | null>(null)

  const {
    expanded,
    setExpanded,
    bugs,
    setBugs,
    wellDoneAck,
    setWellDoneAck,
    persistedBugIdsRef,
  } = useClipperQaStorage()

  const [inspectMode, setInspectMode] = useState(false)
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [defaultApiHint, setDefaultApiHint] = useState<string | null>(null)
  const [sendingAi, setSendingAi] = useState(false)
  const [sendingDone, setSendingDone] = useState(false)

  const actionMode = getClipperQaActionMode()

  const clearHoverOutline = useCallback(() => {
    const prev = hoverRef.current
    if (prev instanceof HTMLElement || prev instanceof SVGElement) {
      prev.style.outline = ''
      prev.style.outlineOffset = ''
    }
    hoverRef.current = null
  }, [])

  const addBugFromElement = useCallback((target: Element) => {
    const ctx = captureContextFromElement(target)
    const next: ClippedBug = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `bug-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: ctx.file,
      component: ctx.component,
      classes: ctx.classes,
      description: '',
      breakpoint: ctx.breakpoint,
    }
    setBugs((prev) => [next, ...prev])
  }, [setBugs])

  inspectModeRef.current = inspectMode

  useEffect(() => {
    if (!inspectMode) {
      restoreBodyCursor()
    }
  }, [inspectMode])

  useClipperQaHoverOutline({
    rootRef,
    inspectModeRef,
    hoverRef,
    suppressHoverOutlineRef,
    clearHoverOutline,
  })

  useClipperQaCapture({
    rootRef,
    inspectMode,
    pendingCaptureTargetRef,
    suppressHoverOutlineRef,
    addBugFromElement,
    clearHoverOutline,
  })

  const updateDescription = (id: string, description: string) => {
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, description } : b)))
  }

  const clearBatch = () => setBugs([])

  const removeBug = (id: string) => {
    setBugs((prev) => prev.filter((b) => b.id !== id))
  }

  const scheduleClearDefaultHint = useCallback(() => {
    window.setTimeout(() => setDefaultApiHint(null), 3000)
  }, [])

  const sendToAi = useCallback(async () => {
    setSendingAi(true)
    setDefaultApiHint(null)
    try {
      await postBugsToAi(bugs)
      setBugs([])
      setDefaultApiHint('Data sent to AI')
      scheduleClearDefaultHint()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error'
      setDefaultApiHint(msg)
      scheduleClearDefaultHint()
    } finally {
      setSendingAi(false)
    }
  }, [bugs, scheduleClearDefaultHint, setBugs])

  const sendWellDone = useCallback(async () => {
    setSendingDone(true)
    setDefaultApiHint(null)
    try {
      await postWellDoneCommand()
      setWellDoneAck(true)
      setDefaultApiHint('Server accepted the command')
      scheduleClearDefaultHint()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error'
      setDefaultApiHint(msg)
      scheduleClearDefaultHint()
    } finally {
      setSendingDone(false)
    }
  }, [scheduleClearDefaultHint, setWellDoneAck])

  const copyBugsForJira = useCallback(async () => {
    const text = formatBugsForJira(bugs, buildClipperExportMeta())
    const ok = await copyTextToClipboard(text)
    setCopyHint(ok ? 'Copied to clipboard' : 'Copy failed')
    window.setTimeout(() => setCopyHint(null), 2500)
  }, [bugs])

  if (!expanded) {
    return <ClipperQaCollapsed rootRef={rootRef} onExpand={() => setExpanded(true)} />
  }

  return (
    <div
      ref={rootRef}
      data-clipper-qa-root
      className={`fixed right-5 bottom-5 z-[2147483646] flex max-h-[min(85vh,36rem)] w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans text-zinc-900 shadow-xl ring-1 shadow-zinc-400/25 ring-zinc-200/80 ${WIDGET_INTERACTIVE_CLASS}`}
    >
      <ClipperQaHeader
        hasBugs={!!bugs.length}
        inspectMode={inspectMode}
        onClearBatch={clearBatch}
        onToggleInspect={() => setInspectMode((v) => !v)}
        onCollapse={() => setExpanded(false)}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        {!bugs.length && (
          <p className="text-[11px] leading-snug text-zinc-600">
            Hold <span className="font-medium text-indigo-700">Alt</span> to highlight on hover, or
            use Inspect for the same without Alt. <span className="text-indigo-700">Alt+click</span>{' '}
            clips anytime (outside this panel). With Inspect or{' '}
            <span className="font-medium text-indigo-700">Alt</span> held, cursor becomes copy over
            elements that expose <span className="font-mono">data-qa-file</span>.
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50">
          {bugs.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500">
              No clips yet. Turn on Inspect or Alt+click an element.
            </p>
          ) : (
            <ul className="divide-y-0">
              {bugs.map((b) => (
                <BugListItem
                  key={b.id}
                  bug={b}
                  animateEnter={!persistedBugIdsRef.current.has(b.id)}
                  onRemove={removeBug}
                  onDescriptionChange={updateDescription}
                />
              ))}
            </ul>
          )}
        </div>

        <ClipperQaFooter
          actionMode={actionMode}
          bugsCount={bugs.length}
          copyHint={copyHint}
          defaultApiHint={defaultApiHint}
          wellDoneAck={wellDoneAck}
          sendingAi={sendingAi}
          sendingDone={sendingDone}
          onCopyJira={copyBugsForJira}
          onSendToAi={sendToAi}
          onSendWellDone={sendWellDone}
        />
      </div>
    </div>
  )
}
