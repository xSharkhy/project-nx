import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import log from '../../../utils/console.util.js'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to store configuration
const configPath = path.join(__dirname, '..', '..', '..', '..', 'config')
const stealthConfigPath = path.join(configPath, 'stealth-config.json')

// Default configurations
const DEFAULT_CONFIG = {
  // Browser fingerprinting evasion
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0'
  ],

  // Request patterns
  requestDelays: {
    min: 500,
    max: 3000
  },

  // Timeouts
  timeouts: {
    min: 15000,
    max: 30000
  },

  // Common headers
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    DNT: '1',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    Pragma: 'no-cache'
  },

  // Playwright-specific settings
  playwright: {
    viewport: {
      width: 1280,
      height: 720
    },
    // Evasion techniques for Playwright
    evasionFlags: [
      'webgl.vendor',
      'navigator.hardware',
      'javascript.enabled'
    ],
    // Browser preferences
    browserPreferences: {
      'navigator.maxTouchPoints': 0,
      'navigator.doNotTrack': '1'
    }
  },

  // Website fetch-specific settings
  website: {
    // Referrers to use for different domains
    referrerMap: {
      amazon: 'https://www.google.com/search?q=amazon+products',
      youtube: 'https://www.google.com/search?q=youtube+videos',
      default: 'https://www.google.com/'
    },
    // Cookie management
    cookieRetentionDays: 7
  }
}

// Load configuration or create if doesn't exist
function loadConfig () {
  try {
    // Create config directory if it doesn't exist
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath, { recursive: true })
    }

    // Create default config if it doesn't exist
    if (!fs.existsSync(stealthConfigPath)) {
      fs.writeFileSync(stealthConfigPath, JSON.stringify(DEFAULT_CONFIG, null, 2))
      log(1, 'STEALTH', 'loadConfig', 'Created default stealth configuration')
      return DEFAULT_CONFIG
    } else {
      const configData = fs.readFileSync(stealthConfigPath, 'utf8')
      const parsedConfig = JSON.parse(configData)
      log(1, 'STEALTH', 'loadConfig', 'Loaded stealth configuration from file')
      return parsedConfig
    }
  } catch (error) {
    log(3, 'STEALTH', 'loadConfig', `Error loading configuration: ${error.message}`)
    log(1, 'STEALTH', 'loadConfig', 'Using default stealth configuration instead')
    return DEFAULT_CONFIG
  }
}

// Configuration singleton
let stealthConfig = null

/**
 * Get the stealth configuration
 * @returns {object} Stealth configuration
 */
export function getStealthConfig () {
  if (stealthConfig === null) {
    stealthConfig = loadConfig()
  }
  return stealthConfig
}

/**
 * Get a random user agent from the configuration
 * @returns {string} A randomly selected user agent
 */
export function getRandomUserAgent () {
  const config = getStealthConfig()
  return config.userAgents[Math.floor(Math.random() * config.userAgents.length)]
}

/**
 * Generate a random delay within the configured range
 * @param {number} [min] - Custom minimum delay (ms)
 * @param {number} [max] - Custom maximum delay (ms)
 * @returns {Promise} Promise that resolves after the delay
 */
export async function randomDelay (min, max) {
  const config = getStealthConfig()
  const minDelay = min || config.requestDelays.min
  const maxDelay = max || config.requestDelays.max

  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Extract the domain from a URL
 * @param {string} url - URL to extract domain from
 * @returns {string|null} Domain or null if invalid URL
 */
export function getDomain (url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/**
 * Get an appropriate referer for a given URL
 * @param {string} url - URL to get referer for
 * @returns {string} Appropriate referer
 */
export function getAppropriateReferer (url) {
  const config = getStealthConfig()
  const domain = getDomain(url)

  if (!domain) return config.website.referrerMap.default

  // Check for specific domains
  for (const [key, referer] of Object.entries(config.website.referrerMap)) {
    if (domain.includes(key)) {
      return referer
    }
  }

  // Default to a Google search for the domain
  return `https://www.google.com/search?q=${domain.replace(/\./g, '+')}`
}

/**
 * Generate common request headers with anti-bot detection techniques
 * @param {string} url - URL to generate headers for
 * @returns {object} Request headers
 */
export function generateCommonHeaders (url) {
  const config = getStealthConfig()

  return {
    ...config.headers,
    'User-Agent': getRandomUserAgent(),
    Referer: getAppropriateReferer(url),
    'Sec-Ch-Ua': '"Chromium";v="134", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"'
  }
}

/**
 * Generate a random timeout within the configured range
 * @returns {number} Timeout in milliseconds
 */
export function getRandomTimeout () {
  const config = getStealthConfig()
  return config.timeouts.min + Math.floor(Math.random() * (config.timeouts.max - config.timeouts.min))
}

/**
 * Get Playwright-specific stealth settings
 * @returns {object} Playwright stealth settings
 */
export function getPlaywrightStealthSettings () {
  const config = getStealthConfig()
  return config.playwright
}

/**
 * Get Website fetch-specific stealth settings
 * @returns {object} Website fetch stealth settings
 */
export function getWebsiteStealthSettings () {
  const config = getStealthConfig()
  return config.website
}
