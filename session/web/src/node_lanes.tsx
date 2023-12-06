import { For, createSignal, onCleanup, onMount } from 'solid-js'
import { useClient } from './client_provider'
import { DataState } from './client/session_client'
import { Node } from '~shared/data'

import styles from './node_lanes.module.css'

export function NodeLanes() {
  const client = useClient()

  const [ visibleNodes, setVisibleNodes ] = createSignal(client.getVisibleNodes().slice(1))

  const onSetData = (data: Partial<DataState>) => {
    if (!(data.nodes || data.selectedNodes)) { return }
    setVisibleNodes(client.getVisibleNodes().slice(1))
  }

  onMount(() => {
    client.on('set-data', onSetData)
  })

  onCleanup(() => {
    client.off('set-data', onSetData)
  })

  return (
    <div class={ `flex column ${styles.nodeLanes}` }>
      <For each={ visibleNodes() }>
        {([ level, nodes ]) => (
          <NodeLane level={ level } nodes={ nodes }/>
        )}
      </For>
    </div>
  )
}

export interface NodeLaneProps {
  level: number
  nodes: Node[]
}

export function NodeLane(props: NodeLaneProps) {

  return (
    <div class={ `flex ${styles.nodeLane}` }>
      <For each={ props.nodes }>
        { node => (
          <div>{ node.id }</div>
        )}
      </For>
    </div>
  )
}
