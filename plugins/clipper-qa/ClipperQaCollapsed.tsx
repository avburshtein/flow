'use client'

import type { RefObject } from 'react'
import { Bug } from 'lucide-react'

import { WIDGET_INTERACTIVE_CLASS } from './constants'

type Props = {
  rootRef: RefObject<HTMLDivElement | null>
  onExpand: () => void
}

export const ClipperQaCollapsed = ({ rootRef, onExpand }: Props) => {
  return (
    <div
      ref={rootRef}
      data-clipper-qa-root
      className={`fixed right-5 bottom-5 z-[2147483646] font-sans ${WIDGET_INTERACTIVE_CLASS}`}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg ring-2 shadow-indigo-600/25 ring-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        aria-label="Open ClipperQA"
      >
        <Bug className="h-6 w-6" strokeWidth={2} />
      </button>
    </div>
  )
}
