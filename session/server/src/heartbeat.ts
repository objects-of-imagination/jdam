import express from 'express'
import { HEARTBEAT_PATH, HeartbeatResponse } from '../../../shared/api'

const router = express.Router()

router.get(HEARTBEAT_PATH, (_req, res: express.Response<HeartbeatResponse>) => {
  res.json({
    ts: Date.now(),
    result: 'success'
  })
})

export default router
