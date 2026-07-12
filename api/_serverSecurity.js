import crypto from 'node:crypto'

const TOKEN_SCOPE = 'https://www.googleapis.com/auth/datastore'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

function base64Url(input) {
  return Buffer.from(input).toString('base64url')
}

function serviceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || ''
  if (!raw) return null
  try {
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch (error) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT env:', error.message)
    return null
  }
}

let cachedAccessToken = null
let cachedAccessTokenExp = 0

export async function getFirestoreAuthHeaders() {
  const serviceAccount = serviceAccountFromEnv()
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    if (process.env.LEGACY_FIRESTORE_REST_FALLBACK === 'false') {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64 for secure Firestore server access')
    }
    return { mode: 'legacy', headers: { accept: 'application/json' }, queryKey: true }
  }

  const now = Math.floor(Date.now() / 1000)
  if (cachedAccessToken && cachedAccessTokenExp - 60 > now) {
    return { mode: 'service-account', headers: { accept: 'application/json', authorization: `Bearer ${cachedAccessToken}` }, queryKey: false }
  }

  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccount.client_email,
    scope: TOKEN_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const signature = signer.sign(serviceAccount.private_key, 'base64url')
  const assertion = `${unsigned}.${signature}`

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!response.ok) throw new Error(`OAuth token failed ${response.status}`)
  const data = await response.json()
  cachedAccessToken = data.access_token
  cachedAccessTokenExp = now + Number(data.expires_in || 3600)
  return { mode: 'service-account', headers: { accept: 'application/json', authorization: `Bearer ${cachedAccessToken}` }, queryKey: false }
}

export function setSecurityHeaders(res, options = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (options.calendar) {
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300')
  } else {
    res.setHeader('Cache-Control', 'no-store, max-age=0')
  }
}

export function safeSlug(value = '') {
  return String(value).replace(/\.ics$/i, '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
}

export function isPrivateOrLocalHost(hostname = '') {
  const host = String(hostname).toLowerCase()
  return host === 'localhost'
    || host === '127.0.0.1'
    || host === '0.0.0.0'
    || host === '::1'
    || host.endsWith('.local')
    || /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    || /^169\.254\./.test(host)
}

export function allowedIcsHost(hostname = '') {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '')
  if (isPrivateOrLocalHost(host)) return false

  // V190: Airbnb/Estei entregan enlaces iCal desde dominios externos/regionales y CDN externos.
  // Estei puede usar estei.app o buckets de DigitalOcean Spaces como estei.nyc3.digitaloceanspaces.com.
  // V188: Airbnb entrega enlaces iCal regionales, por ejemplo:
  // www.airbnb.cl, www.airbnb.es, www.airbnb.mx, etc.
  // Si solo permitimos airbnb.com, la sincronización entrante falla aunque el link sea correcto.
  const providerPatterns = [
    /(^|\.)airbnb\.[a-z.]+$/i,
    /(^|\.)booking\.[a-z.]+$/i,
    /(^|\.)estei\.app$/i,
    /(^|\.)estei\.[a-z.]+$/i,
    /(^|\.)digitaloceanspaces\.com$/i,
    /(^|\.)vrbo\.[a-z.]+$/i,
    /(^|\.)homeaway\.[a-z.]+$/i,
    /(^|\.)calendar\.google\.com$/i,
    /(^|\.)icalendar\.org$/i,
  ]
  if (providerPatterns.some((pattern) => pattern.test(host))) return true

  const configured = (process.env.ICAL_PROXY_ALLOWED_HOSTS || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)

  return configured.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
}

export async function readTextWithLimit(response, maxBytes = 800_000) {
  const reader = response.body?.getReader?.()
  if (!reader) {
    const text = await response.text()
    if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error('Response too large')
    return text
  }
  const chunks = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) throw new Error('Response too large')
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
