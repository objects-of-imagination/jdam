import express from 'express' 
import path from 'path'

const router = express.Router()
router.use(express.static(path.resolve(process.cwd(), '../../web/dist')))

export default router
