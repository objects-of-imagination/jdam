import { Id, Node, Sound } from '~shared/data'
import { useClient } from '../client_provider'
import { Track } from './track'
import { For, createComputed, createSignal, onCleanup, onMount } from 'solid-js'
import { DataState } from '../client/session_client'

import styles from './node.module.css'

export interface NodeDisplayProps {
  node: Node
  index: number
  length: number
}

export function NodeDisplay(props: NodeDisplayProps) {
  const client = useClient()

  const [ sounds, setSounds ] = createSignal<Sound[]>([])

  createComputed(() => {
    setSounds(client.getSoundsForNode(props.node.id))
  })

  const onSetData = (data: Partial<DataState>) => {
    if (!data.sounds) { return }
    setSounds(client.getSoundsForNode(props.node.id))
  }

  onMount(() => {
    client.on('set-data', onSetData)
  })

  onCleanup(() => {
    client.off('set-data', onSetData)
  })

  const handleOnClick = () => {
    client.setActiveNode(props.node.id)
  }

  const handleOnDelete = async () => {
    await client.deleteNode({ id: props.node.id }) 
    const siblings = client.getChildren(props.node.parent || client.data.root || '')
    if (siblings.length) {
      client.setActiveNode(siblings[Math.max(0, Math.min(siblings.length - 1, props.index - 1))].id)
      return
    }
    client.setActiveNode(props.node.parent || client.data.root || '')
  }

  return (
    <div 
      tabIndex={ 0 }
      class={ `position relative rounded ${styles.node}` } 
      style={ {
        'grid-column': `${props.length + props.index + 1} / span 1`
      } }
      onClick={ handleOnClick }
    >
      <For each={ sounds() }>
        { sound => (
          <Track node={ props.node } sound={ sound }/>
        )}
      </For>
      <Track node={ props.node }/>
      <button
        class="secondary flex center corner circle"
        onClick={ handleOnDelete }
      >
        &#10005;
      </button>
    </div>
  )
}


export interface AddNodeDisplayProps {
  parentId: Id
}

export function AddNodeDisplay(props: AddNodeDisplayProps) {
  const client = useClient()

  const handleOnClick = async () => {
    const newNode = await client.createNode({ createdBy: client.data.person, parent: props.parentId })
    if (!newNode) { return }
    client.setActiveNode(newNode.id)
  }

  return (
    <button
      class={ `flex center rounded ${styles.node}` } 
      onClick={ handleOnClick }
    >
       New Idea 
    </button>
  )
}
