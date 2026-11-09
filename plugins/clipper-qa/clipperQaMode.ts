import { clipperQaActionModeRaw } from './clipperQaEnv'
import type { ClipperQaActionMode } from './types'

export function getClipperQaActionMode(): ClipperQaActionMode {
  const v = clipperQaActionModeRaw().toLowerCase()
  if (v === 'copyinfo') return 'copyinfo'
  return 'default'
}
