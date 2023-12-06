import Deferred from './deferred'
import Evt from './evt'

export type RPCRequest<M extends string = string, R = unknown> = {
  id: number
  method: M
} & (R extends undefined ? { request?: never } : { request: R })

export type RPCResponse<R = unknown> = {
  id: number
  response?: R
  errors?: string[]
}


export function rpcRequest<RPC extends RPCRequest>(method: RPC['method'], request?: RPC['request']): RPCRequest {
  return {
    id: Math.floor(Math.random() * 1987654421),
    method,
    request
  }
}

export function rpcResponse<RPC extends RPCResponse>(id: number, response?: RPC['response'], errors?: string[]): RPCResponse {
  return {
    id,
    response,
    errors
  }
}

export function isRequestValid(rpc: Partial<RPCRequest & RPCResponse>): rpc is RPCRequest {
  return !Number.isNaN(rpc.id) && !!rpc.method
}

export function isResponseValid(rpc: Partial<RPCResponse & RPCRequest>): rpc is RPCResponse {
  return !Number.isNaN(rpc.id) && !rpc.method
}

export type RPCRequestTransport = (method: string, params?: Record<string, unknown>) => Promise<unknown>

export type RPCMessageTarget = {
  send: (data: unknown) => void | Promise<void>
  onReceive: (handler: (data: Partial<RPCResponse | RPCRequest>) => void | Promise<void>) => () => void
}

export type RPCHostMethod = (data: unknown) => unknown | Promise<unknown>

interface RPCEvts {
  'send': (req: RPCRequest) => void
}

export class RPC<T extends Record<string, RPCHostMethod> = Record<string, RPCHostMethod>> extends Evt<RPCEvts> {

  target: RPCMessageTarget
  messages = new Map<number, Deferred<unknown | undefined>>()
  methods = new Map<string, RPCHostMethod>()
  disconnect: () => void

  constructor(target: RPCMessageTarget, methods?: T) {
    super()
    this.target = target

    if (methods) {
      for (const key in methods) {
        this.methods.set(key, methods[key])
      }
    }

    const handleResponse = (res: RPCResponse) => {
      const req = this.messages.get(res.id)
      if (!req) { return }

      this.messages.delete(res.id)
      if (res.errors?.length) {
        req.reject(res.errors)
        return
      }

      req.resolve(res.response)
    }

    const handleRequest = async (req: RPCRequest) => {
      const handler = this.methods.get(req.method)
      if (!handler) {
        target.send(rpcResponse(req.id, undefined, [ `method ${req.method} not found` ]))
        return
      }

      try {
        const result = await handler(req.request)
        target.send(rpcResponse(req.id, result))
      } catch (err) {
        target.send(rpcResponse(req.id, undefined, [ String(err) ]))
      }
    }

    this.disconnect = target.onReceive(data => {
      if (isRequestValid(data)) { handleRequest(data); return }
      if (isResponseValid(data)) { handleResponse(data) }
    })
  }
    
  async send<REQ extends RPCRequest, RES extends RPCResponse = RPCResponse>(method: REQ['method'], data?: REQ['request']) {
    const request = rpcRequest(method, data)
    const deferred = new Deferred<unknown | undefined>()
    this.messages.set(request.id, deferred)
    this.target.send(request)
    this.fire('send', request)
    return deferred.promise as Promise<RES['response']>
  }

  handle<Key extends string & keyof T>(method: Key, handler: T[Key]): () => void {
    this.methods.set(method, handler)
    return () => {
      this.methods.delete(method)
    }
  }

}
