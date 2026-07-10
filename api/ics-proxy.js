import { allowedIcsHost, readTextWithLimit, setSecurityHeaders } from './_serverSecurity.js'

export default async function handler(req, res) {
  try {
    setSecurityHeaders(res)
    let url = req.query.url
    if (!url || typeof url !== 'string') {
      res.status(400).send('Missing url')
      return
    }

    url = decodeURIComponent(url).trim()
    if (url.startsWith('webcal://')) url = `https://${url.slice('webcal://'.length)}`

    let parsed
    try { parsed = new URL(url) } catch { parsed = null }
    if (!parsed || !['https:', 'http:'].includes(parsed.protocol)) {
      res.status(400).send('Missing or invalid url')
      return
    }
    if (!allowedIcsHost(parsed.hostname)) {
      res.status(403).send(`Dominio iCal no permitido: ${parsed.hostname}. Se permiten Airbnb regional, Estei/DigitalOcean Spaces, Booking, VRBO/HomeAway, Google Calendar o dominios configurados en ICAL_PROXY_ALLOWED_HOSTS.`)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const response = await fetch(parsed.toString(), {
      headers: {
        // V190: user-agent neutro y compatible para proveedores como Airbnb regional y Estei/DigitalOcean Spaces.
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 AlohandoteCalendarSync/1.2',
        accept: 'text/calendar, application/calendar, text/plain, */*',
        'accept-language': 'es-VE,es;q=0.9,en;q=0.7',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      res.status(response.status).send(`No se pudo leer el iCal. HTTP ${response.status}`)
      return
    }

    const text = await readTextWithLimit(response)
    if (!text.includes('BEGIN:VCALENDAR') && !text.includes('BEGIN:VEVENT')) {
      res.status(422).send('El enlace respondió, pero no parece ser un calendario iCal válido.')
      return
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', 'inline; filename="external-calendar.ics"')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.status(200).send(text)
  } catch (err) {
    console.error('ics-proxy error:', err)
    const message = err?.name === 'AbortError' ? 'Tiempo agotado leyendo el calendario iCal.' : 'Could not fetch iCal'
    res.status(500).send(message)
  }
}
