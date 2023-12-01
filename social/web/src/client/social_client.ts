import { HEARTBEAT_PATH, HeartbeatResponse, Result } from '~shared/api'

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

}
