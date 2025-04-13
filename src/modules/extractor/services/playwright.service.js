import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import log from '../../../utils/console.util.js'
import ControlledError from '../../../services/error.service.js'
import {
  getRandomUserAgent,
  randomDelay,
  getDomain,
  getPlaywrightStealthSettings,
  getAppropriateReferer
} from './stealth.service.js'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to store screenshots
const screenshotsDir = path.join(__dirname, '..', '..', '..', '..', 'screenshots')

/**
 * Apply stealth techniques to a Playwright page
 * @param {Page} page - Playwright page to apply stealth settings to
 * @returns {Promise<void>}
 */
async function applyStealthTechniques (page) {
  const stealthSettings = getPlaywrightStealthSettings()

  // Apply the browser preferences from stealth config
  for (const [key, value] of Object.entries(stealthSettings.browserPreferences)) {
    await page.addInitScript(`
      Object.defineProperty(navigator, '${key.split('.')[1]}', {
        get: () => ${typeof value === 'string' ? `'${value}'` : value}
      });
    `)
  }

  // Standard fingerprinting evasion techniques
  await page.addInitScript(() => {
    // Prevent WebRTC fingerprinting
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia.bind(navigator.mediaDevices)
    if (originalGetUserMedia) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: async () => {
          throw new Error('getUserMedia is not implemented')
        }
      })
    }

    // Modify navigator.webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    })

    // Override permissions API
    if (navigator.permissions) {
      const originalQuery = navigator.permissions.query
      Object.defineProperty(navigator.permissions, 'query', {
        value: async (args) => {
          if (args.name === 'notifications') {
            return { state: 'prompt' }
          }
          return originalQuery.call(navigator.permissions, args)
        }
      })
    }

    // Obscure canvas fingerprinting
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: function () {
        // Add slight noise to canvas data
        if (Math.random() < 0.1) {
          // Only apply noise 10% of the time to avoid detection
          const context = this.getContext('2d')
          const imageData = context.getImageData(0, 0, this.width, this.height)
          const pixelArray = imageData.data

          for (let i = 0; i < pixelArray.length; i += 4) {
            // Add minor random noise to RGB values
            pixelArray[i] = pixelArray[i] + Math.floor(Math.random() * 2)
            pixelArray[i + 1] = pixelArray[i + 1] + Math.floor(Math.random() * 2)
            pixelArray[i + 2] = pixelArray[i + 2] + Math.floor(Math.random() * 2)
          }

          context.putImageData(imageData, 0, 0)
        }

        return originalToDataURL.apply(this, arguments)
      }
    })
  })
}

/**
 * Take a screenshot of a website using Playwright with stealth techniques
 * @param {string} url - URL to take screenshot of
 * @returns {object} - Object containing screenshot path, filename and buffer
 */
export async function takeScreenshot (url) {
  log(1, 'PLAYWRIGHT', 'takeScreenshot', `Taking screenshot of ${url}`)

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true })
  }

  // Add a random delay to mimic human behavior
  await randomDelay()

  let browser = null

  try {
    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const domain = getDomain(url) || 'unknown'
    const filename = `screenshot_${timestamp}_${domain.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    const screenshotPath = path.join(screenshotsDir, filename)

    // Launch browser and create page with stealth settings
    browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials'
      ]
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    })

    const page = await context.newPage()

    // Apply stealth techniques
    await applyStealthTechniques(page)

    // Set the referrer
    await page.setExtraHTTPHeaders({
      Referer: getAppropriateReferer(url),
      'Accept-Language': 'es-ES,fr-FR;q=0.9,en-US;q=0.8'
    })

    // Navigate to URL and wait for network idle with a realistic timeout
    await page.goto(url)
    log(1, 'PLAYWRIGHT', 'takeScreenshot', `Navigated to ${url}`)

    // Wait a bit to ensure page is loaded before trying to interact with it
    await randomDelay(1000, 3000)

    // Try to click the "Refuser" button to dismiss cookie consent if it exists
    try {
      // Wait for the cookie consent button with a reasonable timeout
      const cookieButton = await page.waitForSelector('#sp-cc-rejectall-link', { timeout: 5000 })
      if (cookieButton) {
        log(1, 'PLAYWRIGHT', 'takeScreenshot', 'Found cookie consent button, clicking it')
        await cookieButton.click()
        // Wait a moment for the cookie banner to disappear
        await randomDelay(500, 1500)
      }
    } catch (buttonError) {
      // If the button is not found, just continue - not all pages have cookie banners
      log(1, 'PLAYWRIGHT', 'takeScreenshot', 'Cookie consent button not found or could not be clicked')
    }

    // Wait a bit more to ensure page is fully loaded
    await randomDelay(1000, 3000)

    // Take screenshot and get the buffer
    const screenshotBuffer = await page.screenshot({
      path: screenshotPath
    })

    log(1, 'PLAYWRIGHT', 'takeScreenshot', `Screenshot saved to ${screenshotPath}`)

    return {
      path: screenshotPath,
      filename,
      buffer: screenshotBuffer
    }
  } catch (error) {
    log(3, 'PLAYWRIGHT', 'takeScreenshot', `Error taking screenshot: ${error.message}`)
    throw new ControlledError(`Failed to take screenshot: ${error.message}`, 500)
  } finally {
    // Close browser
    if (browser) {
      await browser.close()
      log(1, 'PLAYWRIGHT', 'takeScreenshot', 'Browser closed')
    }
  }
}
