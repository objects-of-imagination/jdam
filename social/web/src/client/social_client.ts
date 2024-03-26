import { 
  CREATE_PERSON_PATH,
  CreatePersonRequestParams,
  CreatePersonResponse,
  HEARTBEAT_PATH,
  HeartbeatResponse,
  LOGIN_PERSON_PATH,
  LoginPersonRequestParams,
  LoginPersonResponse,
  Result, 
  isErrorResponse
} from '~shared/api'
import { Person } from '~shared/data'

export class SocialClient {

  async init() {
    return true
  }

  async heartbeat(): Promise<Result> {
    const response = await fetch(HEARTBEAT_PATH)
    try { 
      const result = await response.json() as HeartbeatResponse
      return result.result
    } catch (err) {
      return 'failure'
    }
  }

  async createPerson(username: string, email: string, password: string): Promise<Person | undefined> {

    // const encodedPassword = new TextEncoder().encode(password)
    // const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', encodedPassword))

    const params: CreatePersonRequestParams = {
      username,
      email,
      // password: Array.from(hash).map(c => c.toString(16)).join('')
      password
    }

    const response = await fetch(CREATE_PERSON_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    const result = await response.json() as CreatePersonResponse
    if (isErrorResponse(result)) {
      throw new Error(result.errors.join('\n'))
    }

    const { data } = result
    return data
  }

  async loginPerson(email: string, password: string): Promise<Person | undefined> {

    const params: LoginPersonRequestParams = {
      email,
      password
    }

    const response = await fetch(LOGIN_PERSON_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    const result = await response.json() as LoginPersonResponse
    if (isErrorResponse(result)) {
      throw new Error(result.errors.join('\n'))
    }

    const { data } = result

    window.location.assign('dash')

    return data
  }

}
