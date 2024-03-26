export default class Deferred<T, E = unknown> implements PromiseLike<T> {

  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (err: E) => void
  promise!: Promise<T>

  constructor() {
    this.init()
  }

  then<TResult1 = T, TResult2 = E>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled).catch(onrejected)
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
