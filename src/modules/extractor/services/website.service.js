import ControlledError from '../../../services/error.service.js'
import log from '../../../utils/console.util.js'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
]

const cookieJar = {}

function getRandomUserAgent () {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function getDomain (url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

// Añadir delay aleatorio para simular comportamiento humano
async function randomDelay (min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1) + min)
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Determinar el referer apropiado basado en la URL solicitada
function getAppropriateReferer (url) {
  const domain = getDomain(url)
  if (!domain) return 'https://www.google.com/'

  // Si es una página conocida, usar un referer adecuado
  if (domain.includes('youtube.com')) return 'https://www.google.com/search?q=youtube+videos'
  if (domain.includes('amazon') || domain.includes('amzn')) return 'https://www.google.com/search?q=amazon+products'

  return `https://www.google.com/search?q=${domain.replace(/\./g, '+')}`
}

export async function getResponse (url) {
  await randomDelay(500, 2000)

  const domain = getDomain(url)

  const options = {
    timeout: 20000 + Math.floor(Math.random() * 5000), // Timeout variable
    headers: {
      'User-Agent': getRandomUserAgent(),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer: getAppropriateReferer(url),
      DNT: '1',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      Pragma: 'no-cache'
    }
  }

  // Añadir cookies si existen para este dominio
  if (domain && cookieJar[domain]) {
    options.headers.Cookie = cookieJar[domain]
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout)

    const response = await fetch(url, {
      headers: options.headers,
      signal: controller.signal,
      credentials: 'include' // Mantener cookies
    })

    clearTimeout(timeoutId)

    // Guardar cookies para futuras solicitudes
    if (domain && response.headers.has('set-cookie')) {
      cookieJar[domain] = response.headers.get('set-cookie')
    }

    if (!response.ok) {
      throw new ControlledError(`HTTP error! Website replied with status: ${response.status}`, 400)
    }

    return response
  } catch (error) {
    let errorMessage = 'Failed to fetch URL'
    if (error.name === 'AbortError') {
      errorMessage = `Request timeout after ${options.timeout}ms.`
    }

    log(3, 'WEBSITE', 'getWeb', `Error fetching ${url}: ${errorMessage}`)

    return null
  }
}
