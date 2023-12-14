import express from 'express';
import { HEARTBEAT_PATH } from '../../../shared/api.js';
const router = express.Router();
router.get(HEARTBEAT_PATH, (_req, res) => {
    res.json({
        ts: Date.now(),
        result: 'success'
    });
});
export default router;
