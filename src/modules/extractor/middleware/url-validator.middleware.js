export function urlValidator (req, res, next) {
  const url = req.query.url
  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res
      .status(400)
      .json({ error: 'URL must start with http:// or https://' })
  }

  if (!URL.canParse(url)) {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  next()
}
