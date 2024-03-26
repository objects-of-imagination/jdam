import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { RequestParamHandler } from 'express'
import cookieParser from 'cookie-parser'

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

export const AUTH_COOKIE_NAME = 'jdam-auth'

const cookies = cookieParser()

export function withAuth(...[ req, res, next ]: Parameters<RequestParamHandler>) {
  cookies(req, res, next)

  console.log(req.url)
  if (!req.url || req.url === '/') { 
    next()
    return
  }

  const token = req.cookies[AUTH_COOKIE_NAME]
  console.log(token)
  if (!token) {
    res.redirect(301, '/')
    return
  }

  next()
}
