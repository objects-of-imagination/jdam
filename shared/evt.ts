export type Evts<T> = {
  [ Key in keyof T ]: (...args: unknown[]) => void
}

export default class Evt<T extends Evts<T>> {
  handlers = new Map<string & keyof T, Array<T[keyof T]>>()

  on<Key extends string & keyof T>(evtName: Key, handler: T[Key]): () => void {
    let evtHandlers = this.handlers.get(evtName)
    if (!evtHandlers) {
      evtHandlers = []
      this.handlers.set(evtName, evtHandlers)
    }
    
    // if the same handler is added, move it to the back of the list
    const index = evtHandlers.findIndex(evtHandler => evtHandler === handler)
    if (index !== -1) { 
      this.handlers.get(evtName)?.splice(index, 1)
    }

    evtHandlers.push(handler)
    return () => { this.off(evtName, handler) }
  }

  off<Key extends string & keyof T>(evtName: Key, handler: T[Key]) {
    const evtHandlers = this.handlers.get(evtName)
    if (!evtHandlers) { return }

    const index = evtHandlers.findIndex(evtHandler => evtHandler === handler)
    if (index === -1) { return }

    // this is a reference to an array, so no need to use handlers.set
    evtHandlers.splice(index, 1)
  }

  purge<Key extends string & keyof T>(evtName: Key) {
    this.handlers.set(evtName, [])
  }

  fire<Key extends string & keyof T>(evtName: Key, ...args: Parameters<T[Key]>) {
    const evtHandlers = this.handlers.get(evtName)
    if (!evtHandlers) { return }

    for (const evtHandler of evtHandlers) {
      evtHandler(...args)
    }
  }
}
