export default function diffIndexed<T extends object, K extends string & keyof T>(sources: T[], updates: T[], index: K) {
  const result: {
    added: T[]
    removed: T[]
    updated: T[]
  } = {
    added: [],
    removed: [],
    updated: []
  }

  const updateMap = new Map<T[K], T>(updates.map(ob => [ ob[index], ob ]))
  const sourceMap = new Map<T[K], T>()

  for (const source of sources) {
    const update = updateMap.get(source[index])
    if (!update) {
      result.removed.push(source)
      continue
    }

    updateMap.delete(update[index])
    sourceMap.set(source[index], source)
    result.updated.push(update)
  }

  for (const update of updateMap.values()) {
    const source = sourceMap.get(update[index])
    if (!source) {
      result.added.push(update)
      continue
    }
  }

  return result
}
