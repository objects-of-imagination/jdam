export default class Deferred<T, E = unknown> {

  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (err: E) => void
  promise!: Promise<T>

  constructor() {
    this.init()
  }

  init() {
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve(value: T) {
    this._resolve(value)
  }

  reject(err: E) {
    this._reject(err)
  }

}
