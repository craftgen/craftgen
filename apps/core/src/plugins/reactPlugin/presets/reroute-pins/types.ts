import { ConnectionId } from 'rete'

import { Position, RenderSignal } from '../../types'

export type Pin = {
  id: string
  position: Position
  selected?: boolean
}
export type PinData = {
  id: ConnectionId
  pins: Pin[]
}

export type PinsRender =
  | RenderSignal<'reroute-pins', { data: PinData }>
