import {
  CREATE_NODE_RPC,
  CreateNodeRequest,
  CreateNodeResponse,
  DELETE_NODE_RPC,
  DeleteNodeRequest,
  DeleteNodeResponse,
  GET_NODES_RPC,
  GetNodesResponse,
  UPDATE_NODE_RPC,
  UpdateNodeRequest,
  UpdateNodeResponse
} from '../../../shared/api.js'

import { RPCHostMethod } from '../../../shared/rpc.js'
import { createNode, deleteNode, getNode, getNodes, getRootNode, updateNode } from './data_state.js'

const operations: Record<string, RPCHostMethod> = {
  [ CREATE_NODE_RPC ]: async (req): Promise<CreateNodeResponse['response']> => {
    const request = req as CreateNodeRequest['request']

    if (!request.createdBy) {
      throw 'empty user sent to createdBy'
    }

    const node = createNode({
      ...request.node,
      createdBy: request.createdBy,
      parent: request.parent
    })

    if (!node) {
      throw `max nodes reached for parent ${request.parent}`
    }

    return node
  },
  [ DELETE_NODE_RPC ]: async (req): Promise<DeleteNodeResponse['response']> => {
    const request = req as DeleteNodeRequest['request']
    if (!request.id) {
      throw 'empty id sent to delete node'
    }

    const existingNode = getNode(request.id)
    if (!existingNode) {
      throw 'no node found for this id' 
    }

    deleteNode(request.id)
    return existingNode
  },
  [ UPDATE_NODE_RPC ]: async (req): Promise<UpdateNodeResponse['response']> => {
    const request = req as UpdateNodeRequest['request']
    if (!request.id) {
      throw 'empty id sent to update node'
    }

    const existingNode = getNode(request.id)
    if (!existingNode) {
      throw 'no node found for this id'
    }

    const updatedNode = updateNode(request)
    if (!updatedNode) {
      throw 'unable to update the node'
    }

    return updatedNode
  },
  [ GET_NODES_RPC ]: async (): Promise<GetNodesResponse['response']> => {
    return {
      nodes: getNodes(),
      root: getRootNode()
    }
  }
}

export default operations
