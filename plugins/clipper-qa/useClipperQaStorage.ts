'use client'

import { useEffect, useRef, useState } from 'react'

import { STORAGE_BUGS, STORAGE_EXPANDED, STORAGE_WELL_DONE } from './constants'
import type { ClippedBug } from './types'

export function useClipperQaStorage() {
  const persistedBugIdsRef = useRef<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)
  const [bugs, setBugs] = useState<ClippedBug[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [wellDoneAck, setWellDoneAck] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      try {
        const exp = localStorage.getItem(STORAGE_EXPANDED)
        if (exp !== null) setExpanded(exp === 'true')
        const raw = localStorage.getItem(STORAGE_BUGS)
        persistedBugIdsRef.current = new Set()
        if (raw) {
          const parsed = JSON.parse(raw) as unknown
          if (Array.isArray(parsed)) {
            const loaded = parsed.filter(
              (b): b is ClippedBug =>
                typeof b === 'object' &&
                b !== null &&
                'id' in b &&
                'file' in b &&
                'component' in b &&
                'classes' in b &&
                'description' in b &&
                'breakpoint' in b
            )
            persistedBugIdsRef.current = new Set(loaded.map((b) => b.id))
            setBugs(loaded)
          }
        }
        const wd = localStorage.getItem(STORAGE_WELL_DONE)
        setWellDoneAck(wd === 'true')
      } catch {
        /* ignore corrupt storage */
      }
      setStorageReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    localStorage.setItem(STORAGE_EXPANDED, String(expanded))
  }, [expanded, storageReady])

  useEffect(() => {
    if (!storageReady) return
    localStorage.setItem(STORAGE_BUGS, JSON.stringify(bugs))
  }, [bugs, storageReady])

  useEffect(() => {
    if (!storageReady) return
    localStorage.setItem(STORAGE_WELL_DONE, String(wellDoneAck))
  }, [wellDoneAck, storageReady])

  return {
    expanded,
    setExpanded,
    bugs,
    setBugs,
    wellDoneAck,
    setWellDoneAck,
    storageReady,
    persistedBugIdsRef,
  }
}
