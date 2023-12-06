import express from 'express' 

import homepage from './homepage'
import heartbeat from './heartbeat'
import nodeOperations from './node_operations'

import childProcess from 'child_process'
import path from 'path'

import { WebSocketServer } from 'ws'
import { WS_PATH } from '../../../shared/api'
import { RPC, RPCMessageTarget } from '../../../shared/rpc'

const app = express()

app.use(heartbeat)

if (process.env.NODE_ENV === 'dev') {
  const vite = childProcess.spawn('npm', [ 'run', 'dev' ], { 
    cwd: path.resolve(process.cwd(), '../web'),
    stdio: 'inherit'
  })

  process.on('exit', () => { vite.kill('SIGKILL') })
} else {
  app.use(homepage)
}

const PORT = 3002

const server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

const wss = new WebSocketServer({ noServer: true })

const RPC_ENDPOINTS = new Set<RPC>()

wss.on('connection', ws => {

  const target: RPCMessageTarget = {
    send: (data: unknown) => { 
      ws.send(JSON.stringify(data))
    },
    onReceive: handler => {
      const onMessage = async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString('utf8'))
          handler(message)
        } catch (err) {
        /* parsing error */
        }
      }

      ws.on('message', onMessage)
      return () => {
        ws.off('message', onMessage)
      }
    }
  }

  const rpc = new RPC(target, nodeOperations)
  rpc.on('send', req => {
    for (const endpoint of RPC_ENDPOINTS.values()) {
      if (endpoint === rpc) { continue }
      endpoint.send(req.method, req.request)
    }
  })

  RPC_ENDPOINTS.add(rpc)
  console.log('connected client')

  ws.on('close', () => {
    RPC_ENDPOINTS.delete(rpc)
    console.log('removed client')
  })

})


server.on('upgrade', (request, socket, head) => {
  try {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`)
    
    if (!pathname.endsWith(WS_PATH)) { socket.destroy() }

    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request)
    })
  } catch (err) {
    /* do nothing with invalid url */
  }
})
