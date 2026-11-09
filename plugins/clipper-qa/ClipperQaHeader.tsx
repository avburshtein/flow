'use client'

import { ClipboardList, ScanSearch, Trash2 } from 'lucide-react'

type Props = {
  hasBugs: boolean
  inspectMode: boolean
  onClearBatch: () => void
  onToggleInspect: () => void
  onCollapse: () => void
}

export const ClipperQaHeader = ({
  hasBugs,
  inspectMode,
  onClearBatch,
  onToggleInspect,
  onCollapse,
}: Props) => {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <ClipboardList className="h-4 w-4 shrink-0 text-indigo-600" />
        <span className="truncate text-sm font-semibold text-zinc-900">ClipperQA</span>
      </div>

      {hasBugs && (
        <button
          title="Clear all clips"
          type="button"
          onClick={onClearBatch}
          className="inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-200 sm:flex-initial"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
      )}

      <div className="flex flex-wrap items-stretch gap-2">
        <button
          title="Inspect mode"
          type="button"
          onClick={onToggleInspect}
          aria-pressed={inspectMode}
          className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
            inspectMode
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          <ScanSearch className="h-3.5 w-3.5" />
        </button>

        <button
          title="Collapse"
          type="button"
          onClick={onCollapse}
          className="inline-flex min-w-9 cursor-pointer items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          —
        </button>
      </div>
    </header>
  )
}
