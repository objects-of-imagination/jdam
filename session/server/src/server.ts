import express from 'express' 

import homepage from './homepage'
import heartbeat from './heartbeat'
import nodeOperations from './node_operations'

import childProcess from 'child_process'
import path from 'path'
import { signin } from './database'

const app = express()

if (process.env.NODE_ENV === 'dev') {
  const vite = childProcess.spawn('npm', ['run', 'dev'], { 
    cwd: path.resolve(process.cwd(), '../web') ,
    stdio: 'inherit'
  })

  process.on('exit', () => { vite.kill(9) })
} else {
  app.use(homepage)
}

const PORT = 3002

app.use(heartbeat)
app.use(nodeOperations)

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

// immediately try to sign in and get the session
async function db() {
  await signin()
  // TODO: get the session and update SESSION global
}

db()
