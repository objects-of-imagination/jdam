import { Surreal } from 'surrealdb.node'
import Deferred from '../../../shared/deferred'
import express from 'express' 
import path from 'path'

export const DB_USER = 'admin'
export const DB_PASS = btoa('auth-jdam-db')
export const DB_NAMESPACE = 'jdam'
export const DB_DATABASE = 'jdam'
export const DB_FILE = path.resolve(process.cwd(), '../../database')

const router = express.Router()

export default router

export const CONNECTED = new Deferred<boolean>()

export async function connect() {
  const db = new Surreal()

  try {
    await db.connect('ws://127.0.0.1:8000')
    await db.signin({
      username: DB_USER,
      password: DB_PASS
    })
    console.log('connected to db')

    CONNECTED.resolve(true)
  } catch (err) {
    CONNECTED.reject(err)
  }
}
