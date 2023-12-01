export default class Deferred<T> {

  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (err: unknown) => void
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

  reject(err: unknown) {
    this._reject(err)
  }

}
