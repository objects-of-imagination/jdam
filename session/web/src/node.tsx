import { Id, Node } from '~shared/data'
import { useClient } from './client_provider'

import styles from './node.module.css'

export interface NodeDisplayProps {
  node: Node
  index: number
  length: number
}

export function NodeDisplay(props: NodeDisplayProps) {
  const client = useClient()

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
      class={ `rounded ${styles.node}` } 
      style={ {
        'grid-column': `${props.length + props.index + 1} / span 1`
      } }
      onClick={ handleOnClick }
    >
      { props.node.id }
      <button
        onClick={ handleOnDelete }
      >
        X
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
    <div 
      tabIndex={ 0 }
      class={ `flex center rounded ${styles.node}` } 
      onClick={ handleOnClick }
    >
       New Idea 
    </div>
  )
}
