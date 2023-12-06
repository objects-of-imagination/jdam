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
  Result, 
  UPDATE_NODE_RPC, 
  UpdateNodeRequest, 
  UpdateNodeResponse, 
  WS_PATH
} from '~shared/api'
import { Id, Node } from '~shared/data'
import Deferred from '~shared/deferred'
import Evt from '~shared/evt'
import { RPC, RPCMessageTarget } from '~shared/rpc'

export type DataState = {
  nodes: Map<Id, Node>
  selectedNodes: Set<Id>
  root?: Id
}

function createDataState(): DataState {
  return {
    nodes: new Map(),
    selectedNodes: new Set()
  }
}

type SessionClientEvts = {
  'set-data': (state: Partial<DataState>) => void
  'rpc-error': (errors: string[]) => void
}

export class SessionClient extends Evt<SessionClientEvts> {

  data = createDataState()
  rpc!: RPC
  connected = new Deferred<boolean>()

  async init() {
    this.data = createDataState()
    this.connected.init()

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

    const result = await this.getNodes()
    if (!result) { return }
    
    this.data.nodes = new Map(result.nodes.map(n => [ n.id, n ]))
    this.data.root = result.root.id
    this.data.selectedNodes.add(result.root.id)

    this.fire('set-data', structuredClone(this.data))

    return
  }

  setNodes(nodes: Node[]) {
    const selected: string[] = []
    this.data.nodes = new Map(nodes.map(n => [ n.id, n ]))
    for (const node of nodes) {
      if (!this.data.selectedNodes.has(node.id)) { continue }
      selected.push(node.id)
    }
    this.data.selectedNodes = new Set(selected)
    this.fire('set-data', { nodes: structuredClone(this.data.nodes) })
  }

  setRoot(nodeId: Id) {
    if (this.data.root) {
      this.data.selectedNodes.delete(this.data.root)
    }

    this.data.root = nodeId
    this.data.selectedNodes.add(nodeId)
    this.fire('set-data', { root: this.data.root })
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

  getVisibleNodes() {
    const result: [ number, Node[] ][] = []
    if (!this.data.root) { return result }

    let level = 0
    let currentNode = this.data.nodes.get(this.data.root)!
    result.push([ -1, [ currentNode ] ])

    while(currentNode.children.length) {

      let childNodes: Node[] = []
      let selectedChild: Node | undefined
      let childWithChildren: Node | undefined

      for (const childId of currentNode.children) {
        const childNode = this.data.nodes.get(childId)
        if (!childNode) { continue }

        childNodes.push(childNode)

        if (!childWithChildren && childNode.children.length) {
          childWithChildren = childNode
        }

        if (!this.data.selectedNodes.has(childNode.id)) { continue }
        selectedChild = childNode
      }

      result.push([ level, childNodes ])

      if (!selectedChild && !childWithChildren) { break }

      if (selectedChild) { currentNode = selectedChild }
      if (childWithChildren) { currentNode = childWithChildren }
      level++ 
    }
    
    return result
  }

  async createNode(request: CreateNodeRequest['request']): Promise<CreateNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<CreateNodeRequest, CreateNodeResponse>('create-node', request)
      this.syncNodes()
      return result
    } catch (err) {
      this.fire('rpc-error', err as string[])
    }
  }

  async deleteNode(request: DeleteNodeRequest['request']): Promise<DeleteNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<DeleteNodeRequest, DeleteNodeResponse>('delete-node', request)
      this.syncNodes()
      return result
    } catch (err) {
      this.fire('rpc-error', err as string[])
    }
  }

  async updateNode(request: UpdateNodeRequest['request']): Promise<UpdateNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<UpdateNodeRequest, UpdateNodeResponse>('update-node', request)
      this.syncNodes()
      return result
    } catch (err) {
      this.fire('rpc-error', err as string[])
    }
  }

}
