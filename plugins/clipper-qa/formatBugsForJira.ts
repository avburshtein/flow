import {
  clipperQaAppNameEnv,
  clipperQaAppVersionEnv,
  clipperQaGitBranchEnv,
  clipperQaStandUrlEnv,
} from './clipperQaEnv'
import type { ClippedBug } from './types'

/** Metadata for the export prefix (stand URL, build, branch). */
export interface JiraExportMeta {
  standUrl: string
  appName: string
  appVersion: string
  gitBranch: string
}

function displayOrDash(v: string | undefined): string {
  const t = (v ?? '').trim()
  return t.length ? t : '—'
}

/**
 * Builds meta from `process.env` and optionally `window` (stand URL).
 * Call in the browser (e.g. on Copy click) so `origin` is correct.
 */
export function buildClipperExportMeta(): JiraExportMeta {
  let standUrl = clipperQaStandUrlEnv() ?? ''
  if (!standUrl && typeof window !== 'undefined') {
    standUrl = window.location.origin
  }

  return {
    standUrl: displayOrDash(standUrl),
    appName: displayOrDash(clipperQaAppNameEnv()),
    appVersion: displayOrDash(clipperQaAppVersionEnv()),
    gitBranch: displayOrDash(clipperQaGitBranchEnv()),
  }
}

function codeBlock(label: string, body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return `**${label}:** —\n`
  if (trimmed.includes('```')) {
    return `**${label}:**\n~~~text\n${trimmed}\n~~~\n`
  }
  return `**${label}:**\n\`\`\`text\n${trimmed}\n\`\`\`\n`
}

/**
 * Markdown text for pasting into a Jira issue description (new editor).
 */
export function formatBugsForJira(bugs: ClippedBug[], meta: JiraExportMeta): string {
  const lines: string[] = [
    '## Context',
    '',
    `- **Test stand:** ${meta.standUrl}`,
    `- **Project (package):** ${meta.appName} @ ${meta.appVersion}`,
    `- **Branch:** ${meta.gitBranch}`,
    '',
    '---',
    '',
    `## Bugs (${bugs.length})`,
    '',
  ]

  bugs.forEach((b, i) => {
    const n = i + 1
    lines.push(`### ${n}. ${displayOrDash(b.component)}`)
    lines.push('')
    lines.push(`- **File:** \`${b.file || '—'}\``)
    lines.push(`- **Breakpoint:** ${b.breakpoint}`)
    lines.push('')
    lines.push(codeBlock('DOM classes', b.classes))
    lines.push('')
    lines.push('**Description:**')
    lines.push('')
    lines.push(b.description.trim() || '—')
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  return lines.join('\n').trimEnd() + '\n'
}
