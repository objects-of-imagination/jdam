import { Surreal } from 'surrealdb.node'
import Deferred from '../../../shared/deferred.js'
import path from 'path'
import { newPerson } from '../../../shared/data.js'
import crypto from 'crypto'

export const DB_USER = 'admin'
export const DB_PASS = btoa('auth-jdam-db')
export const DB_NAMESPACE = 'jdam'
export const DB_DATABASE = 'jdam'
export const DB_FILE = path.resolve(process.cwd(), '../../database')

export const CONNECTED = new Deferred<Surreal>()

export async function connect() {
  const db = new Surreal()

  try {
    await db.connect('ws://127.0.0.1:8000')
    await db.signin({
      username: DB_USER,
      password: DB_PASS
    })

    await db.use({ ns: DB_DATABASE, db: DB_DATABASE })
    console.log('connected to db')

    if (process.env.NODE_ENV === 'dev') {
      const salt = 'aaaaAAAA' 
      const saltedPassword = salt + '1234' 
      const hash = crypto.createHash('SHA256').update(saltedPassword).digest().toString('base64')

      await db.create('person', newPerson({
        id: 'test-user',
        username: 'g',
        email: 'g@g',
        password: hash,
        salt: salt
      }))
    }

    CONNECTED.resolve(db)
  } catch (err) {
    CONNECTED.reject(err)
  }
}
