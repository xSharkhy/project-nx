import e from 'express'
import execute from '../../services/manager.service.js'

const router = e.Router()

router.get('/get-by-request', async (req, res) => {
  const params = ['url']
  await execute(req, res, 'extractor', 'getByRequest', params)
})

router.get('/get-by-scraper', async (req, res) => {
  const params = ['url']
  await execute(req, res, 'extractor', 'getByScraper', params)
})

export default router
