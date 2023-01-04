export function promiseWrap (fun: CallableFunction) {
  return new Promise<void>((resolve, reject) => {
    try {
      fun()
      resolve()
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}

export function normalizeWheelEventDirection(evt: any) {
  let delta = Math.hypot(evt.deltaX, evt.deltaY)
  const angle = Math.atan2(evt.deltaY, evt.deltaX)

  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
    delta = -delta
  }

  return delta
}

export const DEFAULT_SCALE_DELTA = 1.1

export const MAX_SCALE = 10.0

export const MIN_SCALE = 0.1
