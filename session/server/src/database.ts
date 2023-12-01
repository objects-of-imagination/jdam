import Deferred from '../../../shared/deferred'

const DATABASE_URL = 'http://127.0.0.1:8000'

export const TOKEN = new Deferred<string>()

export async function signin(user = 'admin', pass = btoa(`auth-jdam-db`)) {
  const response = await fetch(`${DATABASE_URL}/signin`, {
    method: 'POST',
    headers: {
      Accept: 'application/json'
    },
    body: JSON.stringify({
      user,
      pass
    })
  })

  try {
    const { token, details } = await response.json() as { details?: string, token?: string }
    if (token) {
      TOKEN.resolve(token)
      return token
    }

    throw new Error(details ? details : 'unable to obtain token for db')
  } catch (err) {
    TOKEN.reject(err) 
  }
}

export async function status() {
  const response = await fetch(`${DATABASE_URL}/status`)
  return response.status === 200
}

export async function sql<T = unknown>(query: string): Promise<T | undefined> {
  const token = await TOKEN.promise
  if (!token) { console.error('no token'); return }

  const response = await fetch(`${DATABASE_URL}/sql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      NS: 'jdam',
      DB: 'jdam'
    },
    body: query
  })

  const [ { status, result } ] = await response.json() as { status: string, result: T }[]
  if (!result) { return }
  if (status !== 'OK') { return }
  return result
}
