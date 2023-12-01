import express from 'express'
import Crypto from 'crypto'
import { NODE_OPERATIONS_PATH,
  CreateNodeRequest,
  CreateNodeResponse,
  ErrorResponse,
  errorResponse,
  DeleteNodeResponse,
  DeleteNodeRequest,
  GetNodesResponse,
  UpdateNodeResponse,
  UpdateNodeRequest
} from '../../../shared/api'
import { newNode } from '../../../shared/data'

import { appendNode, deleteNode, getNode, getNodes, getRootNode, updateNode } from './data_state'

const router = express.Router()
router.use(express.json())

router.post(NODE_OPERATIONS_PATH, (req, res: express.Response<CreateNodeResponse | ErrorResponse>) => {
  const request: CreateNodeRequest = req.body
  if (!request.createdBy) {
    res.json(errorResponse([ 'empty user sent to createdBy' ]))
    return
  }

  const node = newNode({
    id: Crypto.randomUUID(),
    createdBy: request.createdBy,
    parent: request.parent
  })

  if (!request.parent) {
    appendNode(getRootNode().id, node)
  } else {
    appendNode(request.parent, node)
  }

  res.json({
    ts: Date.now(),
    result: 'success',
    data: node
  })
})

router.delete(NODE_OPERATIONS_PATH, (req, res: express.Response<DeleteNodeResponse | ErrorResponse>) => {
  const request: DeleteNodeRequest = req.body
  if (!request.id) {
    res.json(errorResponse([ 'empty id sent to delete node' ]))
    return
  }

  const existingNode = getNode(request.id)
  if (!existingNode) {
    res.json(errorResponse([ 'no node found for this id' ]))
    return
  }

  deleteNode(request.id)
  res.json({
    ts: Date.now(),
    result: 'success',
    data: existingNode
  })

})

router.patch(NODE_OPERATIONS_PATH, (req, res: express.Response<UpdateNodeResponse | ErrorResponse>) => {
  const request: UpdateNodeRequest = req.body
  if (!request.id) {
    res.json(errorResponse([ 'empty id sent to update node' ]))
    return
  }

  const existingNode = getNode(request.id)
  if (!existingNode) {
    res.json(errorResponse([ 'no node found for this id' ]))
    return
  }

  const updatedNode = updateNode(request)
  if (!updatedNode) {
    res.json(errorResponse([ 'unable to update the node' ]))
    return
  }

  res.json({
    ts: Date.now(),
    result: 'success',
    data: updatedNode
  })
})

router.get(NODE_OPERATIONS_PATH, (_req, res: express.Response<GetNodesResponse>) => {
  res.json({
    ts: Date.now(),
    result: 'success',
    data: {
      nodes: getNodes(),
      root: getRootNode()
    }
  })
})


export default router
