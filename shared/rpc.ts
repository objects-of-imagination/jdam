import Deferred from './deferred'

export type RPCRequest<M extends string = string, R = unknown> = {
  id: number
  method: M
  multi?: boolean
} & (R extends undefined ? { request?: never } : { request: R })

export type RPCResponse<R = unknown> = {
  id: number
  tag?: string
  response?: R
  errors?: string[]
}

export type TaggedRPCResponse<R = unknown> = RPCResponse<R> & { tag: string }


export function rpcRequest<RPC extends RPCRequest>(method: RPC['method'], request?: RPC['request'], multi = false): RPCRequest {
  return {
    id: Math.floor(Math.random() * 1987654421),
    multi,
    method,
    request
  }
}

export function rpcResponse<RPC extends RPCResponse>(id: number, response?: RPC['response'], errors?: string[], tag?: string): RPCResponse {
  return {
    id,
    tag,
    response,
    errors
  }
}

export function isRpcRequest(rpc: Partial<RPCRequest & RPCResponse>): rpc is RPCRequest {
  return !Number.isNaN(rpc.id) && !!rpc.method
}

export function isRpcResponse(rpc: Partial<RPCResponse & RPCRequest>): rpc is RPCResponse {
  return !Number.isNaN(rpc.id) && !rpc.method
}

export function isTagged(rpc: Partial<RPCResponse & RPCRequest>): rpc is TaggedRPCResponse {
  return !Number.isNaN(rpc.id) && !!rpc.tag
}

export type RPCRequestTransport = (method: string, params?: Record<string, unknown>) => Promise<unknown>

export type RPCMessageTarget = {
  send: (data: RPCRequest | RPCResponse) => void | Promise<void>
  onReceive: (handler: (data: Partial<RPCResponse | RPCRequest>) => void | Promise<void>) => () => void
}

export type RPCHostMethod = (data: unknown) => unknown | Promise<unknown>

export class RPC<T extends Record<string, RPCHostMethod> = Record<string, RPCHostMethod>> {

  target: RPCMessageTarget
  messages = new Map<number, Deferred<unknown | undefined>>()
  methods = new Map<string, RPCHostMethod>()
  tags = new Map<string, RPCHostMethod>() 
  disconnect: () => void

  constructor(target: RPCMessageTarget, methods?: T, tags?: T) {
    this.target = target

    if (methods) {
      for (const key in methods) {
        this.methods.set(key, methods[key])
      }
    }

    if (tags) {
      for (const key in tags) {
        this.tags.set(key, tags[key])
      }
    }

    const handleResponse = (res: RPCResponse) => {
      const req = this.messages.get(res.id)
      if (!req) { return false }

      this.messages.delete(res.id)
      if (res.errors?.length) {
        req.reject(res.errors)
        return true
      }

      req.resolve(res.response)
      return true
    }

    const handleTagged = async (res: TaggedRPCResponse) => {
      const handler = this.tags.get(res.tag)
      if (!handler) { return }

      await handler(res.response)
    }

    const handleRequest = async (req: RPCRequest) => {
      const handler = this.methods.get(req.method)

      const tag = req.multi ? req.method : undefined

      if (!handler) {
        this.target.send(rpcResponse(req.id, undefined, [ `method ${req.method} not found` ], tag))
        return
      }

      try {
        const result = await handler(req.request)
        this.target.send(rpcResponse(req.id, result, undefined, tag))
      } catch (err) {
        this.target.send(rpcResponse(req.id, undefined, [ String(err) ], tag))
      }
    }

    this.disconnect = target.onReceive(data => {
      if (isRpcRequest(data)) { handleRequest(data); return }
      if (isRpcResponse(data)) { 
        if (handleResponse(data)) { return }
      }
      if (isTagged(data)) { handleTagged(data) } 
    })
  }
    
  async send<REQ extends RPCRequest, RES extends RPCResponse = RPCResponse>(method: REQ['method'], data?: REQ['request'], multi = false) {
    const request = rpcRequest(method, data, multi)
    const deferred = new Deferred<unknown | undefined>()
    this.messages.set(request.id, deferred)
    this.target.send(request)
    return deferred.promise as Promise<RES['response']>
  }

  handle<Key extends string & keyof T>(method: Key, handler: T[Key]): () => void {
    this.methods.set(method, handler)
    return () => {
      this.methods.delete(method)
    }
  }

  tag<Key extends string & keyof T>(method: Key, handler: T[Key]): () => void {
    this.tags.set(method, handler)
    return () => {
      this.tags.delete(method)
    }
  }

}
