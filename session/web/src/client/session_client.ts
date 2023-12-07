import { 
  CREATE_NODE_RPC,
  CreateNodeRequest,
  CreateNodeResponse,
  DELETE_NODE_RPC,
  DeleteNodeRequest,
  DeleteNodeResponse,
  GET_NODES_RPC,
  GetNodesRequest,
  GetNodesResponse,
  HEARTBEAT_PATH,
  HeartbeatResponse,
  HostInitRequest,
  HostInitResponse,
  Result, 
  UPDATE_NODE_RPC, 
  UPLOAD_SOUND, 
  UpdateNodeRequest, 
  UpdateNodeResponse, 
  UploadSoundResponse, 
  WS_PATH
} from '~shared/api'
import { Id, Node } from '~shared/data'
import Deferred from '~shared/deferred'
import Evt from '~shared/evt'
import { RPC, RPCMessageTarget } from '~shared/rpc'

export type DataState = {
  nodes: Map<Id, Node>
  selectedNodes: Set<Id>
  activeNode: Id
  root?: Id
  person: Id
  name: string
  people: Set<Id>
}

function createDataState(): DataState {
  return {
    nodes: new Map(),
    selectedNodes: new Set(),
    activeNode: '',
    person: 'test',
    name: 'Session',
    people: new Set([ 'test' ])
  }
}

type SessionClientEvts = {
  'set-data': (state: Partial<DataState>) => void
  'error': (errors: string[]) => void
}

export class SessionClient extends Evt<SessionClientEvts> {

  data = createDataState()
  rpc!: RPC
  hostRpc!: RPC
  connected = new Deferred<boolean>()
  hostInit = new Deferred<boolean>()

  async init() {
    this.data = createDataState()
    this.connected.init()
    this.hostInit.init()

    const ws = new WebSocket(new URL(WS_PATH, `ws://${window.location.host}`).toString())
    ws.addEventListener('open', () => {
      this.connected.resolve(true)
    })
    ws.addEventListener('close', () => {
      this.connected.init()
    })

    const target: RPCMessageTarget = {
      send: async (data: unknown) => { 
        await this.connected.promise
        ws.send(JSON.stringify(data))
      },
      onReceive: handler => {
        const onMessage = async (evt: MessageEvent) => {
          try {
            const message = JSON.parse(evt.data.toString('utf8'))
            handler(message)
          } catch (err) {
          /* parsing error */
          }
        }

        ws.addEventListener('message', onMessage)
        return () => {
          ws.removeEventListener('message', onMessage)
        }
      }
    }

    this.rpc = new RPC(target, {
      [ CREATE_NODE_RPC ]: () => {
        this.syncNodes()
      },
      [ DELETE_NODE_RPC ]: () => {
        this.syncNodes()
      },
      [ UPDATE_NODE_RPC ]: () => {
        this.syncNodes()
      }
    })

    const hostTarget: RPCMessageTarget = {
      send: async (data: unknown) => { 
        await this.connected.promise
        if (!window.top || window.top === window) { return }
        window.top.postMessage(data, window.location.origin)
      },
      onReceive: handler => {
        const onMessage = async (evt: MessageEvent) => {
          try {
            const message = evt.data
            handler(message)
          } catch (err) {
          /* parsing error */
          }
        }

        window.addEventListener('message', onMessage)
        return () => {
          window.removeEventListener('message', onMessage)
        }
      }
    }

    this.hostRpc = new RPC(hostTarget, {
    })

    if (window.top && window.top !== window) {
      const hostInitInfo = await this.hostRpc.send<HostInitRequest, HostInitResponse>('host-init')
      if (hostInitInfo) {
        this.data.person = hostInitInfo.person
        this.data.name = hostInitInfo.name
        this.data.people = new Set(hostInitInfo.people)
      }
      this.hostInit.resolve(true)
    }

    const result = await this.getNodes()
    if (!result) { return }
    
    this.data.nodes = new Map(result.nodes.map(n => [ n.id, n ]))
    this.data.root = result.root.id
    this.data.activeNode = result.root.id
    this.data.selectedNodes.add(result.root.id)

    this.fire('set-data', structuredClone(this.data))

    return
  }

  setNodes(nodes: Node[]) {
    const selected: string[] = []

    const nodesInMap = new Set<Id>()

    for (const node of nodes) {
      nodesInMap.add(node.id)

      const existingNode = this.data.nodes.get(node.id)
      if (existingNode) { 
        Object.assign(existingNode, node) 
      }
      else { 
        this.data.nodes.set(node.id, node) 
      }

      if (!this.data.selectedNodes.has(node.id)) { continue }
      selected.push(node.id)
    }

    for (const nodeId of this.data.nodes.keys()) {
      if (nodesInMap.has(nodeId)) { continue }
      this.data.nodes.delete(nodeId)
    }

    if (!this.data.nodes.has(this.data.activeNode)) {
      this.data.activeNode = nodes[0].id || this.data.root || ''
    }


    this.data.selectedNodes = new Set(selected)
    this.fire('set-data', { nodes: structuredClone(this.data.nodes) })
  }

  async heartbeat(): Promise<Result> {
    const response = await fetch(HEARTBEAT_PATH)
    try { 
      const result = await response.json() as HeartbeatResponse
      return result.result
    } catch (err) {
      return 'failure'
    }
  }

  async getNodes(): Promise<GetNodesResponse['response'] | undefined> {
    return await this.rpc.send<GetNodesRequest, GetNodesResponse>(GET_NODES_RPC)
  }

  async syncNodes() {
    const result = await this.getNodes()
    if (!result) { return }

    const { nodes } = result
    if (!nodes?.length) { return }

    this.setNodes(nodes)
  }

  getChildren(nodeId: Id): Node[] {
    const existingNode = this.data.nodes.get(nodeId)
    if (!existingNode) { return [] }

    const children: Node[] = []
    for (const childId of existingNode.children) {
      const childNode = this.data.nodes.get(childId)
      if (!childNode) { continue }
      children.push(childNode)
    }

    return children
  }

  getSiblings(nodeId: Id): Node[] {
    const result: Node[] = []
    const node = this.data.nodes.get(nodeId)
    if (!node) { return result }

    const parentId = node.parent

    for (const node of this.data.nodes.values()) {
      if (parentId !== node.parent) { continue }
      result.push(node)
    }

    return result
  }

  getVisibleNodes() {

    // add any children of the active node immediately at the +1 level
    const result: [ Node[], number, Id ][] = [
      [ this.getChildren(this.data.activeNode || this.data.root || ''), 0, this.data.activeNode || this.data.root || '' ]
    ]

    let currentNode = this.getActiveNode()
    if (!currentNode) { return result }

    while(currentNode?.parent) {
      const currentId = currentNode.id
      const siblings = this.getSiblings(currentId)
      const selectedIndex = siblings.findIndex(s => s.id === currentId)

      result.unshift([ siblings, selectedIndex, currentNode.parent ])

      currentNode = this.data.nodes.get(currentNode.parent)
    }
    
    return result
     
  }

  setActiveNode(nodeId: Id) {
    if (!this.data.nodes.has(nodeId)) { return }

    this.data.activeNode = nodeId
    this.fire('set-data', { activeNode: this.data.activeNode })
  }

  getActiveNode() {
    return this.data.nodes.get(this.data.activeNode || this.data.root || '')
  }

  async createNode(request: CreateNodeRequest['request']): Promise<CreateNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<CreateNodeRequest, CreateNodeResponse>('create-node', request)
      await this.syncNodes()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async deleteNode(request: DeleteNodeRequest['request']): Promise<DeleteNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<DeleteNodeRequest, DeleteNodeResponse>('delete-node', request)
      await this.syncNodes()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async updateNode(request: UpdateNodeRequest['request']): Promise<UpdateNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<UpdateNodeRequest, UpdateNodeResponse>('update-node', request)
      await this.syncNodes()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async uploadSound(soundFile: File, name = soundFile.name) {

    const url = new URL(UPLOAD_SOUND, window.location.origin)
    url.searchParams.set(name, name)

    const response = await fetch(url, {
      method: 'POST',
      body: soundFile
    })

    try {
      const result = await response.json() as UploadSoundResponse
      if (result.result === 'failure') {
        this.fire('error', [ `Upload sound "${soundFile.name}" failed` ])
        return
      }
    } catch (err) {
      this.fire('error', [ 'Could not parse upload sound response' ])
    }

  }

  async addTestNodes() {
    await this.createNode({ createdBy: this.data.person })
    await this.createNode({ createdBy: this.data.person })
    let node = await this.createNode({ createdBy: this.data.person })
    if (node) { 
      await this.createNode({ createdBy: this.data.person, parent: node.id })
      await this.createNode({ createdBy: this.data.person, parent: node.id  })
      node = await this.createNode({ createdBy: this.data.person, parent: node.id })
    }
    if (node) { 
      await this.createNode({ createdBy: this.data.person, parent: node.id })
      await this.createNode({ createdBy: this.data.person, parent: node.id  })
      node = await this.createNode({ createdBy: this.data.person, parent: node.id })
    }
  }

}
