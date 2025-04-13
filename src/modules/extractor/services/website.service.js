import ControlledError from '../../../services/error.service.js'
import log from '../../../utils/console.util.js'
import {
  randomDelay,
  generateCommonHeaders,
  getDomain,
  getRandomTimeout,
  getWebsiteStealthSettings
} from './stealth.service.js'

// Store cookies for domain-specific requests
const cookieJar = {}

// Clean expired cookies periodically
const COOKIE_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
setInterval(() => {
  cleanupExpiredCookies()
}, COOKIE_CLEANUP_INTERVAL)

function cleanupExpiredCookies () {
  const now = Date.now()
  const stealthSettings = getWebsiteStealthSettings()
  const expiryTime = stealthSettings.cookieRetentionDays * 24 * 60 * 60 * 1000

  Object.keys(cookieJar).forEach(domain => {
    if (cookieJar[domain].timestamp && (now - cookieJar[domain].timestamp > expiryTime)) {
      log(1, 'WEBSITE', 'cleanupExpiredCookies', `Removing expired cookies for domain: ${domain}`)
      delete cookieJar[domain]
    }
  })
}

export async function getResponse (url) {
  // Add a randomized delay to mimic human behavior
  await randomDelay()

  const domain = getDomain(url)

  // Generate timeout with jitter
  const timeout = getRandomTimeout()

  // Get headers with anti-detection measures
  const headers = generateCommonHeaders(url)

  // Add cookies if we have them for this domain
  if (domain && cookieJar[domain] && cookieJar[domain].value) {
    headers.Cookie = cookieJar[domain].value
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Log request but mask full details to avoid detection patterns in logs
    log(1, 'WEBSITE', 'getResponse', `Requesting ${domain || 'website'} with timeout ${Math.round(timeout / 1000)}s`)

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      credentials: 'include' // Maintain cookies
    })

    clearTimeout(timeoutId)

    // Store cookies for future requests with timestamp
    if (domain && response.headers.has('set-cookie')) {
      cookieJar[domain] = {
        value: response.headers.get('set-cookie'),
        timestamp: Date.now()
      }
    }

    if (!response.ok) {
      throw new ControlledError(`HTTP error! Website replied with status: ${response.status}`, 400)
    }

    return response
  } catch (error) {
    let errorMessage = 'Failed to fetch URL'
    if (error.name === 'AbortError') {
      errorMessage = `Request timeout after ${timeout}ms.`
    }

    log(3, 'WEBSITE', 'getResponse', `Error fetching ${domain || url}: ${errorMessage}`)

    return null
  }
}
