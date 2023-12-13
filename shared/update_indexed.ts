export default function updateIndexed<T extends object, K extends string & keyof T>(sources: T[], updates: T[], index: K) {
  const updateMap = new Map<T[K], T>(updates.map(ob => [ ob[index], ob ]))
  for (const source of sources) {
    const update = updateMap.get(source[index])
    if (!update) { continue }
    Object.assign(source, update)
  }
  return sources
}

export function replaceIndexed<T extends object, K extends keyof T & string>(sources: T[], updates: T[], index: K) {
  // perform backwards, but copy the matchings objects into updates directly to preserve source references

  const sourceMap = new Map<T[K], T>(sources.map(ob => [ ob[index], ob ]))
  for (const [ ind, update ] of updates.entries()) {
    const source = sourceMap.get(update[index])
    if (!source) { continue }
    updates[ind] = Object.assign(source, update)
  }
  return sources.splice(0, sources.length, ...updates)
}
