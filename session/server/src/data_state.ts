import Crypto from 'crypto'
import fs from 'fs'
import { Session, newSession, Node, Id, Sound, newNode, newSound, paredCopy } from '../../../shared/data.js'

export const SESSION: Session = newSession({ id: Crypto.randomUUID() })

const rootNode = newNode({ id: Crypto.randomUUID() })

const nodeMap = new Map<Id, Node>([ [ rootNode.id, rootNode ] ])
const soundMap = new Map<Id, Sound>()

export function getRootNode() {
  return rootNode 
}

export function createNode(input: Partial<Node>) {
  const node = newNode({
    ...input,
    id: Crypto.randomUUID()
  })
    
  nodeMap.set(node.id, node)

  let canAdd = false
  if (!node.parent) {
    canAdd ||= !!parentNode(node.id, rootNode.id)
  } else {
    canAdd ||= !!parentNode(node.id, node.parent)
  }

  if (!canAdd) { 
    nodeMap.delete(node.id)
    return 
  }

  return node
}

export function parentNode(nodeId: Id, parentId: Id) {
  const existingNode = nodeMap.get(nodeId)
  if (!existingNode) { return }

  const parentNode = nodeMap.get(parentId) 
  if (!parentNode) { return }
  if (parentNode.children.length === parentNode.maxLength) { return }

  if (existingNode.parent && existingNode.parent !== parentId) { 
    unParentNode(nodeId) 
  }

  const index = parentNode.children.indexOf(existingNode.id)
  if (index !== -1) {
    parentNode.children.splice(index, 1)
  }
  parentNode.children.push(existingNode.id)
  existingNode.parent = parentId

  return true
}

export function unParentNode(nodeId: Id) {
  const existingNode = nodeMap.get(nodeId)
  if (!existingNode?.parent) { return }

  // remove this node from children of parent
  const parentNode = nodeMap.get(existingNode.parent)
  if (!parentNode) { return }

  const index = parentNode.children.indexOf(existingNode.id)
  if (index === -1) { return }

  existingNode.parent = undefined
  parentNode.children.splice(index, 1) 

  return true
}

export function updateNode(input: Partial<Node> & { id: Id }) {
  const existingNode = nodeMap.get(input.id)

  if (!existingNode) { return }

  Object.assign(existingNode, paredCopy(input, [ 'maxLength' ]))

  return existingNode
}

export function deleteNode(id: Id) {
  const existingNode = nodeMap.get(id)
  if (!existingNode) { return }

  unParentNode(id)

  nodeMap.delete(id)

  // eliminate all children recursively
  const recurse = (node: Node) => {
    const { children } = node
    if (!children.length) { return }
    for (const childId of children) {
      const child = nodeMap.get(childId)
      if (!child) { continue }
      nodeMap.delete(childId)
      recurse(child)
    }
  }

  recurse(existingNode)

  return existingNode
}

export function getNode(id: Id) {
  return nodeMap.get(id)
}

export function getNodes() {
  return Array.from(nodeMap.values())
}

export function createSound(input: Partial<Sound>, nodeId?: Id) {
  const sound = newSound({
    ...input,
    id: Crypto.randomUUID()
  })
    
  soundMap.set(sound.id, sound)

  if (nodeId) {
    linkSoundToNode(sound.id, nodeId)
  }

  return sound
}

export function updateSound(input: Partial<Sound>, nodeId?: Id) {
  if (!input.id) { return }

  const existingSound = soundMap.get(input.id)
  if (!existingSound) { return }

  Object.assign(existingSound, paredCopy(input, [
    'name',
    'fadeInStart',
    'fadeInDuration',
    'fadeOutStart',
    'fadeOutDuration',
    'volume',
    'pan'
  ]))

  if (!nodeId) { return existingSound }

  linkSoundToNode(existingSound.id, nodeId)
  return existingSound
}

export function deleteSound(soundId: Id) {
  const sound = soundMap.get(soundId)
  if (!sound) { return }

  soundMap.delete(soundId)

  unlinkSound(soundId)

  if (sound.path) {
    if (fs.existsSync(sound.path)) { fs.rmSync(sound.path) }
  }

  return sound
}

export function linkSoundToNode(soundId: Id, nodeId: Id) {

  const targetNode = nodeMap.get(nodeId)
  if (!targetNode) { return }

  const { sounds } = targetNode

  if (sounds.length) {
    const index = sounds.indexOf(soundId) 
    if (index !== -1) {
      sounds.splice(index, 1)
    }
  }

  sounds.push(soundId)
  
}

export function unlinkSoundFromNode(soundId: Id, nodeId: Id) {
  
  const targetNode = nodeMap.get(nodeId)
  if (!targetNode) { return }

  const { sounds } = targetNode
  if (!sounds.length) { return }

  const index = sounds.indexOf(soundId) 
  if (index !== -1) {
    sounds.splice(index, 1)
  }
}

export function unlinkSound(soundId: Id) {
  for(const nodeId of nodeMap.keys()) {
    unlinkSoundFromNode(soundId, nodeId)
  }
}

export function getSound(id: Id) {
  return soundMap.get(id)
}

export function getSounds() {
  return Array.from(soundMap.values())
}
