import { Id, Node, Person, Sound, Timestamp } from './data.js'
import { RPCRequest, RPCResponse } from './rpc.js'

export const API_PREFIX = '/api/v1'
export type Response<T = undefined> = {
  ts: Timestamp
  result: Result
} & ( T extends undefined ? { data?: never } : { data: T } )

export type ErrorResponse = {
  ts: Timestamp
  result: 'failure'
  errors: string[]
}

export function errorResponse(errors: string[] = []): ErrorResponse {
  return {
    ts: Date.now(),
    result: 'failure',
    errors
  }
}

export function isErrorResponse(response: { result: Result }): response is ErrorResponse {
  return response.result === 'failure'
}

export const WS_PATH = `${API_PREFIX}/ws`

export const HEARTBEAT_PATH = `${API_PREFIX}/heartbeat`
export type HeartbeatResponse = Response

export type Result = 'success' | 'failure'

export const AUTH_CHECK_PATH = '/a'
export const AUTH_COOKIE_NAME = 'jdam-auth'
export const AUTH_HEADER = 'X-Jdam-Auth'
export type AUTH_JWT = {
  id: string,
  iat: number
  age: number
}

export const PERSON_OPERATIONS_PATH = `${API_PREFIX}/person`
export const CREATE_PERSON_PATH = `${PERSON_OPERATIONS_PATH}/create` 
export type CreatePersonRequestParams = {
  username: string,
  email: string,
  password: string
}
export type CreatePersonResponse = Response<Person> | ErrorResponse

export const LOGIN_PERSON_PATH = `${PERSON_OPERATIONS_PATH}/login` 
export type LoginPersonRequestParams = {
  email: string,
  password: string
}
export type LoginPersonResponse = Response<Person> | ErrorResponse

export const LOGOUT_PERSON_PATH = `${PERSON_OPERATIONS_PATH}/logout` 
export type LogoutPersonRequestParams = { id: string }
export type LogoutPersonResponse = Response | ErrorResponse

export const SESSION_CONNECT_RPC = 'session-connect'
export type SessionConnectRequest = RPCRequest<typeof SESSION_CONNECT_RPC, { person: Id }>
export type SessionConnectResponse = RPCResponse<{ people: Id[] }>

export const CREATE_NODE_RPC = 'create-node'
export type CreateNodeRequest = RPCRequest<typeof CREATE_NODE_RPC, { createdBy: Id, parent?: Id, node?: Partial<Node> }>
export type CreateNodeResponse = RPCResponse<Node>

export const DELETE_NODE_RPC = 'delete-node'
export type DeleteNodeRequest = RPCRequest<typeof DELETE_NODE_RPC, { id: Id }>
export type DeleteNodeResponse = RPCResponse<Node>

export const UPDATE_NODE_RPC = 'update-node'
export type UpdateNodeRequest = RPCRequest<typeof UPDATE_NODE_RPC, { id: Id } & Partial<Node>>
export type UpdateNodeResponse = RPCResponse<Node>

export const GET_NODES_RPC = 'get-nodes'
export type GetNodesRequest = RPCRequest<typeof GET_NODES_RPC>
export type GetNodesResponse = RPCResponse<{ nodes: Node[], root: Node }>

export const CREATE_SOUND_RPC = 'create-sound'
export type CreateSoundRequest = RPCRequest<typeof CREATE_SOUND_RPC, { createdBy: Id, nodeId?: Id, sound?: Partial<Sound> }>
export type CreateSoundResponse = RPCResponse<Sound>

export const DELETE_SOUND_RPC = 'delete-sound'
export type DeleteSoundRequest = RPCRequest<typeof DELETE_SOUND_RPC, { id: Id }>
export type DeleteSoundResponse = RPCResponse<Sound>

export const UPDATE_SOUND_RPC = 'update-sound'
export type UpdateSoundRequest = RPCRequest<typeof UPDATE_SOUND_RPC, { id: Id } & Partial<Sound>>
export type UpdateSoundResponse = RPCResponse<Sound>

export const GET_SOUNDS_RPC = 'get-sounds'
export type GetSoundsRequest = RPCRequest<typeof GET_SOUNDS_RPC>
export type GetSoundsResponse = RPCResponse<{ sounds: Sound[] }>

export const LINK_SOUND_RPC = 'link-sound'
export type LinkSoundToNodeRequest = RPCRequest<typeof LINK_SOUND_RPC, { soundId: Id, nodeId: Id }>
export type LinkSoundToNodeResponse = RPCResponse 

export const UNLINK_SOUND_RPC = 'unlink-sound'
export type UnlinkSoundFromNodeRequest = RPCRequest<typeof UNLINK_SOUND_RPC, { soundId: Id, nodeId?: Id }>
export type UnlinkSoundFromNodeResponse = RPCResponse 

export const UPLOAD_WAVE = `${API_PREFIX}/wave`
export type UploadSoundURLParams = { name: string }
export type UploadSoundResponse = Response<Sound>

export const DOWNLOAD_WAVE = `${API_PREFIX}/wave/:soundId`
export const DOWNLOAD_PCM = `${API_PREFIX}/pcm/:soundId`

export const HOST_INIT_RPC = 'host-init'
export type HostInitRequest = RPCRequest<typeof HOST_INIT_RPC> 
export type HostInitResponse = RPCResponse<{ person: Id, name: string, people: Id[] }>
