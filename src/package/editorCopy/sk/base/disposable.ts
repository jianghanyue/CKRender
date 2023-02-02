
export class Disposable {
  protected _disposables: ((() => void) | Disposable)[] = []
  protected _disposed = false

  dispose() {
    this._disposables.forEach((fn) => {
      if (typeof fn === 'function') {
        fn()
      } else {
        fn.dispose()
      }
    })
    this._disposables.length = 0
    this._disposed = true
  }
}
