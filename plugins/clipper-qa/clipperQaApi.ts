import { clipperQaSendToAiUrl, clipperQaWellDoneUrl } from './clipperQaEnv'
import { buildClipperExportMeta } from './formatBugsForJira'
import type { ClippedBug } from './types'

function bugsPayload(bugs: ClippedBug[]) {
  return bugs.map(({ id, file, component, classes, description, breakpoint }) => ({
    id,
    file,
    component,
    classes,
    description,
    breakpoint,
  }))
}

export async function postBugsToAi(bugs: ClippedBug[]): Promise<void> {
  const url = clipperQaSendToAiUrl()?.trim()
  if (!url) {
    throw new Error('Send-to-AI URL is not set (NEXT_PUBLIC_CLIPPER_QA_SEND_TO_AI_URL)')
  }
  const context = buildClipperExportMeta()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bugs: bugsPayload(bugs), context }),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
}

export async function postWellDoneCommand(): Promise<void> {
  const url = clipperQaWellDoneUrl()?.trim()
  if (!url) {
    throw new Error('WELL DONE URL is not set (NEXT_PUBLIC_CLIPPER_QA_WELL_DONE_URL)')
  }
  const context = buildClipperExportMeta()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: true, context }),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
}
