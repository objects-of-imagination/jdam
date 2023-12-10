export default function updateIndexed<T extends object, K extends string & keyof T>(source: T[], updates: T[], index: K) {
  const updateMap = new Map<T[K], T>(updates.map(ob => [ ob[index], ob ]))
  for (const item of source) {
    const update = updateMap.get(item[index])
    if (!update) { continue }
    Object.assign(item, update)
  }
  return source
}

export function replaceIndexed<T extends object, K extends keyof T & string>(source: T[], updates: T[], index: K) {
  // perform backwards, but copy the matchings objects into updates directly to preserve source references

  const sourceMap = new Map<T[K], T>(source.map(ob => [ ob[index], ob ]))
  for (const [ ind, item ] of updates.entries()) {
    const source = sourceMap.get(item[index])
    if (!source) { continue }
    updates[ind] = Object.assign(source, item)
  }
  return source.splice(0, source.length, ...updates)
}
