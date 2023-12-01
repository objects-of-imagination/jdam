import Crypto from 'crypto'
import fs from 'fs'
import { Session, newSession, Node, Id, Sound, newNode, newSound } from '../../../shared/data'

export const SESSION: Session = newSession({ id: Crypto.randomUUID() })

const rootNode = newNode({ id: Crypto.randomUUID() })

const nodeMap = new Map<Id, Node>([ [ rootNode.id, rootNode ] ])
const soundMap = new Map<Id, Sound>()

export function getRootNode() {
  return rootNode 
}

export function appendNode(parentId: Id, node: Node) {
  const parentNode = nodeMap.get(parentId) 
  if (!parentNode) { return node }

  const index = parentNode.children.indexOf(node.id)
  if (index !== -1) {
    parentNode.children.splice(index, 1)
  }
  parentNode.children.push(node.id)

  nodeMap.set(node.id, node)

  return node
}

export function updateNode(input: Partial<Node> & { id: Id }) {
  // only updates non-inherent and non-structural properties
  const existingNode = nodeMap.get(input.id)

  if (!existingNode) { return }

  const updates: Partial<Node> = {
    maxLength: input.maxLength
  }

  Object.assign(existingNode, updates)

  return existingNode
}

export function deleteNode(id: Id) {
  const existingNode = nodeMap.get(id)
  if (!existingNode) { return }

  nodeMap.delete(id)

  // remove this node from children of parent
  if (existingNode.parent) {
    const parentNode = nodeMap.get(existingNode.parent)
    if (parentNode) {
      const index = parentNode.children.indexOf(existingNode.id)
      if (index !== -1) { parentNode.children.splice(index, 1) }
    }
  }

  // update parents of children
  if (existingNode.children) {
    for (const childId of existingNode.children) {
      const child = nodeMap.get(childId)
      if (!child) { continue }

      child.parent = existingNode.parent // this could unset the parent
    }
  }

  return existingNode
}

export function getNode(id: Id) {
  return nodeMap.get(id)
}

export function getNodes() {
  return Array.from(nodeMap.values())
}

export function upsertSound(input: Partial<Sound>, nodeId?: Id) {
  const sound = newSound(input) 

  const existingSound = soundMap.get(sound.id)
  if (!existingSound) {
    soundMap.set(sound.id, sound)
  } else {
    Object.assign(existingSound, sound)
  }

  if (!nodeId) { return sound }

  linkSoundToNode(sound.id, nodeId)
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

export function deleteSound(soundId: Id) {

  const sound = soundMap.get(soundId)
  if (!sound) { return }

  soundMap.delete(soundId)

  unlinkSound(soundId)

  if (fs.existsSync(sound.path)) { fs.rmSync(sound.path) }

  return sound
}

export function getSound(id: Id) {
  return soundMap.get(id)
}

export function getSounds() {
  return Array.from(soundMap.values())
}
