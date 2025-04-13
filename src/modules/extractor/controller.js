import { getResponse } from './services/website.service.js'
import ControlledError from '../../services/error.service.js'
import log from '../../utils/console.util.js'

export async function getByRequest (url) {
  try {
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
  } catch (error) {
    log(3, 'EXTRACTOR', 'getByRequest', `Error: ${error.message}`)
    throw error instanceof ControlledError
      ? error
      : new ControlledError(`Failed to extract content: ${error.message}`, 500)
  }
}

// Placeholder for getByScraper function that will be implemented later
export async function getByScraper (url) {
  throw new ControlledError('The scraper method is not yet implemented', 501)
}

/**
 * Check if NSW2 is available on Amazon France
 * @param {string} url - Amazon France product URL (optional)
 * @returns {Object} - Response with availability status
 */
export async function checkNSW2AmznFrAvailability (url = 'https://amzn.eu/d/ioGRpBq') {
  try {
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
      return { available: true }
    }
  } catch (error) {
    log(3, 'EXTRACTOR', 'checkNSW2AmznFrAvailability', `Error: ${error.message}`)
    throw error instanceof ControlledError
      ? error
      : new ControlledError(`Failed to check NSW2 availability: ${error.message}`, 500)
  }
}
