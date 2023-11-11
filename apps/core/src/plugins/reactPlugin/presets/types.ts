import { ReactElement } from 'react'
import { BaseSchemes } from 'rete'

import { ReactPlugin } from '..'

export type RenderPreset<Schemes extends BaseSchemes, T> = {
  attach?: (plugin: ReactPlugin<Schemes, T>) => void
  render: (context: Extract<T, { type: 'render' }>, plugin: ReactPlugin<Schemes, T>) => ReactElement | null | undefined
}
