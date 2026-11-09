'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

import type { ClippedBug } from './types'

export interface BugListItemProps {
  bug: ClippedBug
  animateEnter: boolean
  onRemove: (id: string) => void
  onDescriptionChange: (id: string, value: string) => void
}

export const BugListItem = ({
  bug: b,
  animateEnter,
  onRemove,
  onDescriptionChange,
}: BugListItemProps) => {
  const [fadeIn, setFadeIn] = useState(!animateEnter)

  useEffect(() => {
    let cancelled = false
    let outer = 0
    let inner = 0

    if (!animateEnter) {
      queueMicrotask(() => {
        if (!cancelled) setFadeIn(true)
      })
      return () => {
        cancelled = true
      }
    }

    queueMicrotask(() => {
      if (cancelled) return
      setFadeIn(false)
      outer = window.requestAnimationFrame(() => {
        if (cancelled) return
        inner = window.requestAnimationFrame(() => {
          if (!cancelled) setFadeIn(true)
        })
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [animateEnter, b.id])

  return (
    <li
      className={`border-b border-zinc-200 p-3 transition-opacity duration-300 ease-out last:border-b-0 ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-0.5 text-[11px]">
          <p className="font-medium text-indigo-800">{b.component || '(no data-qa-component)'}</p>
          <p className="truncate text-zinc-500" title={b.file}>
            {b.file || '(no data-qa-file)'}
          </p>
          <p className="text-zinc-600">{b.breakpoint}</p>
          <p
            className="max-h-12 overflow-y-auto font-mono text-[10px] break-all text-zinc-500"
            title={b.classes}
          >
            {b.classes || '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(b.id)}
          className="shrink-0 cursor-pointer rounded-md p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Remove clip"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <label className="sr-only" htmlFor={`desc-${b.id}`}>
        Description
      </label>
      <textarea
        id={`desc-${b.id}`}
        value={b.description}
        onChange={(e) => onDescriptionChange(b.id, e.target.value)}
        placeholder="Bug description…"
        rows={2}
        className="w-full cursor-pointer resize-none rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />
    </li>
  )
}
