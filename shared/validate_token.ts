import { AUTH_JWT } from './api.js'

export function validateJdamToken(token: Partial<AUTH_JWT>) {
  const { id, iat: issuedAt } = token
  if (!id) {
    throw new Error('No id on token')
  }

  if (typeof issuedAt !== 'number' || Number.isNaN(issuedAt)) {
    throw new Error('No issued at')
  }
  
  const age = token.age ?? (86400 * 1000)
  if (Date.now() - (issuedAt * 1000) > age) {
    throw new Error('Token expired')
  }

  return true
}
