import { 
  AUTH_CHECK_PATH,
  AUTH_JWT,
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
import { getJdamCookie } from './jdam_cookie'
import { validateJdamToken } from '~shared/validate_token'

export class SocialClient {

  expirationTimer = -1

  async init() {
    window.addEventListener('pageshow', async () => {
      const token = getJdamCookie()
      let valid = false
      if (token) {
        try { 
          valid = validateJdamToken(token)
        } catch (err) {
          // do nothing
        }
      }

      if (valid) {
        if (window.location.pathname === '/') {
          window.location.assign('dash')
        } else {
          window.clearTimeout(this.expirationTimer)
          this.expirationTimer = window.setTimeout(() => {
            window.location.assign('/')
          }, ((token!.iat + 86400) * 1000) - Date.now())
        }
      } else {
        if (window.location.pathname !== '/') {
          window.location.assign('/')
        }
      }
    })

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

  async checkAuth() {
    try {
      const response = await fetch(AUTH_CHECK_PATH, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.status !== 200) {
        throw new Error('Unauthorized')
      }

      const tokenData = await response.json() as Partial<AUTH_JWT>

      if (!tokenData) {
        throw new Error('No token data')
      }

      const { id, iat: issuedAt } = tokenData
      if (!id || typeof issuedAt !== 'number' || Number.isNaN(issuedAt)) {
        throw new Error('Malformed token')
      }

      if (Date.now() - (issuedAt * 1000) > 24 * 60 * 60 * 1000) {
        throw new Error('Token expired')
      }

    } catch (err) {
      console.error(err)
    }
    return false
  }

}
