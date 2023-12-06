import { JObject } from './data'

export default function updateIndexed<T extends JObject>(source: T[], updates: T[], index: string & keyof T) {
  const updateMap = new Map<T[string & keyof T], T>(updates.map(ob => [ ob[index], ob ]))
  for (const item of source) {
    const update = updateMap.get(item[index])
    if (!update) { continue }
    Object.assign(item, update)
  }
  return source
}
