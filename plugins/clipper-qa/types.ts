export interface ClippedBug {
  id: string
  file: string
  component: string
  classes: string
  description: string
  breakpoint: 'Mobile' | 'Desktop'
}

/** Footer button mode; extend with more values as needed. */
export type ClipperQaActionMode = 'default' | 'copyinfo'
