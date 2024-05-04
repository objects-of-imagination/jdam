import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import express, { Request, Response, NextFunction, RequestParamHandler } from 'express'
import cookieParser from 'cookie-parser'
import { AUTH_COOKIE_NAME, AUTH_CHECK_PATH, AUTH_HEADER, AUTH_JWT } from '../../../shared/api.js'
import { validateJdamToken } from '../../../shared/validate_token.js'
import jwt from 'jsonwebtoken'

export const PRIVATE_KEY_PATH = path.resolve(process.cwd(), 'private.key')
export const PUBLIC_KEY_PATH = path.resolve(process.cwd(), 'public.pem')
export let PRIVATE_KEY = '' 
export let PUBLIC_KEY = '' 

if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
  const result = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const privateKey = result.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString('utf8')
  const publicKey = result.publicKey.export({ type: 'pkcs1', format: 'pem' }).toString('utf8')
  
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey)
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey)

  PRIVATE_KEY = privateKey
  PUBLIC_KEY = publicKey
} else {
  PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8')
  PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8')
}

const router = express.Router()
const cookies = cookieParser()

router.use(cookies)

router.get(AUTH_CHECK_PATH, withAuth((token, _req, res) => {
  res.status(200)
  res.contentType('application/json')
  res.send(token)
  res.end()
}))

export default router

export function withAuth(handler: (token: AUTH_JWT, req: Request, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    cookies(req, res, next)

    let token = req.cookies[AUTH_COOKIE_NAME]
    if (!token) {
      token = req.headers[AUTH_HEADER]
    }
    if (!token) {
      res.status(401)
      res.statusMessage = 'No token'
      res.end()
      return
    }

    const decoded = jwt.verify(token, PUBLIC_KEY) as Partial<AUTH_JWT>
    try {
      validateJdamToken(decoded)
    } catch (err) {
      res.status(401)
      res.statusMessage = (err as Error).message
      res.end()
      return
    }
    
    if (!decoded.age) {
      decoded.age = 86400
    }

    handler(decoded as AUTH_JWT, req, res, next)
  }
}

