import express from 'express' 
import crypto from 'crypto'
import { 
  AUTH_COOKIE_NAME,
  CREATE_PERSON_PATH,
  CreatePersonRequestParams,
  CreatePersonResponse,
  ErrorResponse,
  LOGIN_PERSON_PATH,
  LoginPersonRequestParams,
  LoginPersonResponse,
  errorResponse 
} from '../../../shared/api.js'
import { CONNECTED } from './database.js'
import { Person, newPerson } from '../../../shared/data.js'

import jwt from 'jsonwebtoken'
import { PRIVATE_KEY } from './keys.js'

const router = express.Router()
router.use(express.json())

router.post(CREATE_PERSON_PATH, async (req, res: express.Response<CreatePersonResponse | ErrorResponse>) => {

  const params = req.body as Partial<CreatePersonRequestParams>
  
  const errors: string[] = []
  if (!params.email) {
    errors.push('An email is required') 
  }
  if (!params.username) {
    errors.push('A username is required') 
  }
  if (!params.password) {
    errors.push('A password is required') 
  }
  
  const salt = crypto.randomBytes(16).toString('base64')
  const saltedPassword = salt + params.password
  const hash = crypto.createHash('SHA256').update(saltedPassword).digest().toString('base64')

  if (errors.length) {
    res.json(errorResponse(errors))
    return
  }
  
  const id = crypto.randomUUID()
  const person = newPerson({ ...params, id, salt, password: hash })

  const db = await CONNECTED
  try {
    const [ existingRecord ] = await db.query(
      'SELECT * FROM person WHERE email=$email',
      { email: params.email }
    )
    if (existingRecord) {
      throw new Error(`Person with email "${params.email}" is already jdamming`)
    }
    const [ record ] = await db.create('person', person) as Person[]

    res.json({
      result: 'success',
      data: record,
      ts: Date.now()
    })
  } catch (err) {
    res.json(errorResponse([ (err as Error).message ]))
  }

})

router.post(LOGIN_PERSON_PATH, async (req, res: express.Response<LoginPersonResponse | ErrorResponse>) => {

  const params = req.body as Partial<LoginPersonRequestParams>
  
  const errors: string[] = []
  if (!params.email) {
    errors.push('An email is required') 
  }
  if (!params.password) {
    errors.push('A password is required') 
  }

  const db = await CONNECTED
  try {
    const [ existingRecord ] = await db.query(
      'SELECT * FROM person WHERE email=$email',
      { email: params.email }
    ) as [ Person ]
    if (!existingRecord) {
      throw new Error(`Person not found with email "${params.email}"`)
    }

    const existingPassword = existingRecord.password
    const salt = existingRecord.salt

    const saltedPassword = salt + params.password
    const hash = crypto.createHash('SHA256').update(saltedPassword).digest().toString('base64')
    
    if (hash !== existingPassword) {
      throw new Error('Incorrect user credentials')
    }
   
    existingRecord.password = ''
    existingRecord.salt = ''

    const token = jwt.sign({ id: existingRecord.id }, PRIVATE_KEY, { algorithm: 'RS256' })

    res.appendHeader('Auth-Token', token)
    res.cookie(AUTH_COOKIE_NAME, token, { maxAge: 24 * 60 * 60 * 1000 })

    res.json({
      result: 'success',
      data: existingRecord,
      ts: Date.now()
    })
  } catch (err) {
    res.json(errorResponse([ (err as Error).message ]))
  }
  
})

export default router
