import https from 'node:https'
import http from 'node:http'

const BCV_URLS = ['https://www.bcv.org.ve/', 'http://www.bcv.org.ve/']
const COMMUNITY_BCV_URLS = [
  'https://ve.dolarapi.com/v1/euros/oficial',
  'https://ve.dolarapi.com/v1/euros',
  'https://bcv-api.rafnixg.dev/rates/',
  'https://bcv-api.rafnixg.dev/v1/exchange-rates/latest/EUR',
]
const MERCANTIL_BCV_URLS = ['https://www.mercantilbanco.com/informacion/tasas%2C-tarifas-y-comisiones/tasa-mesa-de-cambio']
const COTIZAVE_API_URL = 'https://api.cotizave.com/v1/fx/rates'
const COTIZAVE_PUBLIC_URLS = [
  'https://api.cotizave.com/v1/fx/public/calculator?amount=1&from=USD&to=VES',
  'https://api.cotizave.com/v1/fx/public/calculator?amount=1',
]
const COTIZAVE_SITE_URLS = ['https://cotizave.com/']
const ALCAMBIO_URLS = ['https://alcambio.app/', 'https://www.alcambio.app/']
const BINANCE_PUBLIC_URLS = ['https://www.binance.com/en/price/tether/VES']
// V170 fallback operativo solicitado. Si BCV/API externa falla, evita que el cotizador quede sin tasa.
const OFFICIAL_BCV_EUR_FALLBACK = 680.08
const OFFICIAL_BCV_USD_FALLBACK = 587.40

function parseVeNumber(value) {
  if (value === null || value === undefined) return null
  const clean = String(value)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s/g, '')
    .replace(/Bs\.?/gi, '')
    .replace(/VES/gi, '')
    .replace(/USDT/gi, '')
    .replace(/USD/gi, '')
    .replace(/[^0-9.,-]/g, '')
  if (!clean) return null
  const lastComma = clean.lastIndexOf(',')
  const lastDot = clean.lastIndexOf('.')
  let normalized = clean
  if (lastComma > lastDot) normalized = clean.replace(/\./g, '').replace(',', '.')
  else if (lastDot > lastComma) normalized = clean.replace(/,/g, '')
  else normalized = clean.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function collectRateFromJson(node, currency = 'EUR') {
  const target = String(currency || '').toLowerCase()
  const labels = target === 'eur' ? ['eur', 'euro'] : ['usd', 'dolar', 'dólar', 'dollar']
  let found = null
  const visit = (value, context = '') => {
    if (found !== null || value === null || value === undefined) return
    if (Array.isArray(value)) { value.forEach((item) => visit(item, context)); return }
    if (typeof value === 'object') {
      const text = Object.entries(value).map(([k,v]) => typeof v === 'string' || typeof v === 'number' ? `${k}:${v}` : k).join(' ').toLowerCase()
      const looksLikeCurrency = labels.some((label) => text.includes(label))
      if (looksLikeCurrency) {
        for (const key of ['rate', 'value', 'amount', 'price', 'exchange_rate', 'tipo_cambio', 'promedio', 'avg']) {
          const parsed = parseVeNumber(value[key])
          if (validVesRate(parsed)) { found = parsed; return }
        }
      }
      for (const [key, child] of Object.entries(value)) {
        const keyLower = String(key).toLowerCase()
        const parsed = parseVeNumber(child)
        if (labels.some((label) => keyLower.includes(label)) && validVesRate(parsed)) { found = parsed; return }
        visit(child, `${context} ${key}`)
      }
      return
    }
  }
  visit(node)
  return found
}

function validVesRate(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 10 && n < 100000
}

function validUsdtRate(value, bcvEuro) {
  const n = Number(value)
  if (!validVesRate(n)) return false
  // Evita falsos positivos como 50.00 tomados de textos de botones o montos de ejemplo.
  if (validVesRate(bcvEuro)) return n >= bcvEuro * 0.65 && n <= bcvEuro * 2.5
  return n >= 200 && n <= 5000
}

function median(values) {
  const nums = values.map(Number).filter(validVesRate).sort((a, b) => a - b)
  if (!nums.length) return null
  const middle = Math.floor(nums.length / 2)
  return nums.length % 2 ? nums[middle] : (nums[middle - 1] + nums[middle]) / 2
}

function requestRaw(url, options = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const lib = target.protocol === 'http:' ? http : https
    const req = lib.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || undefined,
      path: `${target.pathname}${target.search}`,
      method: options.method || 'GET',
      timeout: options.timeout || 12000,
      rejectUnauthorized: false,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        accept: options.accept || 'text/html,application/json,*/*',
        'accept-language': 'es-VE,es;q=0.9,en;q=0.7',
        ...(options.headers || {}),
      },
    }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).toString()
          requestRaw(nextUrl, options).then(resolve).catch(reject)
          return
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`${url} respondió ${res.statusCode}: ${body.slice(0, 180)}`))
          return
        }
        resolve(body)
      })
    })
    req.on('timeout', () => { req.destroy(new Error(`Timeout consultando ${url}`)) })
    req.on('error', reject)
    if (options.body) req.write(options.body)
    req.end()
  })
}

async function requestJson(url, options = {}) {
  const raw = await requestRaw(url, { ...options, accept: 'application/json,text/plain,*/*' })
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`${url} no devolvió JSON válido`)
  }
}

function parseBcvCurrency(html, currencyId, labels = []) {
  const raw = String(html || '')
  const normalized = raw.replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ')
  const idPattern = new RegExp(`id=["']${currencyId}["'][\\s\\S]{0,3500}?<strong[^>]*>([\\s\\S]*?)<\\/strong>`, 'i')
  const fromId = parseVeNumber(raw.match(idPattern)?.[1])
  if (validVesRate(fromId)) return fromId
  for (const label of labels) {
    const block = normalized.match(new RegExp(`(?:${label})[\\s\\S]{0,2500}?(\\d{1,6}(?:[.,]\\d{1,8})?)`, 'i'))
    const fromBlock = parseVeNumber(block?.[1])
    if (validVesRate(fromBlock)) return fromBlock
  }
  const lower = normalized.toLowerCase()
  const index = labels.map((label) => lower.indexOf(String(label).toLowerCase())).filter((n) => n >= 0).sort((a,b)=>a-b)[0]
  const segment = index >= 0 ? normalized.slice(Math.max(0, index - 1500), index + 3500) : normalized
  const matches = segment.match(/\d{1,6}(?:[.,]\d{1,8})/g) || []
  const candidates = matches.map(parseVeNumber).filter(validVesRate)
  return candidates.length ? candidates[candidates.length - 1] : null
}

function parseBcvEuro(html) { return parseBcvCurrency(html, 'euro', ['Euro', 'EURO', 'EUR', 'euro']) }
function parseBcvDollar(html) { return parseBcvCurrency(html, 'dolar', ['Dólar', 'Dolar', 'USD', 'dólar', 'dolar']) }

function parseMercantilBcvReference(html, currency = 'EUR') {
  const normalized = String(html || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
  const lower = normalized.toLowerCase()
  const refIndex = lower.indexOf('tipo de cambio de referencia bcv')
  const segment = refIndex >= 0 ? normalized.slice(refIndex, refIndex + 2500) : normalized
  // La página suele publicar una tabla con encabezados Bs./USD y Bs./EUR.
  const tableMatch = segment.match(/Bs\.?\s*\/\s*USD[\s\S]{0,800}?Bs\.?\s*\/\s*EUR[\s\S]{0,800}?(\d{2,6}(?:[.,]\d{1,8})?)[\s\S]{0,250}?(\d{2,6}(?:[.,]\d{1,8})?)/i)
  if (tableMatch) {
    const usd = parseVeNumber(tableMatch[1])
    const eur = parseVeNumber(tableMatch[2])
    if (currency === 'USD' && validVesRate(usd)) return usd
    if (currency === 'EUR' && validVesRate(eur)) return eur
  }
  const keyword = currency === 'EUR' ? 'Bs./EUR' : 'Bs./USD'
  const index = segment.toLowerCase().indexOf(keyword.toLowerCase())
  if (index >= 0) {
    const local = segment.slice(index, index + 900)
    const values = (local.match(/\d{2,6}(?:[.,]\d{1,8})?/g) || []).map(parseVeNumber).filter(validVesRate)
    if (values.length) return values[values.length - 1]
  }
  return null
}

async function fetchMercantilBcv(currency = 'EUR') {
  const errors = []
  for (const url of MERCANTIL_BCV_URLS) {
    try {
      const html = await requestRaw(url, { accept: 'text/html,*/*' })
      const rate = parseMercantilBcvReference(html, currency)
      if (validVesRate(rate)) return { value: Number(rate.toFixed(4)), source: `Referencia BCV ${currency} publicada por Mercantil` }
      errors.push(`${url}: referencia ${currency} no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  throw new Error(errors.join(' | '))
}

async function fetchCommunityBcvEuro() {
  const errors = []
  for (const url of COMMUNITY_BCV_URLS) {
    try {
      const json = await requestJson(url)
      const rate = collectRateFromJson(json, 'EUR')
      if (validVesRate(rate)) return { value: Number(rate.toFixed(4)), source: 'Euro oficial BCV vía API pública de respaldo' }
      errors.push(`${url}: EUR no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  throw new Error(errors.join(' | '))
}

async function fetchCommunityBcvDollar() {
  const urls = ['https://ve.dolarapi.com/v1/dolares/oficial', 'https://ve.dolarapi.com/v1/dolares', 'https://bcv-api.rafnixg.dev/rates/', 'https://bcv-api.rafnixg.dev/v1/exchange-rates/latest/USD']
  const errors = []
  for (const url of urls) {
    try {
      const json = await requestJson(url)
      const rate = collectRateFromJson(json, 'USD')
      if (validVesRate(rate)) return { value: Number(rate.toFixed(4)), source: 'Dólar oficial BCV vía API pública de respaldo' }
      errors.push(`${url}: USD no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  throw new Error(errors.join(' | '))
}

async function fetchBcvEuro() {
  const override = parseVeNumber(process.env.VITE_FALLBACK_EUR_BCV || process.env.BCV_EUR_RATE || OFFICIAL_BCV_EUR_FALLBACK)
  const errors = []
  for (const url of BCV_URLS) {
    try {
      const html = await requestRaw(url, { accept: 'text/html,*/*' })
      const rate = parseBcvEuro(html)
      if (validVesRate(rate)) return { value: Number(rate.toFixed(4)), source: 'BCV oficial' }
      errors.push(`${url}: tasa EUR no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  try {
    return await fetchCommunityBcvEuro()
  } catch (communityError) {
    errors.push(`API pública respaldo: ${communityError.message}`)
  }
  try {
    return await fetchMercantilBcv('EUR')
  } catch (mercantilError) {
    errors.push(`Mercantil referencia BCV: ${mercantilError.message}`)
  }
  if (validVesRate(override)) return { value: Number(override.toFixed(4)), source: 'Respaldo de emergencia EUR BCV' }
  throw new Error(`No se pudo leer EUR BCV. ${errors.join(' | ')}`)
}


async function fetchBcvDollar() {
  const override = parseVeNumber(process.env.VITE_FALLBACK_USD_BCV || process.env.BCV_USD_RATE || OFFICIAL_BCV_USD_FALLBACK)
  const errors = []
  for (const url of BCV_URLS) {
    try {
      const html = await requestRaw(url, { accept: 'text/html,*/*' })
      const rate = parseBcvDollar(html)
      if (validVesRate(rate)) return { value: Number(rate.toFixed(4)), source: 'BCV oficial USD' }
      errors.push(`${url}: tasa USD no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  try {
    return await fetchCommunityBcvDollar()
  } catch (communityError) {
    errors.push(`API pública respaldo: ${communityError.message}`)
  }
  try {
    return await fetchMercantilBcv('USD')
  } catch (mercantilError) {
    errors.push(`Mercantil referencia BCV: ${mercantilError.message}`)
  }
  if (validVesRate(override)) return { value: Number(override.toFixed(4)), source: 'Respaldo de emergencia USD BCV' }
  throw new Error(`No se pudo leer USD BCV. ${errors.join(' | ')}`)
}

function numberFromRateObject(item) {
  if (!item || typeof item !== 'object') return null
  const keys = ['mid', 'ask', 'sell', 'venta', 'rate', 'value', 'price', 'amount', 'ves', 'VES']
  for (const key of keys) {
    const value = parseVeNumber(item[key])
    if (validVesRate(value)) return value
  }
  return null
}

function marketName(item) {
  if (!item || typeof item !== 'object') return ''
  return [item.market, item.type, item.source, item.name, item.label, item.currency, item.base, item.symbol]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function collectUsdtCandidatesFromJson(data, bcvEuro) {
  const candidates = []
  const visit = (node, context = '') => {
    if (!node) return
    if (Array.isArray(node)) {
      for (const item of node) visit(item, context)
      return
    }
    if (typeof node === 'object') {
      const name = `${context} ${marketName(node)}`.toLowerCase()
      const value = numberFromRateObject(node)
      if (validUsdtRate(value, bcvEuro) && /(usdt|tether|p2p|binance|bybit|okx|bitget|mexc|bingx|coinex|saldo|parallel|paralela)/i.test(name)) {
        candidates.push(value)
      }
      for (const [key, valueNode] of Object.entries(node)) visit(valueNode, `${name} ${key}`)
    }
  }
  visit(data)
  return candidates.filter((v) => validUsdtRate(v, bcvEuro))
}

function parseCotizaveHtml(html, bcvEuro) {
  const raw = String(html || '')
  const normalized = raw.replace(/&nbsp;/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const lower = normalized.toLowerCase()
  const keywords = ['p2p mid', 'usdt', 'binance p2p', 'bybit p2p', 'okx p2p', 'bitget', 'mexc', 'bingx', 'saldo']
  const candidates = []
  for (const keyword of keywords) {
    let start = 0
    while (true) {
      const index = lower.indexOf(keyword, start)
      if (index < 0) break
      const segment = normalized.slice(Math.max(0, index - 180), index + 520)
      const matches = segment.match(/\d{2,6}(?:[.,]\d{1,8})?/g) || []
      for (const match of matches) {
        const value = parseVeNumber(match)
        if (validUsdtRate(value, bcvEuro)) candidates.push(value)
      }
      start = index + keyword.length
    }
  }
  return candidates.length ? median(candidates) : null
}

function parseGenericUsdtHtml(html, bcvEuro) {
  const raw = String(html || '')
  const normalized = raw
    .replace(/\\u0026/g, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
  const lower = normalized.toLowerCase()
  const candidates = []
  for (const keyword of ['usdt', 'tether', 'p2p', 'binance']) {
    let start = 0
    while (true) {
      const index = lower.indexOf(keyword, start)
      if (index < 0) break
      const segment = normalized.slice(Math.max(0, index - 400), index + 1200)
      const matches = segment.match(/\d{2,6}(?:[.,]\d{1,8})?/g) || []
      for (const match of matches) {
        const value = parseVeNumber(match)
        if (validUsdtRate(value, bcvEuro)) candidates.push(value)
      }
      start = index + keyword.length
    }
  }
  return candidates.length ? median(candidates) : null
}

async function fetchCotizaveUsdtWithKey(bcvEuro) {
  const apiKey = process.env.COTIZAVE_API_KEY || process.env.VITE_COTIZAVE_API_KEY
  if (!apiKey) return null
  const json = await requestJson(COTIZAVE_API_URL, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
  })
  const candidates = collectUsdtCandidatesFromJson(json, bcvEuro)
  const value = candidates.length ? median(candidates) : null
  if (validUsdtRate(value, bcvEuro)) return { value: Number(value.toFixed(4)), source: 'Cotizave API P2P USDT/VES' }
  throw new Error('Cotizave API respondió, pero no se encontró tasa USDT/P2P válida')
}

async function fetchCotizavePublicUsdt(bcvEuro) {
  const errors = []
  for (const url of COTIZAVE_PUBLIC_URLS) {
    try {
      const json = await requestJson(url)
      const candidates = collectUsdtCandidatesFromJson(json, bcvEuro)
      const value = candidates.length ? median(candidates) : null
      if (validUsdtRate(value, bcvEuro)) return { value: Number(value.toFixed(4)), source: 'Cotizave público USDT/VES' }
      errors.push(`${url}: sin tasa USDT válida`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  for (const url of COTIZAVE_SITE_URLS) {
    try {
      const html = await requestRaw(url, { accept: 'text/html,*/*' })
      const rate = parseCotizaveHtml(html, bcvEuro)
      if (validUsdtRate(rate, bcvEuro)) return { value: Number(rate.toFixed(4)), source: 'Cotizave web P2P USDT/VES' }
      errors.push(`${url}: tasa USDT no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  throw new Error(errors.join(' | '))
}

async function fetchFallbackUsdt(bcvEuro) {
  const override = parseVeNumber(
    process.env.USDT_MARKET_RATE ||
    process.env.ALCAMBIO_USDT_RATE ||
    process.env.VITE_FALLBACK_USDT_ALCAMBIO ||
    process.env.BINANCE_USDT_RATE
  )
  if (validUsdtRate(override, bcvEuro)) return { value: Number(override.toFixed(4)), source: 'Fallback USDT configurado en Vercel' }

  const errors = []
  for (const url of ALCAMBIO_URLS) {
    try {
      const html = await requestRaw(url, { accept: 'text/html,*/*' })
      const rate = parseGenericUsdtHtml(html, bcvEuro)
      if (validUsdtRate(rate, bcvEuro)) return { value: Number(rate.toFixed(4)), source: 'Al Cambio USDT/VES' }
      errors.push(`${url}: tasa USDT no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  for (const url of BINANCE_PUBLIC_URLS) {
    try {
      const html = await requestRaw(url, { accept: 'text/html,*/*' })
      const rate = parseGenericUsdtHtml(html, bcvEuro)
      if (validUsdtRate(rate, bcvEuro)) return { value: Number(rate.toFixed(4)), source: 'Binance precio público USDT/VES' }
      errors.push(`${url}: tasa USDT no legible`)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }
  throw new Error(errors.join(' | '))
}

async function fetchUsdtMarket(bcvEuro) {
  const errors = []
  try {
    const keyed = await fetchCotizaveUsdtWithKey(bcvEuro)
    if (keyed) return keyed
  } catch (error) { errors.push(`Cotizave API: ${error.message}`) }
  try {
    return await fetchCotizavePublicUsdt(bcvEuro)
  } catch (error) { errors.push(`Cotizave público/web: ${error.message}`) }
  try {
    return await fetchFallbackUsdt(bcvEuro)
  } catch (error) { errors.push(`Fallbacks: ${error.message}`) }
  throw new Error(`No se pudo leer USDT/VES. ${errors.join(' | ')}`)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' })

  const [eurResult, usdResult] = await Promise.allSettled([fetchBcvEuro(), fetchBcvDollar()])
  const eur = eurResult.status === 'fulfilled' ? eurResult.value : null
  const usd = usdResult.status === 'fulfilled' ? usdResult.value : null
  const bcvEuro = validVesRate(eur?.value) ? Number(eur.value.toFixed(4)) : OFFICIAL_BCV_EUR_FALLBACK
  const bcvDollar = validVesRate(usd?.value) ? Number(usd.value.toFixed(4)) : OFFICIAL_BCV_USD_FALLBACK
  const degraded = eurResult.status !== 'fulfilled' || usdResult.status !== 'fulfilled' || /respaldo/i.test(`${eur?.source || ''} ${usd?.source || ''}`)

  return res.status(200).json({
    success: true,
    degraded,
    bcvEuro,
    bcvDollar,
    binanceUsdt: bcvDollar,
    alCambioUsdt: '',
    usdtMarket: '',
    rawSpreadPercent: 0,
    spreadPercent: 0,
    updatedAt: new Date().toISOString(),
    source: degraded ? 'BCV con respaldo automático' : 'BCV actualizado en línea',
    sources: {
      bcv: eur?.source || 'Respaldo de emergencia EUR BCV',
      bcvUsd: usd?.source || 'Respaldo de emergencia USD BCV',
      usdt: 'No usado',
    },
    errors: [
      eurResult.status === 'rejected' ? `EUR: ${eurResult.reason?.message || 'falló'}` : '',
      usdResult.status === 'rejected' ? `USD: ${usdResult.reason?.message || 'falló'}` : '',
    ].filter(Boolean),
  })
}

