import { getResponse } from './services/website.service.js'
import { takeScreenshot } from './services/playwright.service.js'
import ControlledError from '../../services/error.service.js'
import log from '../../utils/console.util.js'

export async function getByRequest (url) {
  log(1, 'EXTRACTOR', 'getByRequest', `Extracting content from ${url} using fetch`)

  const response = await getResponse(url)

  if (!response) {
    throw new ControlledError('Failed to fetch URL or timed out', 400)
  }

  const contentType = response.headers.get('content-type')

  // Handle different content types
  if (contentType && contentType.includes('application/json')) {
    return await response.json()
  } else {
    // For HTML and other text-based content
    return await response.text()
  }
}

/**
 * Get webpage content using Playwright browser and take a screenshot
 * @param {string} url - URL to scrape and screenshot
 * @returns {Object} - Response with screenshot path and buffer information
 */
export async function getByScraper (url) {
  log(1, 'EXTRACTOR', 'getByScraper', `Scraping and taking screenshot of ${url}`)

  // Take screenshot using Playwright
  const screenshotData = await takeScreenshot(url)

  return {
    message: 'Screenshot taken successfully',
    url,
    screenshotPath: screenshotData.path,
    screenshotFilename: screenshotData.filename,
    screenshotBuffer: screenshotData.buffer
  }
}

/**
 * Check if NSW2 is available on Amazon France
 * @param {string} url - Amazon France product URL (optional)
 * @returns {Object} - Response with availability status and screenshot information if available
 */
export async function checkNSW2AmznFrAvailability (url = 'https://amzn.eu/d/ioGRpBq') {
  log(1, 'EXTRACTOR', 'checkNSW2AmznFrAvailability', `Checking NSW2 availability at ${url}`)

  const content = await getByRequest(url)

  // Check for unavailability messages in the content
  const unavailablePatterns = [
    'Actuellement indisponible.',
    'Currently Unavailable.'
  ]

  const isUnavailable = unavailablePatterns.some(pattern =>
    content.includes(pattern)
  )

  if (isUnavailable) {
    return { message: 'NSW2 is still not available', available: false }
  } else {
    // Product is available, take a screenshot using playwright
    log(1, 'EXTRACTOR', 'checkNSW2AmznFrAvailability', 'NSW2 is available! Taking screenshot...')

    try {
      // Call getByScraper to take a screenshot
      const screenshotResult = await getByScraper(url)

      return {
        message: 'NSW2 is available!',
        available: true,
        screenshotPath: screenshotResult.screenshotPath,
        screenshotFilename: screenshotResult.screenshotFilename,
        screenshotBuffer: screenshotResult.screenshotBuffer
      }
    } catch (error) {
      // If screenshot fails, still return availability status
      log(3, 'EXTRACTOR', 'checkNSW2AmznFrAvailability', `Failed to take screenshot: ${error.message}`)
      return {
        message: 'NSW2 is available! (Screenshot failed)',
        available: true,
        error: error.message
      }
    }
  }
}
