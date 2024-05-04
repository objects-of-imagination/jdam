import express from 'express' 

import homepage from './homepage.js'
import heartbeat from './heartbeat.js'

import checkAuth from './keys.js'

import childProcess from 'child_process'
import path from 'path'
import { DB_FILE, DB_PASS, DB_USER, connect } from './database.js'
import personOperations from './person_operations.js'

const app = express()

app.use(checkAuth)

if (process.env.NODE_ENV === 'dev') {
  const vite = childProcess.spawn('npm', [ 'run', 'dev' ], { 
    cwd: path.resolve(process.cwd(), '../web'),
    stdio: 'inherit'
  })
  process.on('exit', () => {
    vite.kill('SIGKILL')
  })
} else {
  app.use(homepage)
}

const surreal = childProcess.spawn('surreal', [
  'start',
  '--auth',
  '--user',
  DB_USER,
  '--pass',
  DB_PASS,
  '--bind',
  '0.0.0.0:8000',
  process.env.NODE_ENV === 'dev' ? 'memory' : `file:${DB_FILE}`
])

const onData = (data: Buffer) => {
  const string = Buffer.from(data).toString('utf8')
  console.log(string)
  if (string.includes('Started web server on')) {
    connect()
    surreal.stderr?.off('data', onData)
  }
}
surreal.stderr?.on('data', onData) 
process.on('exit', () => {
  surreal.kill('SIGKILL')
})

const PORT = 3000

app.use(heartbeat)
app.use(personOperations)

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
