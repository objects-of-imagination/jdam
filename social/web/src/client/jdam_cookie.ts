import { AUTH_COOKIE_NAME, AUTH_JWT } from '~shared/api'

export function getJdamCookie(): AUTH_JWT | undefined {
  const allCookies = document.cookie.split(';')
  if (!allCookies.length) { return }

  for (const unparsedCookie of allCookies) {
    const [ key, ...values ] = unparsedCookie.split('=')
    if (key !== AUTH_COOKIE_NAME) { continue }

    const value = values.join('')
    const tokenParts = value.split('.')
    if (tokenParts.length !== 3) { return }

    try {
      const data = JSON.parse(atob(tokenParts[1])) as AUTH_JWT
      return data
    } catch (err) {
      return
    }
  }
}
