import { For, Index, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { useClient } from './client_provider'
import { DataState } from './client/session_client'
import { Id, Node } from '~shared/data'
import { AddNodeDisplay, NodeDisplay } from './node'

import styles from './node_lanes.module.css'

export function NodeLanes() {
  const client = useClient()

  const [ visibleNodes, setVisibleNodes ] = createSignal(client.getVisibleNodes())

  const onSetData = (data: Partial<DataState>) => {
    if (!(data.nodes || data.selectedNodes || data.activeNode)) { return }
    setVisibleNodes(client.getVisibleNodes())
  }

  onMount(() => {
    client.on('set-data', onSetData)
  })

  onCleanup(() => {
    client.off('set-data', onSetData)
  })

  return (
    <div class={ `flex column ${styles.nodeLanes}` }>
      <Index each={ visibleNodes() }>
        { layer => (
          <NodeLane 
            nodes={ layer()[0] } 
            selectedIndex={ layer()[1] } 
            parentId={ layer()[2] }
            limit={ client.data.nodes.get(layer()[2])?.maxLength ?? 4 } 
          />
        )}
      </Index>
    </div>
  )
}

export interface NodeLaneProps {
  selectedIndex: number
  nodes: Node[]
  parentId: Id
  limit: number
}

export function NodeLane(props: NodeLaneProps) {

  return (
    <div class={ `flex center ${styles.nodeLane} overflow hidden` }>
      <div class={ styles.container } style={ {
        'grid-template-columns': `repeat(${props.nodes.length + 1}, var(--node-width))`,
        '--offset-index': String(-props.selectedIndex)
      } }>
        <Show 
          when={ props.nodes.length }
          fallback={ 
            <div class={ styles.wrapper }>
              <AddNodeDisplay parentId={ props.parentId }/>
            </div>
          }
        >
          <For each={ props.nodes }>
            { (node, index) => (
              <div class={ styles.wrapper }>
                <NodeDisplay node={ node } index={ index() } length={ props.nodes.length }/>
              </div>
            )}
          </For>
          <Show when={ props.nodes.length < props.limit }>
            <div class={ styles.wrapper }>
              <AddNodeDisplay parentId={ props.parentId }/>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}
