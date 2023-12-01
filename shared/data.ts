export type Theme = 'default' | 'light' | 'dark'
export type Privacy = 'public' | 'friends' | 'private'
export type Id = string
export type Timestamp = number

export interface PersonSettings {
  theme?: Theme
  privacy?: Privacy
}

export interface Person {
  id: Id
  email: string
  username: string
  password: string
  created: Timestamp
  settings: PersonSettings

  names?: string[]
  lastLogin?: number 
}

export function newPerson(person: Partial<Person>): Person {
  return Object.assign({
    id: '',
    email: '',
    username: '',
    password: '',
    created: Date.now(),
    settings: {
      theme: 'default',
      privacy: 'public'
    }
  }, structuredClone(person))
}

export type Duration = number

export function minutes(mins: number): Duration {
  return mins * 60 * 1000
}

export function seconds(secs: number): Duration {
  return secs * 1000
}

export interface Session {
  id: Id
  created: Timestamp
  createdBy: Id

  maxUsers: number
  expiresOn: Timestamp

  people: Id[]
}

export function newSession(session: Partial<Session>): Session {
  return Object.assign({ 
    id: '',
    createdBy: '',
    created: Date.now(),
    maxUsers: 6,
    expiresOn: Date.now() + minutes(120),
    people: []
  }, structuredClone(session))
}

export interface Node {
  id: Id
  created: Timestamp
  createdBy: Id
  maxLength: number
  parent?: Id
  children: Id[]
  sounds: Id[]
}

export function newNode(node: Partial<Node>): Node {
  return Object.assign({ 
    id: '',
    created: Date.now(),
    createdBy: '',
    maxLength: 4,
    children: [],
    sounds: []
  }, structuredClone(node))
}

export type Bytes = number

export interface Sound {
  id: Id
  name: string
  path: string
  created: Timestamp
  createdBy: Id
  size: Bytes
  length: Duration 

  sampleRate?: number

  fadeInStart?: Duration
  fadeInDuration?: Duration

  fadeOutStart?: Duration
  fadeOutDuration?: Duration

  volume?: number
  pan?: number
}

export function newSound(sound: Partial<Sound>): Sound {
  return Object.assign({
    id: '',
    name: '',
    path: '',
    created: Date.now(),
    createdBy: '',
    size: 0,
    length: 0,
    sampleRate: 48_000,
    fadeInDuration: 500,
    fadeOutDuration: 500
  }, sound)
}
