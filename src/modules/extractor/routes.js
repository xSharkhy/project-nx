import e from 'express'
import execute from '../../services/manager.service.js'
import { urlValidator } from './middleware/url-validator.middleware.js'

const router = e.Router()

router.get('/get-by-request', urlValidator, async (req, res) => {
  const params = ['url']
  await execute(req, res, 'extractor', 'getByRequest', params)
})

router.get('/get-by-scraper', urlValidator, async (req, res) => {
  const params = ['url']
  await execute(req, res, 'extractor', 'getByScraper', params)
})

// NSW2 Amazon France availability check endpoint
router.get('/nsw2-amznfr-availability', async (req, res) => {
  const params = ['url'] // 'url' parameter is optional, it will use default if not provided
  await execute(req, res, 'extractor', 'checkNSW2AmznFrAvailability', params)
})

export default router
