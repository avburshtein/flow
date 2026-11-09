'use client'

import { Copy, Send, ThumbsUp } from 'lucide-react'

import type { ClipperQaActionMode } from './types'

type Props = {
  actionMode: ClipperQaActionMode
  bugsCount: number
  copyHint: string | null
  defaultApiHint: string | null
  wellDoneAck: boolean
  sendingAi: boolean
  sendingDone: boolean
  onCopyJira: () => void
  onSendToAi: () => void
  onSendWellDone: () => void
}

export const ClipperQaFooter = ({
  actionMode,
  bugsCount,
  copyHint,
  defaultApiHint,
  wellDoneAck,
  sendingAi,
  sendingDone,
  onCopyJira,
  onSendToAi,
  onSendWellDone,
}: Props) => {
  return (
    <>
      {actionMode === 'copyinfo' && copyHint ? (
        <p className="text-center text-xs text-zinc-600" role="status" aria-live="polite">
          {copyHint}
        </p>
      ) : null}
      {actionMode === 'default' && defaultApiHint ? (
        <p className="text-center text-xs text-zinc-600" role="status" aria-live="polite">
          {defaultApiHint}
        </p>
      ) : null}

      {actionMode === 'copyinfo' ? (
        bugsCount > 0 ? (
          <button
            type="button"
            onClick={() => void onCopyJira()}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <Copy className="h-4 w-4 shrink-0" strokeWidth={2} />
            Copy
          </button>
        ) : null
      ) : bugsCount === 0 ? (
        <button
          type="button"
          data-acknowledged={wellDoneAck ? 'true' : 'false'}
          disabled={sendingDone}
          onClick={() => void onSendWellDone()}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ThumbsUp className="h-4 w-4 shrink-0" strokeWidth={2} />
          {sendingDone ? 'Sending…' : 'WELL DONE'}
        </button>
      ) : (
        <button
          type="button"
          disabled={sendingAi}
          onClick={() => void onSendToAi()}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4 shrink-0" />
          {sendingAi ? 'Sending…' : 'SEND TO AI'}
        </button>
      )}
    </>
  )
}
