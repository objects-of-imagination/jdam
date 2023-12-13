import { 
  CREATE_NODE_RPC,
  CREATE_SOUND_RPC,
  CreateNodeRequest,
  CreateNodeResponse,
  CreateSoundRequest,
  CreateSoundResponse,
  DELETE_NODE_RPC,
  DELETE_SOUND_RPC,
  DOWNLOAD_WAVE,
  DeleteNodeRequest,
  DeleteNodeResponse,
  DeleteSoundRequest,
  DeleteSoundResponse,
  ErrorResponse,
  GET_NODES_RPC,
  GET_SOUNDS_RPC,
  GetNodesRequest,
  GetNodesResponse,
  GetSoundsRequest,
  GetSoundsResponse,
  HEARTBEAT_PATH,
  HeartbeatResponse,
  HostInitRequest,
  HostInitResponse,
  Result, 
  UPDATE_NODE_RPC, 
  UPDATE_SOUND_RPC, 
  UPLOAD_WAVE, 
  UpdateNodeRequest, 
  UpdateNodeResponse, 
  UpdateSoundRequest, 
  UpdateSoundResponse,
  UploadSoundResponse, 
  WS_PATH,
  isErrorResponse
} from '~shared/api'
import { Id, Node, Sound } from '~shared/data'
import Deferred from '~shared/deferred'
import Evt from '~shared/evt'
import diffIndexed from '~shared/diff_indexed'
import { RPC, RPCMessageTarget } from '~shared/rpc'

export type DataState = {
  nodes: Map<Id, Node>
  sounds: Map<Id, Sound>
  waves: Map<Id, File>
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
    sounds: new Map(),
    waves: new Map(),
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

    this.rpc = new RPC(target, {}, {
      [ CREATE_NODE_RPC ]: () => {
        this.syncNodes()
      },
      [ DELETE_NODE_RPC ]: () => {
        this.syncNodes()
      },
      [ UPDATE_NODE_RPC ]: () => {
        this.syncNodes()
      },
      [ CREATE_SOUND_RPC ]: () => {
        this.syncSounds()
      },
      [ DELETE_SOUND_RPC ]: () => {
        this.syncSounds()
      },
      [ UPDATE_SOUND_RPC ]: () => {
        this.syncSounds()
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

    const sounds = await this.getSounds()
    if (sounds) {
      this.data.sounds = new Map(sounds.sounds.map(s => [ s.id, s ]))
      for (const sound of sounds.sounds) {
        this.downloadWave(sound.id)
      }
    }

    this.fire('set-data', structuredClone(this.data))

    return
  }

  setNodes(nodes: Node[]) {
    const selected: string[] = []

    const { added, removed, updated } = diffIndexed(Array.from(this.data.nodes.values()), nodes, 'id')

    for (const rem of removed) {
      this.data.selectedNodes.delete(rem.id)
      this.data.nodes.delete(rem.id)
    }

    for (const add of added) {
      this.data.nodes.set(add.id, add)
    }

    for (const update of updated) {
      const source = this.data.nodes.get(update.id)!
      Object.assign(source, update)
    }

    if (!this.data.nodes.has(this.data.activeNode)) {
      this.data.activeNode = nodes[0].id || this.data.root || ''
    }

    this.data.selectedNodes = new Set(selected)
    this.fire('set-data', { nodes: structuredClone(this.data.nodes) })
  }

  setSounds(sounds: Sound[]) {
    const { added, removed, updated } = diffIndexed(Array.from(this.data.sounds.values()), sounds, 'id')

    for (const rem of removed) {
      this.data.sounds.delete(rem.id)
      this.data.waves.delete(rem.id)
    }

    for (const add of added) {
      this.data.sounds.set(add.id, add)
      const wave = this.data.waves.get(add.id)
      if (wave) { continue }

      this.downloadWave(add.id)
    }

    for (const update of updated) {
      const source = this.data.sounds.get(update.id)!
      Object.assign(source, update)
    }
    
    this.fire('set-data', { sounds: structuredClone(this.data.sounds) })
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

    this.setNodes(result.nodes)
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
      const result = await this.rpc.send<CreateNodeRequest, CreateNodeResponse>('create-node', request, true)
      await this.syncNodes()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async deleteNode(request: DeleteNodeRequest['request']): Promise<DeleteNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<DeleteNodeRequest, DeleteNodeResponse>('delete-node', request, true)
      await this.syncNodes()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async updateNode(request: UpdateNodeRequest['request']): Promise<UpdateNodeResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<UpdateNodeRequest, UpdateNodeResponse>('update-node', request, true)
      await this.syncNodes()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async getSounds(): Promise<GetSoundsResponse['response'] | undefined> {
    return await this.rpc.send<GetSoundsRequest, GetSoundsResponse>(GET_SOUNDS_RPC)
  }

  async syncSounds() {
    await this.syncNodes()
    const result = await this.getSounds()
    if (!result) { return }

    this.setSounds(result.sounds)
  }

  getSoundsForNode(nodeId: Id) {
    const sounds: Sound[] = []

    const node = this.data.nodes.get(nodeId)
    if (!node) { return sounds }

    const { sounds: soundIds } = node

    for (const soundId of soundIds) {
      const sound = this.data.sounds.get(soundId)
      if (!sound) { continue }
      sounds.push(sound)
    }

    return sounds
  }

  getUnlinkedSounds() {
    const soundMap = structuredClone(this.data.sounds)

    for (const node of this.data.nodes.values()) {
      if (!node.sounds.length) { continue }
      for (const soundId of node.sounds) {
        soundMap.delete(soundId)
      }
    }

    return Array.from(soundMap.values())
  }

  async uploadWave(soundFile: File, soundId: Id, name = soundFile.name) {

    const url = new URL(UPLOAD_WAVE, window.location.origin)
    url.searchParams.set('name', name)
    url.searchParams.set('soundId', soundId)

    const response = await fetch(url, {
      method: 'POST',
      body: soundFile
    })

    try {
      const result = await response.json() as UploadSoundResponse | ErrorResponse
      if (isErrorResponse(result)) {
        this.fire('error', [ `Upload sound "${soundFile.name}" failed`, ...result.errors ])
        return
      }
      this.syncSounds()
      return result.data
    } catch (err) {
      this.fire('error', [ 'Could not parse upload sound response' ])
    }

  }

  async downloadWave(soundId: Id) {
    const sound = this.data.sounds.get(soundId)
    if (!sound) { return }

    const wave = this.data.waves.get(soundId)
    if (wave) { return }

    const response = await fetch(DOWNLOAD_WAVE.replace(':soundId', sound.id), {})

    try {
      const blob = await response.blob()
      const waveFile = new File([ blob ], sound.name)
      this.data.waves.set(sound.id, waveFile)
    } catch (err) {
      this.fire('error', [ (err as Error).message ])
    }
  }

  async createSound(request: CreateSoundRequest['request']): Promise<CreateSoundResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<CreateSoundRequest, CreateSoundResponse>('create-sound', request, true)
      await this.syncSounds()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async deleteSound(request: DeleteSoundRequest['request']): Promise<DeleteSoundResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<DeleteSoundRequest, DeleteSoundResponse>('delete-sound', request, true)
      await this.syncSounds()
      return result
    } catch (err) {
      this.fire('error', err as string[])
    }
  }

  async updateSound(request: UpdateSoundRequest['request']): Promise<UpdateSoundResponse['response'] | undefined> {
    try {
      const result = await this.rpc.send<UpdateSoundRequest, UpdateSoundResponse>('update-sound', request, true)
      await this.syncSounds()
      return result
    } catch (err) {
      this.fire('error', err as string[])
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
