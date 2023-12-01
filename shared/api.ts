import { Id, Node, Sound, Timestamp } from "./data"

export const API_PREFIX = '/api/v1'
export type Response<T = never> = {
  ts: Timestamp,
  result: Result,
} & ( T extends never ? {} : { data: T } )

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

export const HEARTBEAT_PATH = `${API_PREFIX}/heartbeat`
export type HeartbeatResponse = Response

export type Result = 'success' | 'failure'

export const PERSON_OPERATIONS_PATH = `${API_PREFIX}/person`

export const NODE_OPERATIONS_PATH = `${API_PREFIX}/node`
export type CreateNodeRequest = { createdBy: Id, parent?: Id }
export type CreateNodeResponse = Response<Node>

export type DeleteNodeRequest = { id: Id }
export type DeleteNodeResponse = Response<Node>

export type UpdateNodeRequest = { id: Id } & Partial<Pick<Node, 'maxLength'>>
export type UpdateNodeResponse = Response<Node>

export type GetNodesResponse = Response<{ nodes: Node[], root: Node }>

export const SOUND_OPERATIONS_PATH = `${API_PREFIX}/sound`
export type UpsertSoundRequest = { createdBy: Id, nodeId?: Id } & Partial<Sound>
export type UpsertSoundResponse = Response<Sound>

export const SOUND_LINK_PATH = `${SOUND_OPERATIONS_PATH}/link`
export type LinkSoundToNodeRequest = { soundId: Id, nodeId: Id }
export type LinkSoundToNodeResponse = Response 

export const SOUND_UNLINK_PATH = `${SOUND_OPERATIONS_PATH}/unlink`
export type UnlinkSoundFromNodeRequest = { soundId: Id, nodeId?: Id }
export type UnlinkSoundFromNodeResponse = Response 
