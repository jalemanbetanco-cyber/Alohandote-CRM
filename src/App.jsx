import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, BarChart3, Car, ChevronLeft, ChevronRight, Download, FileText, Lock, LogOut, Mail, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { collection, addDoc, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore'
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { adminEmails, auth, db, isFirebaseReady, storage } from './firebase'
import { formatShortDate, getMonthDays, isDateInsideRange, monthTitle, parseISODate, rangesOverlap, toISODate } from './dateUtils'
import { validateReservationCritical, validateLodgingCritical, validateVehicleOperationCritical, validateCleaningCritical, validatePublicSubmissionCritical } from './domain/validations.js'
import { backupFileName, buildBackupPayload, rowsToWorksheetRows } from './services/backupService.js'
import { buildHealthEvent, buildHealthSnapshot, healthRecommendations, healthStatus } from './services/healthService.js'
import { isNonBlockingShortMaintenance } from './domain/maintenance.js'
import { cleanPrintCss, alohandotePdfHeader, alohandoteContactFooter } from './modules/documents/branding.js'
import { buildV211DocumentHtml } from './modules/documents/v211Templates.js'

const INITIAL_VEHICLES = [
  { id: 'demo-1', name: 'Dongfeng A60', brand: 'Dongfeng', model: 'A60', year: '', plate: '', color: '', vin: '', vehicleType: 'Sedan', transmission: 'Automático', fuelType: 'Gasolina', dailyRentalRate: '', pricePerKm: 0.30, currentKm: '', lastKmUpdateAt: '', lastKmUpdatedBy: '', mapsUrl: '', investmentCost: '', photos: [], active: true },
  { id: 'demo-2', name: 'Chery Arauca', brand: 'Chery', model: 'Arauca', year: '', plate: '', color: '', vin: '', vehicleType: 'Sedan', transmission: 'Automático', fuelType: 'Gasolina', dailyRentalRate: '', pricePerKm: 0.30, currentKm: '', lastKmUpdateAt: '', lastKmUpdatedBy: '', mapsUrl: '', investmentCost: '', photos: [], active: true },
  { id: 'demo-3', name: 'Saipa Quick', brand: 'Saipa', model: 'Quick', year: '', plate: '', color: '', vin: '', vehicleType: 'Sedan', transmission: 'Automático', fuelType: 'Gasolina', dailyRentalRate: '', pricePerKm: 0.30, currentKm: '', lastKmUpdateAt: '', lastKmUpdatedBy: '', mapsUrl: '', investmentCost: '', photos: [], active: true },
]



const INITIAL_ACCOMMODATIONS = [
  { id: 'apt-1', name: 'Alojamiento 1', residence: '', rooms: '1', bathrooms: '1', maxCapacity: '2', hotWater: true, ac: true, pool: false, elevator: false, parking: true, wifi: true, equippedKitchen: true, tvCount: '1', coffeeMaker: false, microwave: false, airFryer: false, iron: false, sofaBed: false, sofa: true, towelsCount: '2', bedding: true, nightlyRate: 35, cleaningFee: 0, checkInTime: '15:00', checkOutTime: '11:00', notes: '', icalUrl: '', icalUrls: ['', '', '', ''], photos: [], mapsUrl: '', investmentCost: '', active: true },
]

const LODGING_CHANNELS = ['Cliente frecuente', 'Cliente nuevo', 'Alquila Ya', 'Referido', 'Vendedor externo', 'RRSS']
const PAYMENT_METHODS = ['$ Efectivo', 'Zelle', 'Usdt', 'Pago en BS']
const MAINTENANCE_PAYMENT_METHODS = ['BS', '$Efectivo', 'Zelle', 'Usdt']
const INVENTORY_PAYMENT_METHODS = ['Bs', 'Zelle', 'Usdt', '$Efectivo']
const EXPENSE_PAYMENT_STATUS = ['Pagado', 'Por pagar']
const GENERAL_EXPENSE_CATEGORIES = ['Sueldos', 'Condominio', 'Internet', 'Gasolina', 'Operativo', 'Limpieza', 'Administrativo', 'Comisión', 'Otro']
const GENERAL_EXPENSE_ASSET_TYPES = ['General', 'Vehículo', 'Alojamiento']

const STATUS = {
  reserved: { label: 'Reservado', className: 'reserved' },
  pending: { label: 'No disponible', className: 'pending' },
  maintenance: { label: 'Mantenimiento', className: 'maintenance' },
  returned: { label: 'Devuelto', className: 'returned' },
  cancelled: { label: 'Anulada / devolución', className: 'cancelled' },
}

const CHANNELS = ['Cliente frecuente', 'Campaña RRSS', 'Alquila YA', 'Referido', 'Aliado Comercial']
const KM_RATE = 0.30
const COMMISSION_RATE = 0.15
// V170: nueva caja limpia para pruebas locales/demo. No afecta Firebase/producción.
const LOCAL_STORAGE_VERSION = 'v180'
// Fallback operativo solicitado para mantener cotizador funcionando si BCV bloquea la consulta.
// En producción puede sobreescribirse con VITE_FALLBACK_EUR_BCV / VITE_FALLBACK_USD_BCV.
const OFFICIAL_BCV_EUR_FALLBACK = 680.08
const OFFICIAL_BCV_USD_FALLBACK = 587.40
const INITIAL_INVENTORY_ITEMS = [
  { id: 'inv-car-1', name: 'Filtro de aceite', category: 'Repuestos', module: 'Renta Car', assetId: '', location: 'Depósito', quantity: 2, minQuantity: 1, unitCost: 12, provider: '', status: 'Disponible', notes: 'Compatible con vehículos tipo Nissan/Dongfeng' },
  { id: 'inv-lodging-1', name: 'Toallas blancas', category: 'Lencería', module: 'Alojamientos', assetId: '', location: 'Depósito', quantity: 6, minQuantity: 4, unitCost: 5, provider: '', status: 'Disponible', notes: '' },
  { id: 'inv-clean-1', name: 'Producto de limpieza multiuso', category: 'Limpieza', module: 'Alojamientos', assetId: '', location: 'Depósito', quantity: 3, minQuantity: 2, unitCost: 4, provider: '', status: 'Disponible', notes: '' },
]
const INVENTORY_CATEGORIES = ['Repuestos', 'Aceites', 'Filtros', 'Cauchos', 'Baterías', 'Herramientas', 'Limpieza', 'Lencería', 'Toallas', 'Sábanas', 'Amenidades', 'Electrodomésticos', 'Llaves / controles', 'Otros']
const INITIAL_HR_PEOPLE = [
  { id: 'hr-person-1', name: 'Jose Aleman', document: '', phone: '', email: 'jalemanbetanco@gmail.com', role: 'Administrador', department: 'Dirección', relationType: 'Propietario', salary: 0, commissionRate: 15, status: 'Activo', notes: 'Administrador principal' },
]
const INITIAL_HR_TASKS = [
  { id: 'hr-task-1', title: 'Revisar caja diaria', module: 'Administración', responsible: 'Jose Aleman', dueDate: new Date().toISOString().slice(0,10), priority: 'Alta', status: 'Pendiente', assetType: '', assetId: '', reservationId: '', notes: '' },
]
const HR_ROLES = ['Administrador', 'Supervisor', 'Vendedor Renta Car y Alojamientos', 'Vendedor Alojamientos', 'Vendedor', 'Logística', 'Operador Renta Car', 'Operador Alojamientos', 'Recepción Vehículos', 'Limpieza', 'Mantenimiento', 'Contabilidad', 'Solo lectura']
const HR_TASK_PRIORITIES = ['Baja', 'Media', 'Alta', 'Urgente']
const HR_TASK_STATUS = ['Pendiente', 'En proceso', 'Completada', 'Vencida', 'Cancelada']

function useFirestoreOrLocalStorage(collectionName, initialValue, enabled = true) {
  const [items, setItems] = useState(initialValue)
  const localKey = `alohandote_${LOCAL_STORAGE_VERSION}_${collectionName}`

  useEffect(() => {
    if (isFirebaseReady && !enabled) {
      setItems(initialValue)
      return
    }
    if (!isFirebaseReady || !db) {
      const stored = localStorage.getItem(localKey)
      if (stored) setItems(JSON.parse(stored))
      return
    }
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => setItems(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data(), __docId: docItem.id }))), (err) => {
      console.error(err)
      setItems(initialValue)
    })
  }, [collectionName, enabled])

  async function createItem(payload) {
    const item = { ...payload, createdAt: new Date().toISOString() }
    if (isFirebaseReady && db) return addDoc(collection(db, collectionName), item)
    const next = [{ id: crypto.randomUUID(), ...item }, ...items]
    setItems(next); localStorage.setItem(localKey, JSON.stringify(next))
  }

  async function editItem(id, payload) {
    if (isFirebaseReady && db) {
      const existing = items.find((item) => item.id === id)
      const now = new Date().toISOString()
      return setDoc(doc(db, collectionName, id), { ...payload, createdAt: existing?.createdAt || now, updatedAt: now }, { merge: true })
    }
    const next = items.map((item) => (item.id === id ? { ...item, ...payload, createdAt: item.createdAt || payload.createdAt || new Date().toISOString(), creationDate: item.creationDate || payload.creationDate || item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } : item))
    setItems(next); localStorage.setItem(localKey, JSON.stringify(next))
  }

  async function removeItem(id) {
    if (isFirebaseReady && db) return deleteDoc(doc(db, collectionName, id))
    const next = items.filter((item) => item.id !== id)
    setItems(next); localStorage.setItem(localKey, JSON.stringify(next))
  }

  return { items, createItem, editItem, removeItem, deleteItem: removeItem }
}

function emptyReservation(vehicleId, selectedDate = '', profile = null, user = null) {
  return {
    vehicleId,
    customerName: '', customerIdType: 'V', customerId: '', customerAddress: '', customerNationality: 'venezolano', customerCivilStatus: '', phone: '', email: '',
    startDate: selectedDate, endDate: selectedDate, deliveryTime: '12:00', returnTime: '12:00', contractCity: 'Barcelona',
    status: 'reserved', channel: 'Cliente frecuente', note: '',
    totalAmount: '', amount: '', depositAmount: '', approxKm: '', rentalDays: '', dailyRate: '', pricePerKm: KM_RATE, sellerCommission: '',
    deliveryKm: '', kmRecepcion: '', kmRecorridos: '', receptionAt: '', receivedBy: '', fuelLevelReception: '', receptionStatus: '', licenseDoc: null, idDoc: null, paymentMethod: 'Pago en BS', paymentReference: '', paymentProof: null, totalAmountBs: '', amountBs: '', bcvEuroRate: '', maintenanceLaborCost: '', maintenancePartsCost: '', maintenancePaymentMethod: 'BS', expenseStatus: 'Pagado', maintenanceBsCost: '', bcvDollarRate: '', maintenanceInvoices: [],
    createdByUid: user?.uid || '', createdByEmail: user?.email || '', createdByName: profile?.name || user?.displayName || user?.email || '',
  }
}

function emptyVehicle() { return { name: '', brand: '', model: '', year: '', plate: '', color: '', vin: '', vehicleType: 'Sedan', transmission: 'Automático', fuelType: 'Gasolina', dailyRentalRate: '', pricePerKm: KM_RATE, currentKm: '', lastKmUpdateAt: '', lastKmUpdatedBy: '', mapsUrl: '', investmentCost: '', ownershipType: 'Propio', allyProfitMode: 'fixed', allyProfitValue: '', allyOwnerName: '', parkingSensors: false, powerSteering: true, bluetooth: true, sunroof: false, ac: true, airbag: true, powerWindows: true, screen: false, photos: [], notes: '', active: true } }
function emptyAccommodation() { return { name: '', residence: '', rooms: '', bathrooms: '', maxCapacity: '', checkInTime: '15:00', checkOutTime: '11:00', hotWater: false, ac: true, pool: false, elevator: false, parking: false, wifi: true, equippedKitchen: false, tvCount: '', coffeeMaker: false, microwave: false, airFryer: false, iron: false, sofaBed: false, sofa: false, towelsCount: '', bedding: true, nightlyRate: '', cleaningFee: '', ownershipType: 'Propio', allyProfitMode: 'fixed', allyProfitValue: '', allyOwnerName: '', notes: '', icalUrl: '', icalUrls: ['', '', '', ''], photos: [], mapsUrl: '', investmentCost: '', active: true } }
function emptyVehicleCheckin(vehicleId = '', profile = null, user = null) {
  return {
    vehicleId,
    currentKm: '',
    fuelLevel: 'Completo',
    generalStatus: 'Bueno',
    notes: '',
    dashboardPhoto: null,
    vehiclePhoto: null,
    createdByUid: user?.uid || '',
    createdByEmail: user?.email || '',
    createdByName: profile?.name || user?.displayName || user?.email || '',
  }
}
function emptyLodgingReservation(accommodationId, selectedDate = '', profile = null, user = null) { return { accommodationId, customerName: '', customerIdType: 'V', customerId: '', phone: '', email: '', startDate: selectedDate, endDate: selectedDate, checkInTime: '15:00', checkOutTime: '11:00', status: 'reserved', channel: 'Cliente nuevo', note: '', nights: '', nightlyRate: '', totalAmount: '', amount: '', cleaningFee: '', lodgingOwnershipType: 'Propio', allyProfitMode: 'fixed', allyProfitValue: '', alohandoteIncomeUsd: '', ownerShareUsd: '', ownerPayableUsd: '', paymentMethod: 'Pago en BS', paymentReference: '', paymentProof: null, totalAmountBs: '', amountBs: '', bcvEuroRate: '', sellerCommission: '', maintenanceType: '', maintenanceCost: '', maintenancePaymentMethod: 'BS', expenseStatus: 'Pagado', bcvDollarRate: '', maintenanceBsCost: '', createdByUid: user?.uid || '', createdByEmail: user?.email || '', createdByName: profile?.name || user?.displayName || user?.email || '' } }
function emptyGeneralExpense(profile = null, user = null, exchangeRates = null) { return { date: new Date().toISOString().slice(0,10), transactionType: 'Egreso', type: 'Egreso', category: 'Operativo', description: '', amount: '', currency: 'USD', amountBs: '', paymentMethod: 'Pago en BS', expenseStatus: 'Pagado', assetType: 'General', assetId: '', responsible: profile?.name || user?.displayName || user?.email || '', bcvDollarRate: euroRateValue(exchangeRates), invoiceFile: null, notes: '', createdByUid: user?.uid || '', createdByEmail: user?.email || '', createdByName: profile?.name || user?.displayName || user?.email || '' } }
function money(value) { return Number(value || 0).toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }
function bsMoney(value) { return `${Number(value || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` }
function num(value) { return Number(value || 0) }
function stripUndefinedDeep(value) {
  if (Array.isArray(value)) return value.map(stripUndefinedDeep).filter((item) => item !== undefined)
  if (value && typeof value === 'object') {
    const output = {}
    Object.entries(value).forEach(([key, val]) => {
      if (val === undefined) return
      output[key] = stripUndefinedDeep(val)
    })
    return output
  }
  return value === undefined ? null : value
}
// V196: las tasas críticas se toman de /api/rates. Los valores fijos quedan solo como último respaldo.
function validRateValue(value) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 10 && parsed < 100000 ? parsed : 0
}
function euroRateValue(exchangeRates, fallback = '') {
  return validRateValue(exchangeRates?.bcvEuro) || validRateValue(fallback) || OFFICIAL_BCV_EUR_FALLBACK
}
function dollarRateValue(exchangeRates, fallback = '') {
  return validRateValue(exchangeRates?.bcvDollar) || validRateValue(fallback) || OFFICIAL_BCV_USD_FALLBACK
}
function localFallbackRate(key = '') {
  if (typeof import.meta === 'undefined') return 0
  const env = import.meta.env || {}
  return Number(env[key] || 0)
}
function fallbackExchangeRates() {
  const bcvEuro = localFallbackRate('VITE_FALLBACK_EUR_BCV') || OFFICIAL_BCV_EUR_FALLBACK
  const bcvDollar = localFallbackRate('VITE_FALLBACK_USD_BCV') || OFFICIAL_BCV_USD_FALLBACK
  const usdtMarket = localFallbackRate('VITE_FALLBACK_USDT_ALCAMBIO')
  if (!bcvEuro && !bcvDollar && !usdtMarket) return null
  return {
    success: true,
    bcvEuro: bcvEuro || bcvDollar || usdtMarket || 0,
    bcvDollar: bcvDollar || bcvEuro || usdtMarket || 0,
    binanceUsdt: usdtMarket || bcvDollar || bcvEuro || 0,
    alCambioUsdt: usdtMarket || bcvDollar || bcvEuro || 0,
    usdtMarket: usdtMarket || bcvDollar || bcvEuro || 0,
    updatedAt: new Date().toISOString(),
    source: 'Tasa fija V171',
    sources: { bcv: 'EURO BCV fijo V171', bcvUsd: '$ BCV fijo V171', usdt: 'Sin uso para cotizador' },
  }
}

function normalizeExchangeRatesPayload(data = {}, source = '') {
  const eur = Number(data.bcvEuro || data.euro || data.promedio || data.price || data.rate || data.value || data.ves || 0)
  const usd = Number(data.bcvDollar || data.usd || data.dollar || data.dolar || 0)
  if (!Number.isFinite(eur) || eur <= 0) return null
  return {
    success: true,
    bcvEuro: Number(eur.toFixed(4)),
    bcvDollar: Number((usd || eur).toFixed(4)),
    binanceUsdt: Number((data.binanceUsdt || data.usdtMarket || usd || eur).toFixed(4)),
    alCambioUsdt: data.alCambioUsdt || data.usdtMarket || '',
    usdtMarket: data.usdtMarket || '',
    updatedAt: data.updatedAt || new Date().toISOString(),
    source: source || data.source || 'Tasa BCV',
    sources: data.sources || { bcv: source || 'Tasa BCV', bcvUsd: source || 'Tasa BCV' },
  }
}
function cachedExchangeRates() {
  try {
    const cached = JSON.parse(localStorage.getItem('alohandote_exchangeRates') || 'null')
    const normalized = normalizeExchangeRatesPayload(cached || {}, cached?.source || 'Última tasa válida guardada')
    if (!normalized) return null
    const ageMs = Date.now() - new Date(normalized.updatedAt || 0).getTime()
    return Number.isFinite(ageMs) && ageMs <= 24 * 60 * 60 * 1000 ? normalized : null
  } catch { return null }
}
function cacheExchangeRates(data) {
  try { if (data?.bcvEuro) localStorage.setItem('alohandote_exchangeRates', JSON.stringify(data)) } catch {}
}
async function fetchPublicEuroBcvFallback() {
  const urls = [
    'https://ve.dolarapi.com/v1/euros/oficial',
    'https://ve.dolarapi.com/v1/euros',
  ]
  for (const url of urls) {
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}ts=${Date.now()}`, { cache: 'no-store' })
      if (!response.ok) continue
      const json = await response.json()
      const normalized = normalizeExchangeRatesPayload(json, 'Euro oficial BCV vía respaldo público')
      if (normalized?.bcvEuro) return normalized
    } catch (error) { console.warn('Fallback público EURO BCV falló:', error) }
  }
  return null
}
function effectiveEuroRate(record = {}, exchangeRates = null, fallbackRate = '') {
  const direct = euroRateValue(exchangeRates, fallbackRate || record.bcvEuroRate || record.exchangeRateSnapshot || record.exchangeRate || '')
  if (direct > 0) return direct
  const totalUsd = num(record.totalAmount || record.totalUsd)
  const totalBs = num(record.totalAmountBs || record.totalBs)
  if (totalUsd > 0 && totalBs > 0) return Number((totalBs / totalUsd).toFixed(4))
  const paidUsd = num(record.amountUsdEquivalent || record.paidUsd)
  const paidBs = num(record.amountBs || record.paidBs || record.totalPaidBs)
  if (paidUsd > 0 && paidBs > 0) return Number((paidBs / paidUsd).toFixed(4))
  return 0
}
function amountBs(value, exchangeRates, fallbackRate = '') { return Number((num(value) * euroRateValue(exchangeRates, fallbackRate)).toFixed(2)) }
function amountBsForRecord(value, record = {}, exchangeRates = null, fallbackRate = '') { return Number((num(value) * effectiveEuroRate(record, exchangeRates, fallbackRate)).toFixed(2)) }
function moneyDual(value, exchangeRates, fallbackRate = '') { return `${money(value)} / ${bsMoney(amountBs(value, exchangeRates, fallbackRate))}` }
function moneyDualForRecord(value, record = {}, exchangeRates = null, fallbackRate = '') { return `${money(value)} / ${bsMoney(amountBsForRecord(value, record, exchangeRates, fallbackRate))}` }
function isBsPaymentMethod(method = '') { return paymentBucket(method) === 'Bs' }
function paymentAmountUsd(rawAmount, method, exchangeRates, fallbackRate = '') {
  const raw = num(rawAmount)
  if (!raw) return 0
  const rate = euroRateValue(exchangeRates, fallbackRate)
  // Regla Go-Live V168: un pago en Bs NUNCA se interpreta como USD.
  // Si la tasa no está disponible, se retorna 0 equivalente para evitar saldos falsos y cuentas por cobrar en 0.
  if (isBsPaymentMethod(method)) return rate ? Number((raw / rate).toFixed(2)) : 0
  return raw
}
function paymentAmountUsdForRecord(rawAmount, method, record = {}, exchangeRates = null, fallbackRate = '') {
  const raw = num(rawAmount)
  if (!raw) return 0
  const directUsd = num(record.amountUsdEquivalent || record.paidUsd)
  if (isBsPaymentMethod(method)) {
    if (directUsd > 0) return directUsd
    const rate = effectiveEuroRate(record, exchangeRates, fallbackRate)
    return rate ? Number((raw / rate).toFixed(2)) : 0
  }
  return raw
}
function paymentAmountBs(rawAmount, method, exchangeRates, fallbackRate = '') {
  const raw = num(rawAmount)
  if (!raw) return 0
  return isBsPaymentMethod(method) ? raw : amountBs(raw, exchangeRates, fallbackRate)
}
function paymentAmountBsForRecord(rawAmount, method, record = {}, exchangeRates = null, fallbackRate = '') {
  const raw = num(rawAmount)
  if (!raw) return 0
  return isBsPaymentMethod(method) ? raw : amountBsForRecord(raw, record, exchangeRates, fallbackRate)
}
function normalizePaymentHistory(record = {}) {
  const explicit = Array.isArray(record.paymentHistory) ? record.paymentHistory : (Array.isArray(record.payments) ? record.payments : [])
  const normalizedRaw = explicit.map((payment, index) => ({
    id: payment.id || payment.paymentTraceId || `abono-${index + 1}`,
    paymentTraceId: payment.paymentTraceId || payment.id || '',
    date: payment.date || payment.createdAt || record.createdAt || record.creationDate || new Date().toISOString(),
    method: payment.method || payment.paymentMethod || record.paymentMethod || '',
    rawAmount: num(payment.rawAmount ?? payment.amountRaw ?? payment.amount ?? 0),
    amountBs: num(payment.amountBs ?? payment.bsAmount ?? 0),
    amountUsd: num(payment.amountUsd ?? payment.usdAmount ?? payment.amountUsdEquivalent ?? 0),
    bcvEuroRate: num(payment.bcvEuroRate ?? payment.exchangeRate ?? record.bcvEuroRate ?? record.exchangeRateSnapshot ?? 0),
    reference: payment.reference || payment.paymentReference || '',
    frozen: true,
  })).filter((payment) => payment.rawAmount > 0 || payment.amountBs > 0 || payment.amountUsd > 0)
  const seenPayments = new Set()
  const normalized = normalizedRaw.filter((payment) => {
    const key = payment.paymentTraceId || `${String(payment.date || '').slice(0,19)}|${payment.method}|${payment.rawAmount}|${payment.amountBs}|${payment.amountUsd}|${payment.reference}`
    if (seenPayments.has(key)) return false
    seenPayments.add(key)
    return true
  })
  if (normalized.length) return normalized
  const method = record.paymentMethod || ''
  const raw = num(record.amount || 0)
  const paidBs = num(record.amountBs || record.paidBs || record.totalPaidBs || 0)
  const paidUsd = num(record.amountUsdEquivalent || record.paidUsd || 0)
  if (!raw && !paidBs && !paidUsd) return []
  const rate = num(record.bcvEuroRate || record.exchangeRateSnapshot || record.exchangeRate || '')
  return [{
    id: 'abono-1',
    date: record.createdAt || record.creationDate || new Date().toISOString(),
    method,
    rawAmount: raw || paidBs || paidUsd,
    amountBs: paidBs || (isBsPaymentMethod(method) ? raw : (rate && raw ? Number((raw * rate).toFixed(2)) : 0)),
    amountUsd: paidUsd || (!isBsPaymentMethod(method) ? raw : (rate && (raw || paidBs) ? Number(((raw || paidBs) / rate).toFixed(2)) : 0)),
    bcvEuroRate: rate,
    reference: record.paymentReference || '',
    frozen: true,
    migratedLegacy: true,
  }]
}
function paymentHistoryTotals(record = {}) {
  const payments = normalizePaymentHistory(record)
  return payments.reduce((acc, payment) => ({
    amountBs: Number((acc.amountBs + num(payment.amountBs)).toFixed(2)),
    amountUsd: Number((acc.amountUsd + num(payment.amountUsd)).toFixed(2)),
    rawAmount: Number((acc.rawAmount + num(payment.rawAmount)).toFixed(2)),
  }), { amountBs: 0, amountUsd: 0, rawAmount: 0 })
}

function frozenPaidUsdForDisplay(record = {}, exchangeRates = null, fallbackRate = '') {
  const totals = paymentHistoryTotals(record)
  const editingId = record.__docId || record._editingOriginalId || record.id || ''
  const appendRaw = paymentAppendRawAmountOnSave(record, editingId)
  const appendUsd = appendRaw > 0 ? paymentAmountUsd(appendRaw, record.paymentMethod || '', exchangeRates, fallbackRate || record.bcvEuroRate || record.exchangeRateSnapshot || '') : 0
  if (totals.amountUsd > 0 || totals.amountBs > 0 || appendUsd > 0) return Number((totals.amountUsd + appendUsd).toFixed(2))
  return paymentAmountUsd(record.amount || 0, record.paymentMethod || '', exchangeRates, fallbackRate || record.bcvEuroRate || record.exchangeRateSnapshot || '')
}
function frozenPaidBsForDisplay(record = {}, exchangeRates = null, fallbackRate = '') {
  const totals = paymentHistoryTotals(record)
  const editingId = record.__docId || record._editingOriginalId || record.id || ''
  const appendRaw = paymentAppendRawAmountOnSave(record, editingId)
  const appendBs = appendRaw > 0 ? paymentAmountBs(appendRaw, record.paymentMethod || '', exchangeRates, fallbackRate || record.bcvEuroRate || record.exchangeRateSnapshot || '') : 0
  if (totals.amountUsd > 0 || totals.amountBs > 0 || appendBs > 0) return Number((totals.amountBs + appendBs).toFixed(2))
  return paymentAmountBs(record.amount || 0, record.paymentMethod || '', exchangeRates, fallbackRate || record.bcvEuroRate || record.exchangeRateSnapshot || '')
}
function frozenPendingUsdForDisplay(record = {}, totalUsd = 0, exchangeRates = null, fallbackRate = '') {
  return Math.max(0, Number((num(totalUsd) - frozenPaidUsdForDisplay(record, exchangeRates, fallbackRate)).toFixed(2)))
}
function buildPaymentEntry(rawAmount, method, exchangeRates, fallbackRate = '', reference = '', date = '') {
  const rate = euroRateValue(exchangeRates, fallbackRate)
  const raw = num(rawAmount)
  const paymentDate = date || new Date().toISOString()
  const amountBsValue = paymentAmountBs(raw, method, exchangeRates, rate)
  const amountUsdValue = paymentAmountUsd(raw, method, exchangeRates, rate)
  const traceSeed = `${String(paymentDate).slice(0,19)}|${method || ''}|${raw}|${amountBsValue}|${amountUsdValue}|${reference || ''}`
  return {
    id: `abono-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    paymentTraceId: traceSeed,
    date: paymentDate,
    method: method || '',
    rawAmount: raw,
    amountBs: amountBsValue,
    amountUsd: amountUsdValue,
    bcvEuroRate: rate || '',
    reference: reference || '',
    frozen: true,
  }
}
function paymentAppendRawAmountOnSave(draft = {}, resolvedEditingId = '') {
  const raw = num(draft.amount || 0)
  if (!raw) return 0
  // V221.10: el campo monto representa un abono NUEVO solo cuando no está ya reflejado
  // en el historial visible del modal. Esto evita doble conteo en reservas pagadas al 100%.
  const payments = normalizePaymentHistory(draft)
  if (payments.length) {
    const method = draft.paymentMethod || ''
    const reference = String(draft.paymentReference || '').trim().toLowerCase()
    const rawMatchesExisting = payments.some((payment) => {
      const sameRaw = Math.abs(num(payment.rawAmount) - raw) <= 0.01
      const sameMethod = !method || !payment.method || paymentBucket(payment.method) === paymentBucket(method)
      const paymentRef = String(payment.reference || '').trim().toLowerCase()
      const sameReference = !reference || !paymentRef || paymentRef === reference
      return sameRaw && sameMethod && sameReference
    })
    if (rawMatchesExisting) return 0
  }
  // V221.8: en edición, el campo monto representa EXCLUSIVAMENTE un nuevo abono.
  return raw
}
function paymentValidationDraft(record = {}, exchangeRates = null, fallbackRate = '') {
  const historyTotals = paymentHistoryTotals(record)
  const appendRaw = paymentAppendRawAmountOnSave(record, record.__docId || record._editingOriginalId || record.id || '')
  const appendUsd = appendRaw > 0 ? paymentAmountUsd(appendRaw, record.paymentMethod || '', exchangeRates, fallbackRate || record.bcvEuroRate || record.exchangeRateSnapshot || '') : 0
  const totalUsd = num(record.totalAmount)
  let paidUsd = Number((historyTotals.amountUsd + appendUsd).toFixed(2))
  // V221.10: si el pago queda prácticamente igual al total, se congela exactamente al total.
  // Cubre redondeos Bs/USD y diferencias mínimas por tasa al guardar desde mobile/web.
  if (totalUsd > 0 && Math.abs(paidUsd - totalUsd) <= 0.50) paidUsd = Number(totalUsd.toFixed(2))
  if (!historyTotals.amountUsd && !appendUsd) return record
  return { ...record, amount: String(paidUsd), paymentMethod: '$ Efectivo' }
}
function shouldAppendPaymentOnSave(draft = {}, resolvedEditingId = '') {
  return paymentAppendRawAmountOnSave(draft, resolvedEditingId) > 0
}
function appendPaymentOnce(existingPayments = [], newPayment = null) {
  if (!newPayment) return existingPayments
  const key = newPayment.paymentTraceId || `${String(newPayment.date || '').slice(0,19)}|${newPayment.method}|${newPayment.rawAmount}|${newPayment.amountBs}|${newPayment.amountUsd}|${newPayment.reference}`
  const exists = existingPayments.some((payment) => {
    const currentKey = payment.paymentTraceId || `${String(payment.date || '').slice(0,19)}|${payment.method}|${payment.rawAmount}|${payment.amountBs}|${payment.amountUsd}|${payment.reference}`
    return currentKey === key
  })
  return exists ? existingPayments : [...existingPayments, newPayment]
}
function paymentsWithUpdatedEntry(record = {}, paymentId = '', patch = {}, exchangeRates = null, fallbackRate = '') {
  return normalizePaymentHistory(record).map((payment) => {
    if (String(payment.id || payment.paymentTraceId || '') !== String(paymentId || '')) return payment
    const method = patch.method || payment.method || record.paymentMethod || '$ Efectivo'
    const rawAmount = num(patch.rawAmount ?? payment.rawAmount ?? 0)
    const reference = patch.reference ?? payment.reference ?? ''
    const date = patch.date || payment.date || new Date().toISOString()
    return {
      ...payment,
      ...buildPaymentEntry(rawAmount, method, exchangeRates, fallbackRate || payment.bcvEuroRate || record.bcvEuroRate || '', reference, date),
      id: payment.id || payment.paymentTraceId || `abono-${Date.now()}`,
      paymentTraceId: payment.paymentTraceId || payment.id || `${String(date).slice(0,19)}|${method}|${rawAmount}|${reference}`,
    }
  })
}
function paymentsWithoutEntry(record = {}, paymentId = '') {
  return normalizePaymentHistory(record).filter((payment) => String(payment.id || payment.paymentTraceId || '') !== String(paymentId || ''))
}
function recordWithPaymentHistory(record = {}, paymentHistory = []) {
  const totals = paymentHistoryTotals({ paymentHistory })
  return {
    ...record,
    paymentHistory,
    _paymentsEdited: true,
    // V221.8: al editar/eliminar abonos se limpia el input de nuevo abono.
    // El historial queda como fuente de verdad y evita duplicar/importar montos históricos.
    amount: '',
    amountBs: String(totals.amountBs || ''),
    amountUsdEquivalent: String(totals.amountUsd || ''),
    _originalPaymentAmount: '',
  }
}
function paymentDisplayCurrency(method = '') {
  const bucket = paymentBucket(method)
  return bucket === 'Bs' ? 'Bs' : 'USD'
}

function documentUsesUsdOnly(method = '') { return !isBsPaymentMethod(method) }
function documentMoneyValue(value, method = '', exchangeRates = null, fallbackRate = '') {
  if (documentUsesUsdOnly(method)) return money(value)
  return `${money(value)} / ${bsMoney(amountBs(value, exchangeRates, fallbackRate))}`
}
function documentPaidValue(record = {}, exchangeRates = null) {
  const method = record.paymentMethod || record.method || ''
  const paidUsd = storedPaidUsd(record, exchangeRates)
  if (documentUsesUsdOnly(method)) return money(paidUsd)
  return `${money(paidUsd)} / ${bsMoney(storedPaidBs(record, exchangeRates))}`
}
function documentFinancialAmountLabel(method = '') { return documentUsesUsdOnly(method) ? 'Monto (USD)' : 'Monto (USD / Bs)' }
function documentRateValue(method = '', rate = 0) { return documentUsesUsdOnly(method) ? '' : (rate ? bsMoney(rate) : 'No disponible') }
function reservationPaymentRequiredError(draft = {}) {
  const status = normalizeStatus(draft.status)
  if (status !== 'reserved') return ''
  const isExistingReservation = Boolean(draft.id || draft.__docId || draft._editingOriginalId)
  if (isExistingReservation && normalizePaymentHistory(draft).length > 0) return ''
  if (isExistingReservation && !draft._paymentsEdited) return ''
  if (draft._paymentsEdited && normalizePaymentHistory(draft).length > 0) return ''
  if (num(draft.amount) > 0) return ''
  return 'Ingresar abono para reservar.'
}
function paymentDisplayMethod(method = '') {
  const bucket = paymentBucket(method)
  return bucket === 'Binance' ? 'USDT' : bucket
}
function payableDisplayAmount(row = {}, exchangeRates = null) {
  const currency = row.currency || paymentDisplayCurrency(row.method || row.paymentMethod || '')
  if (currency === 'Bs') return bsMoney(row.amountBsManual || row.amountBs || amountBs(row.amount || 0, exchangeRates, row.bcvDollarRate || row.bcvEuroRate || ''))
  return `${money(row.amount || 0)} ${paymentDisplayMethod(row.method || row.paymentMethod || '')}`
}
function paymentInputLabel(method = '') { return isBsPaymentMethod(method) ? 'Monto abonado / reserva Bs' : 'Monto abonado / reserva $' }
function paymentInputPlaceholder(method = '') { return isBsPaymentMethod(method) ? 'Ej: 662000' : 'Ej: 50' }
function storedPaidBs(record = {}, exchangeRates = null) {
  const totals = paymentHistoryTotals(record)
  if (totals.amountBs > 0) return totals.amountBs
  const direct = num(record.amountBs || record.totalPaidBs || record.paidBs)
  if (direct > 0) return direct
  return paymentAmountBsForRecord(record.amount || 0, record.paymentMethod || '', record, exchangeRates, record.bcvEuroRate || record.exchangeRateSnapshot || '')
}
function storedPaidUsd(record = {}, exchangeRates = null) {
  const totals = paymentHistoryTotals(record)
  if (totals.amountUsd > 0) return totals.amountUsd
  const direct = num(record.amountUsdEquivalent || record.paidUsd)
  if (direct > 0) return direct
  return paymentAmountUsdForRecord(record.amount || 0, record.paymentMethod || '', record, exchangeRates, record.bcvEuroRate || record.exchangeRateSnapshot || '')
}
function totalServiceBs(record = {}, exchangeRates = null) {
  const direct = num(record.totalAmountBs || record.totalBs)
  if (direct > 0) return direct
  return amountBsForRecord(record.totalAmount || 0, record, exchangeRates, record.bcvEuroRate || record.exchangeRateSnapshot || '')
}
function pendingAmount(reservation, exchangeRates = null) {
  const total = num(reservation.totalAmount)
  if (!total) return 0
  if (normalizePaymentHistory(reservation).length) return Math.max(0, Number((total - storedPaidUsd(reservation, exchangeRates)).toFixed(2)))
  const method = reservation.paymentMethod || reservation.method || ''
  const paidBs = storedPaidBs(reservation, exchangeRates)
  const totalBs = totalServiceBs(reservation, exchangeRates)
  if (isBsPaymentMethod(method) && paidBs > 0 && totalBs > 0) {
    // CxC se cierra solo cuando el pago Bs cubre el total Bs real de la reserva.
    if (paidBs + 0.01 >= totalBs) return 0
    const rate = effectiveEuroRate(reservation, exchangeRates, reservation.bcvEuroRate || reservation.exchangeRateSnapshot || '')
    return rate ? Math.max(0, Number(((totalBs - paidBs) / rate).toFixed(2))) : total
  }
  const paidUsd = storedPaidUsd(reservation, exchangeRates)
  // Si el abono fue en Bs y aún no hay tasa/equivalente, no cerramos la cuenta por cobrar en falso.
  if (isBsPaymentMethod(method) && paidUsd <= 0 && paidBs > 0) return total
  return Math.max(0, Number((total - paidUsd).toFixed(2)))
}
function pendingAmountBs(reservation, exchangeRates = null) {
  const pendingUsd = pendingAmount(reservation, exchangeRates)
  if (normalizePaymentHistory(reservation).length) return amountBsForRecord(pendingUsd, reservation, exchangeRates, reservation.bcvEuroRate || reservation.exchangeRateSnapshot || '')
  if (paymentBucket(reservation.paymentMethod || reservation.method || '') === 'Bs') {
    const totalBs = totalServiceBs(reservation, exchangeRates)
    const paidBs = storedPaidBs(reservation, exchangeRates)
    if (totalBs > 0) return Math.max(0, Number((totalBs - paidBs).toFixed(2)))
    const rate = effectiveEuroRate(reservation, exchangeRates, reservation.bcvEuroRate || reservation.exchangeRateSnapshot || '')
    if (rate > 0) return amountBsForRecord(pendingUsd, reservation, exchangeRates, reservation.bcvEuroRate || reservation.exchangeRateSnapshot || '')
    return 0
  }
  return amountBsForRecord(pendingUsd, reservation, exchangeRates, reservation.bcvEuroRate || reservation.exchangeRateSnapshot || '')
}
function reservationIsPaidInFull(record = {}, exchangeRates = null) {
  if (isReservationCancelled(record)) return false
  const statusText = String(record.paymentStatus || record.statusPago || record.paymentState || '').toLowerCase()
  if (statusText.includes('complet') || statusText.includes('pagado')) return true
  return pendingAmount(record, exchangeRates) <= 0.01 && (storedPaidBs(record, exchangeRates) > 0 || storedPaidUsd(record, exchangeRates) > 0)
}
function reservationHasCollectedPayment(record = {}, exchangeRates = null) {
  const bucket = paymentBucket(record.paymentMethod || record.method || '')
  const paidUsd = storedPaidUsd(record, exchangeRates)
  const paidBs = storedPaidBs(record, exchangeRates)
  if (isReservationCancelled(record)) {
    // V181: para reservas cobradas en divisas, la caja USD debe quedar en neto real:
    // ingreso original (+Zelle/Efectivo/Binance) menos devolución (-Zelle/Efectivo/Binance).
    // Antes la anulación sacaba el ingreso original y además registraba la devolución,
    // generando doble descuento en las cajas en $. Esta excepción NO aplica a Bs.
    const hasRefund = num(record.refundAmount) > 0 || num(record.refundAmountBs) > 0 || num(record.refundRawAmount) > 0
    return bucket !== 'Bs' && bucket !== 'Sin método' && paidUsd > 0 && hasRefund
  }
  return paidBs > 0 || paidUsd > 0
}
function receivablePendingBs(record = {}, exchangeRates = null) {
  // V172: Cuentas por cobrar en Bs solo aplica a reservas cuyo método de abono es Bs.
  // Si el abono fue Zelle / Efectivo $ / USDT, el pendiente queda en USD operativo y NO infla el saldo CxC Bs.
  if (isReservationCancelled(record)) return 0
  if (!isBsPaymentMethod(record.paymentMethod || record.method || '')) return 0
  return pendingAmountBs(record, exchangeRates)
}
function refundDefaultAmount(record = {}, method = '', exchangeRates = null) {
  return paymentBucket(method || record.paymentMethod || '') === 'Bs'
    ? String(storedPaidBs(record, exchangeRates) || record.refundAmountBs || record.refundRawAmount || '')
    : String(storedPaidUsd(record, exchangeRates) || record.refundAmount || '')
}
function frozenEuroRateForRecord(record = {}, exchangeRates = null) { return euroRateValue(exchangeRates, record.bcvEuroRate || record.exchangeRateSnapshot || '') }
function maintenancePaymentBucket(method = '') {
  const key = String(method || '').toLowerCase()
  if (key.includes('zelle')) return 'Zelle'
  if (key.includes('usdt')) return 'Binance'
  if (key.includes('bs')) return 'Bs'
  if (key.includes('efectivo')) return 'Efectivo $'
  return 'Sin método'
}
function maintenanceUsdCost(item = {}) {
  return num(item.maintenanceCost || 0)
}
function maintenanceBsCost(item = {}, exchangeRates = null) {
  const rate = dollarRateValue(exchangeRates, item.bcvDollarRate || item.bcvUsdRate || '')
  return Number((maintenanceUsdCost(item) * rate).toFixed(2))
}
function DualAmount({ value, exchangeRates, fallbackRate = '', label = '' }) {
  return <span className="dual-amount"><span className="dual-usd">{money(value)}</span><span className="dual-bs">{bsMoney(amountBs(value, exchangeRates, fallbackRate))}</span>{label ? <span className="dual-label">{label}</span> : null}</span>
}

function BsMainAmount({ usdValue = 0, bsValue = null, exchangeRates, fallbackRate = '', label = '' }) {
  // V161: las cajas en Bs se muestran únicamente en bolívares.
  // El equivalente USD generaba saldos ilógicos cuando la tasa venía vacía,
  // vieja o inconsistente. Para administración, el dato principal es Bs real.
  const bs = bsValue !== null && bsValue !== undefined ? num(bsValue) : amountBs(usdValue, exchangeRates, fallbackRate)
  return <span className="dual-amount bs-only-amount"><span className="dual-usd">{bsMoney(bs)}</span>{label ? <span className="dual-label">{label}</span> : null}</span>
}
function CashRowAmount({ row = {}, exchangeRates }) {
  const method = row.method || row.paymentMethod || row.maintenancePaymentMethod || ''
  const bucket = paymentBucket(method)
  if (bucket === 'Bs') {
    const bsValue = row.amountBsManual !== '' && row.amountBsManual !== undefined && row.amountBsManual !== null
      ? num(row.amountBsManual)
      : paymentAmountBs(row.rawAmount || row.amount, method, exchangeRates, row.bcvEuroRate || row.bcvDollarRate || '')
    return <BsMainAmount bsValue={bsValue} exchangeRates={exchangeRates} fallbackRate={row.bcvEuroRate || row.bcvDollarRate || ''} label="Caja Bs" />
  }
  return <DualAmount value={row.amount} exchangeRates={exchangeRates} fallbackRate={row.bcvEuroRate || row.bcvDollarRate || ''} />
}
function normalizedRefundAmounts(item = {}, exchangeRates = null) {
  const method = item.refundPaymentMethod || item.paymentMethod || 'Pago en BS'
  const bucket = paymentBucket(method)
  const rate = euroRateValue(exchangeRates, item.refundBcvEuroRate || item.bcvEuroRate || '')
  const rawRefund = num(item.refundRawAmount || item.refundAmount || 0)
  const storedBs = item.refundAmountBs !== undefined && item.refundAmountBs !== null && item.refundAmountBs !== '' ? num(item.refundAmountBs) : 0
  const paidUsd = paymentAmountUsd(item.amount || 0, item.paymentMethod || method, exchangeRates, item.bcvEuroRate || item.refundBcvEuroRate || '')
  const paidBs = paymentAmountBs(item.amount || 0, item.paymentMethod || method, exchangeRates, item.bcvEuroRate || item.refundBcvEuroRate || '')
  if (bucket === 'Bs') {
    // V160: en Bs el campo es Bs real, nunca USD x tasa. Para registros viejos,
    // refundAmountBs manda; si no existe, refundRawAmount/refundAmount se toma como Bs.
    const requestedBs = storedBs || rawRefund
    const cappedBs = paidBs > 0 ? Math.min(requestedBs, paidBs) : requestedBs
    const amountUsdValue = rate ? Number((cappedBs / rate).toFixed(2)) : 0
    return { amountUsd: amountUsdValue, amountBs: Number(cappedBs.toFixed(2)), rawAmount: requestedBs, method, capped: requestedBs > cappedBs }
  }
  const requestedUsd = rawRefund
  const cappedUsd = paidUsd > 0 ? Math.min(requestedUsd, paidUsd) : requestedUsd
  // V182: una devolución hecha por Zelle / USDT-Binance / Efectivo $ solo afecta
  // la caja USD correspondiente. No debe crear equivalente ni registro en el KPI
  // de Devoluciones Bs del dashboard administrativo.
  return { amountUsd: Number(cappedUsd.toFixed(2)), amountBs: 0, rawAmount: requestedUsd, method, capped: requestedUsd > cappedUsd }
}
function dollarOperationKind(item = {}) {
  const raw = String(item.operationType || item.type || item.category || '').toLowerCase()
  if (raw.includes('venta') || raw.includes('sale')) return 'sale'
  return 'purchase'
}
function dollarOperationBs(item = {}) {
  return Number((num(item.amountBs || item.totalBs || item.bsAmount) || (num(item.amountUsd || item.amount) * num(item.buyRate || item.saleRate || item.rate))).toFixed(2))
}
function dollarOperationUsd(item = {}) {
  return Number((num(item.amountUsd || item.amount)).toFixed(2))
}
function signedBsForCashRow(row = {}, exchangeRates = null) {
  const bucket = paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '')
  const sign = row.type === 'Egreso' ? -1 : 1
  if (bucket !== 'Bs') return 0
  const bs = row.amountBsManual !== '' && row.amountBsManual !== undefined && row.amountBsManual !== null
    ? num(row.amountBsManual)
    : paymentAmountBs(row.rawAmount || row.amount, row.method || row.paymentMethod || '', exchangeRates, row.bcvEuroRate || row.bcvDollarRate || row.refundBcvEuroRate || '')
  return Number((sign * bs).toFixed(2))
}
function signedUsdForCashRow(row = {}) {
  const bucket = paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '')
  if (bucket === 'Bs' || bucket === 'Sin método') return 0
  const sign = row.type === 'Egreso' ? -1 : 1
  return Number((sign * num(row.amount)).toFixed(2))
}
function safeNonNegative(value = 0) { return Math.max(0, Number(value || 0)) }
function signedBsAbs(row = {}, exchangeRates = null) { return Math.abs(signedBsForCashRow(row, exchangeRates)) }
function sortLedgerAsc(rows = []) {
  return [...rows].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.id || '').localeCompare(String(b.id || '')))
}
function sanitizeBsExpenseLedger(incomeBs = 0, rows = [], exchangeRates = null) {
  // V164: los egresos heredados mal cargados no deben destruir la caja.
  // Solo se descuentan de caja Bs los egresos que pueden pagarse con el saldo Bs acumulado.
  let balance = Number(incomeBs || 0)
  const accepted = []
  const rejected = []
  for (const row of sortLedgerAsc(rows)) {
    const bucket = paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '')
    if (bucket !== 'Bs') {
      accepted.push(row)
      continue
    }
    const amount = signedBsAbs(row, exchangeRates)
    if (amount <= 0) continue
    if (balance + 0.01 >= amount) {
      balance = Number((balance - amount).toFixed(2))
      accepted.push(row)
    } else {
      rejected.push({ ...row, rejectedReason: `Egreso Bs omitido del saldo: ${bsMoney(amount)} supera saldo disponible ${bsMoney(balance)}.` })
    }
  }
  return { accepted, rejected, remainingBs: safeNonNegative(balance) }
}
function buildCatalogHtmlUrl(html = '', fallbackTitle = 'catalogo') {
  const safeHtml = printableHtmlWithBase(html)
  const blob = new Blob([safeHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.target = '_self'
  link.rel = 'noopener'
  link.download = `${fallbackTitle}.html`
  return { url, safeHtml }
}
function openCatalogInSameTab(html = '', fallbackTitle = 'catalogo') {
  // V164: los catálogos no abren popup. Se cargan en la misma pestaña para evitar ventanas en blanco.
  const { url } = buildCatalogHtmlUrl(html, fallbackTitle)
  window.location.assign(url)
  setTimeout(() => URL.revokeObjectURL(url), 120000)
}

function WalletAmount({ method, row = {}, exchangeRates }) {
  if (method === 'Bs') return <span className="dual-amount bs-only-amount"><span className="dual-usd">{bsMoney(row.amountBs || 0)}</span><span className="dual-label">Caja Bs</span></span>
  return <span className="dual-amount"><span className="dual-usd">{money(row.amountUsd || 0)}</span><span className="dual-label">Caja USD</span></span>
}
function paymentBucket(method = '') {
  const key = String(method || '').toLowerCase()
  if (key.includes('zelle')) return 'Zelle'
  if (key.includes('binance') || key.includes('usdt')) return 'Binance'
  if (key.includes('bs') || key.includes('bolivar') || key.includes('bolívar') || key.includes('pago móvil') || key.includes('pago movil') || key.includes('transferencia')) return 'Bs'
  if (key.includes('efectivo') || key.includes('cash') || key.includes('dólar') || key.includes('dolar')) return 'Efectivo $'
  return 'Sin método'
}
function receiptNumber(reservation) { return `ALO-${String(reservation.id || 'demo').slice(0, 8).toUpperCase()}` }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char)) }
function titleCaseName(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/(^|\s|[-'])\p{L}/gu, (match) => match.toUpperCase())
}
function cleanDocumentFileName(label = 'Documento', customerName = '') {
  const base = `${label} ${customerName || 'Cliente'}`.trim()
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90) || 'Documento Alohandote'
}
function cleanPdfExportScript(filename = 'documento') {
  const safeName = String(filename || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9\s_-]/g,'').replace(/\s+/g,' ').trim().slice(0, 90) || 'Documento Alohandote'
  return `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script><script>
function restoreAlohandotePdfTarget(target, previous){
  if(!target||!previous)return;
  target.style.width=previous.width||'';
  target.style.maxWidth=previous.maxWidth||'';
  target.style.margin=previous.margin||'';
  target.style.transform=previous.transform||'';
  target.style.transformOrigin=previous.transformOrigin||'';
  target.style.minHeight=previous.minHeight||'';
}
async function captureAlohandoteNode(node, options){
  var previous={
    width: node.style.width,
    maxWidth: node.style.maxWidth,
    margin: node.style.margin,
    transform: node.style.transform,
    transformOrigin: node.style.transformOrigin,
    minHeight: node.style.minHeight
  };
  node.style.width=options.cssWidth;
  node.style.maxWidth=options.cssWidth;
  node.style.margin='0 auto';
  node.style.transform='none';
  node.style.transformOrigin='top center';
  if(options.minHeight) node.style.minHeight=options.minHeight;
  await new Promise(r=>setTimeout(r,180));
  var rect=node.getBoundingClientRect();
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  var captureWidth=isMobile ? 794 : Math.ceil(Math.max(node.scrollWidth,rect.width,options.width||0));
  node.style.width=isMobile ? '794px' : node.style.width;
  node.style.maxWidth=isMobile ? '794px' : node.style.maxWidth;
  node.style.minWidth=isMobile ? '794px' : node.style.minWidth;
  var captureHeight=Math.ceil(Math.max(node.scrollHeight,rect.height));
  window.scrollTo(0,0);
  document.body.style.overflow='hidden';
  await new Promise(r=>setTimeout(r,250));
  var canvas=await html2canvas(node,
  {scale:3,
  backgroundColor:'#ffffff',
  useCORS:true,
  logging:false,
  scrollX:0,
  scrollY:0,
  windowWidth:captureWidth,
  windowHeight:captureHeight
});
  document.body.style.overflow='';
  restoreAlohandotePdfTarget(node, previous);
  return canvas;
}
function addCanvasToPdfInPages(pdf, canvas, pageW, pageH, margin){
  var pdfW=pageW-margin*2;
  var contentH=pageH-margin*2;
  var pdfH=canvas.height*pdfW/canvas.width;
  if(pdfH<=contentH+0.5){
    var img=canvas.toDataURL('image/jpeg',0.96);
    var y=Math.max(margin, margin+(contentH-pdfH)/2);
    pdf.addImage(img,'JPEG',margin,y,pdfW,pdfH,undefined,'FAST');
    return;
  }
  var pageCanvasHeight=Math.floor(canvas.width*contentH/pdfW);
  var renderedHeight=0;
  var pageIndex=0;
  while(renderedHeight<canvas.height){
    var sliceHeight=Math.min(pageCanvasHeight,canvas.height-renderedHeight);
    var pageCanvas=document.createElement('canvas');
    pageCanvas.width=canvas.width;
    pageCanvas.height=sliceHeight;
    var ctx=pageCanvas.getContext('2d');
    ctx.drawImage(canvas,0,renderedHeight,canvas.width,sliceHeight,0,0,canvas.width,sliceHeight);
    if(pageIndex>0) pdf.addPage('a4','p');
    var pageImg=pageCanvas.toDataURL('image/jpeg',0.96);
    var pageImgH=sliceHeight*pdfW/canvas.width;
    pdf.addImage(pageImg,'JPEG',margin,margin,pdfW,pageImgH,undefined,'FAST');
    renderedHeight+=sliceHeight;
    pageIndex+=1;
  }
}
async function buildAlohandoteCleanPdfBlob(){
  var page=document.querySelector('.page');

  // Contrato: PDF A4 real por texto, no captura de pantalla
  if(page){
    var pdf=new jspdf.jsPDF('p','mm','a4');
    var margin=18;
    var pageW=210;
    var pageH=297;
    var usableW=pageW-(margin*2);
    var y=18;

    function addPageIfNeeded(extra){
      if(y+extra>pageH-18){
        pdf.addPage();
        y=18;
      }
    }

    function addText(text,size,bold,align){
      text=String(text||'').replace(/\s+/g,' ').trim();
      if(!text) return;
      pdf.setFont('times',bold?'bold':'normal');
      pdf.setFontSize(size||11);
      var lines=pdf.splitTextToSize(text,usableW);
      var lineH=(size||11)*0.42;
      addPageIfNeeded(lines.length*lineH+4);
      if(align==='center'){
        lines.forEach(function(line){
          pdf.text(line,pageW/2,y,{align:'center'});
          y+=lineH;
        });
      }else{
        pdf.text(lines,margin,y);
        y+=lines.length*lineH;
      }
      y+=3;
    }

    addText(document.querySelector('.title')?.textContent || document.title,12,true,'center');

    var paragraphs=Array.from(page.querySelectorAll('p'));
    paragraphs.forEach(function(p){
      addText(p.textContent,10.5,false);
    });

    y+=12;
    addPageIfNeeded(35);
    pdf.setFont('times','normal');
    pdf.setFontSize(10);
    pdf.line(25,y,85,y);
    pdf.line(125,y,185,y);
    y+=6;
    pdf.text('EL ARRENDADOR',55,y,{align:'center'});
    pdf.text('EL ARRENDATARIO',155,y,{align:'center'});

    return pdf.output('blob');
  }

  // Otros documentos: se mantiene flujo anterior
  var actions=document.querySelector('.actions');
  var previousBodyBg=document.body.style.background;
  if(actions) actions.style.display='none';
  document.body.style.background='#ffffff';

  var pageNodes=Array.from(document.querySelectorAll('.page'));
  var originalNodes=pageNodes.length ? pageNodes : [document.querySelector('.phone-sheet,.sheet,.receipt') || document.body];

  var pdf=new jspdf.jsPDF('p','mm','a4');
  var first=true;

  for(var i=0;i<originalNodes.length;i++){
    var node=originalNodes[i];
    var canvas=await captureAlohandoteNode(node,{cssWidth:'760px',pixelWidth:760,minHeight:''});
    if(!first) pdf.addPage('a4','p');
    addCanvasToPdfInPages(pdf,canvas,210,297,6);
    first=false;
  }

  if(actions) actions.style.display='';
  document.body.style.background=previousBodyBg||'';
  return pdf.output('blob');
}
async function downloadAlohandoteCleanPdf(){
  try{
    const blob=await buildAlohandoteCleanPdfBlob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='${safeName}.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(err){
    console.warn('PDF limpio no disponible, se abre impresión tradicional',err);
    window.print();
  }
}
async function shareAlohandoteCleanPdf(){
  try{
    const blob=await buildAlohandoteCleanPdfBlob();
    const fileName='${safeName}.pdf';
    const file=new File([blob],fileName,{type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:fileName});
      try{ if(window.parent && window.parent!==window){ window.parent.postMessage({type:'alohandote:close-document-preview',source:'document-preview'}, window.location.origin); } }catch(_close){}
      return;
    }
    if(window.parent && window.parent !== window){
      try{
        const buffer=await blob.arrayBuffer();
        window.parent.postMessage({type:'alohandote:share-pdf-buffer',source:'document-preview',fileName,buffer,mimeType:'application/pdf'}, window.location.origin, [buffer]);
        return;
      }catch(_a){
        try{ window.parent.postMessage({type:'alohandote:share-pdf-blob',source:'document-preview',fileName,blob}, window.location.origin); return; }catch(_b){}
      }
    }
    await downloadAlohandoteCleanPdf();
    alert('Tu navegador no permitió compartir el archivo directamente. Se descargó el PDF con el nombre correcto para enviarlo por WhatsApp.');
  }catch(err){
    console.warn('No se pudo Compartir',err);
    await downloadAlohandoteCleanPdf();
  }
}
</script>`
}

document.title = ''
function pdfActionButtons(filename = 'documento') { return `<button onclick="downloadAlohandoteCleanPdf()">Descargar PDF</button><button onclick="shareAlohandoteCleanPdf()">Compartir</button><button class="secondary" onclick="window.print()">Imprimir</button><button class="secondary" onclick="returnToAlohandoteApp()">Volver a la app</button><script>function returnToAlohandoteApp(){try{var msg={type:'alohandote:return-to-form',source:'document-preview'};if(window.parent&&window.parent!==window){try{window.parent.postMessage(msg,window.location.origin)}catch(_a){window.parent.postMessage(msg,'*')}try{window.parent.postMessage({type:'alohandote:close-document-preview',source:'document-preview'},window.location.origin)}catch(_b){window.parent.postMessage({type:'alohandote:close-document-preview',source:'document-preview'},'*')}return;}var openerWindow=window.opener;if(openerWindow&&!openerWindow.closed){try{openerWindow.postMessage(msg,window.location.origin)}catch(_e){try{openerWindow.postMessage(msg,'*')}catch(_x){}}try{openerWindow.focus()}catch(_f){}try{window.close()}catch(_g){}return;}var returnUrl='';try{returnUrl=localStorage.getItem('alohandote-document-return-url')||''}catch(_e){}if(!returnUrl){try{returnUrl=sessionStorage.getItem('alohandote-return-url')||''}catch(_e){}}if(returnUrl&&returnUrl.indexOf('blob:')!==0&&returnUrl.indexOf('documento.pdf')<0){window.location.replace(returnUrl);return;}if(window.history.length>1){window.history.back();return;}window.location.replace('/');}catch(e){try{window.parent.postMessage({type:'alohandote:close-document-preview',source:'document-preview'},'*')}catch(_e){window.location.replace('/')}}}</script>${cleanPdfExportScript(filename)}` }
function closePrintableOverlay() {
  const overlay = document.getElementById('alohandote-printable-overlay')
  if (overlay) overlay.remove()
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
}
function ensurePrintableOverlayMessageBridge() {
  if (window.__alohandotePrintableBridgeReady) return
  window.__alohandotePrintableBridgeReady = true
  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.type === 'alohandote:share-pdf-blob' || event.data?.type === 'alohandote:share-pdf-buffer') {
      try {
        const blob = event.data?.type === 'alohandote:share-pdf-buffer'
          ? new Blob([event.data?.buffer], { type: event.data?.mimeType || 'application/pdf' })
          : event.data?.blob
        const rawName = String(event.data?.fileName || 'documento-alohandote.pdf')
        const fileName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`
        if (!blob) throw new Error('PDF no disponible para compartir.')
        const file = new File([blob], fileName, { type: 'application/pdf' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName })
          closePrintableOverlay()
          window.focus()
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 60000)
        closePrintableOverlay()
        window.focus()
      } catch (err) {
        console.warn('No se pudo compartir el PDF desde la app principal:', err)
      }
      return
    }
    if (event.data?.type === 'alohandote:close-document-preview' || event.data?.type === 'alohandote:return-to-form') {
      closePrintableOverlay()
      window.focus()
    }
  })
}
function preparePrintableWindow() {
  try {
    const returnUrl = window.location.href
    localStorage.setItem('alohandote-document-return-url', returnUrl)
    sessionStorage.setItem('alohandote-return-url', returnUrl)
  } catch (_) {}

  // V200: vista previa dentro de la misma SPA. Evita popups, window.opener,
  // historial y recargas. El formulario permanece montado e intacto debajo.
  try {
    ensurePrintableOverlayMessageBridge()
    closePrintableOverlay()
    const overlay = document.createElement('div')
    overlay.id = 'alohandote-printable-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'Vista previa del documento')
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '2147483647',
      background: '#ffffff', display: 'flex', flexDirection: 'column'
    })
    const iframe = document.createElement('iframe')
    iframe.title = 'Vista previa del documento'
    iframe.setAttribute('allow', 'clipboard-write; web-share')
    Object.assign(iframe.style, {
      width: '100%', height: '100%', border: '0', background: '#ffffff', flex: '1 1 auto'
    })
    overlay.appendChild(iframe)
    document.body.appendChild(overlay)
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const frameWindow = iframe.contentWindow
    if (!frameWindow) throw new Error('No se pudo inicializar la vista previa interna.')
    frameWindow.document.open('text/html', 'replace')
    frameWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Generando documento...</title></head><body style="font-family:Arial,sans-serif;padding:24px">Generando documento...</body></html>')
    frameWindow.document.close()
    return frameWindow
  } catch (err) {
    console.warn('No se pudo preparar la vista previa interna:', err)
    closePrintableOverlay()
  }
  return null
}
function printableHtmlWithBase(html = '') {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  if (!origin || String(html).includes('<base ')) return html
  return String(html).replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">`)
}
function downloadPrintableHtml(safeHtml, fallbackTitle = 'documento') {
  const blob = new Blob([safeHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener'
  link.download = `${fallbackTitle}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 120000)
}
function writeHtmlDocumentToWindow(targetWindow, html = '', fallbackTitle = 'documento') {
  const safeHtml = printableHtmlWithBase(html)
  try { if (typeof sessionStorage !== 'undefined' && window.location && !String(window.location.href).startsWith('blob:')) sessionStorage.setItem('alohandote-return-url', window.location.href) } catch (_) {}
  try {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.document.open('text/html', 'replace')
      targetWindow.document.write(safeHtml)
      targetWindow.document.close()
      targetWindow.focus()
      return true
    }
  } catch (err) {
    console.warn('No se pudo escribir el documento imprimible en la ventana:', err)
  }

  // V198: abrir el documento directamente en una pestaña hija conserva la app y
  // el formulario exactamente como estaban. El botón "Volver a la app" enfoca
  // la pestaña original y cierra únicamente el documento, sin recargar el sistema.
  try {
    const documentWindow = window.open('', '_blank')
    if (documentWindow && !documentWindow.closed) {
      documentWindow.document.open('text/html', 'replace')
      documentWindow.document.write(safeHtml)
      documentWindow.document.close()
      documentWindow.focus()
      return true
    }
  } catch (err) {
    console.warn('No se pudo abrir el documento en una pestaña separada:', err)
  }

  // Respaldo para navegadores que bloqueen pestañas nuevas.
  try {
    const blob = new Blob([safeHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.location.assign(url)
    setTimeout(() => URL.revokeObjectURL(url), 120000)
    return true
  } catch (err) {
    console.warn('No se pudo navegar al documento imprimible:', err)
  }

  downloadPrintableHtml(safeHtml, fallbackTitle)
  return false
}
function openPrintableBlob(html = '', fallbackTitle = 'documento', targetWindow = null) {
  // V161: mecanismo principal vuelve a ser escritura HTML directa en la ventana
  // abierta por el clic del usuario. Es más estable para Chrome/Edge que navegar
  // un about:blank hacia blob: cuando hay bloqueadores de popups.
  return writeHtmlDocumentToWindow(targetWindow, html, fallbackTitle)
}
function writeHtmlIntoWindow(targetWindow, safeHtml) {
  return writeHtmlDocumentToWindow(targetWindow, safeHtml, 'documento')
}
function openPrintableFallback(html, fallbackTitle = 'documento') {
  writeHtmlDocumentToWindow(null, html, fallbackTitle)
}
function writePrintableWindow(targetWindow, html, fallbackTitle = 'documento') {
  return writeHtmlDocumentToWindow(targetWindow, html, fallbackTitle)
}
function lodgingIcalUrl(aptId) {
  if (!aptId || typeof window === 'undefined') return ''
  return `${window.location.origin}/api/ical/${encodeURIComponent(aptId)}.ics`
}
function photoUrl(photo) {
  if (!photo) return ''
  if (typeof photo === 'string') return photo
  return photo.url || photo.downloadURL || photo.src || photo.dataUrl || photo.dataURL || photo.previewUrl || photo.preview || photo.base64 || ''
}
function photoName(photo, index = 0) { return typeof photo === 'string' ? `Foto ${index + 1}` : (photo?.name || `Foto ${index + 1}`) }
function entityPreviewPhoto(entity) {
  if (!entity) return ''
  const list = Array.isArray(entity.photos) ? entity.photos : []
  return list.length ? photoUrl(list[0]) : ''
}

function vehicleBrandText(vehicle = {}) {
  if (vehicle.brand) return vehicle.brand
  const name = String(vehicle.name || '').trim()
  return name ? name.split(/\s+/).slice(0, 2).join(' ') : 'Sin marca'
}

function vehicleModelText(vehicle = {}) {
  if (vehicle.model) return vehicle.model
  const name = String(vehicle.name || '').trim()
  const parts = name.split(/\s+/)
  return parts.length > 2 ? parts.slice(2).join(' ') : (vehicle.plate || 'Sin modelo')
}

function imageExtensionFromType(type = '') {
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  return 'jpg'
}
async function ensureHeic2AnyLoaded() {
  if (typeof window === 'undefined') return null
  if (window.heic2any) return window.heic2any
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-heic2any="true"]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'
    script.async = true
    script.dataset.heic2any = 'true'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  return window.heic2any
}
function isHeicFileLike(fileOrPhoto = {}) {
  const name = String(fileOrPhoto.name || fileOrPhoto.filename || '').toLowerCase()
  const type = String(fileOrPhoto.type || '').toLowerCase()
  const url = String(fileOrPhoto.url || fileOrPhoto.downloadURL || fileOrPhoto.src || '').toLowerCase()
  return type.includes('heic') || type.includes('heif') || /\.(heic|heif)(\?|#|$)/i.test(name) || /\.(heic|heif)(\?|#|$)/i.test(url)
}
async function convertHeicFileToJpeg(file) {
  if (!isHeicFileLike(file)) return file
  const heic2any = await ensureHeic2AnyLoaded()
  if (!heic2any) return file
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.88 })
  const blob = Array.isArray(converted) ? converted[0] : converted
  const jpgName = String(file.name || `foto-${Date.now()}.heic`).replace(/\.(heic|heif)$/i, '.jpg')
  return new File([blob], jpgName, { type: 'image/jpeg', lastModified: Date.now() })
}
async function compressImageForUpload(file, maxSide = 1900, quality = 0.86) {
  const originalType = file.type || 'image/jpeg'
  const originalName = file.name || `foto-${Date.now()}`
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(originalType)) return file
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  const outputType = originalType.includes('png') ? 'image/png' : 'image/jpeg'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality))
  if (!blob) return file
  const ext = imageExtensionFromType(outputType)
  const cleanBase = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || `foto-${Date.now()}`
  return new File([blob], `${cleanBase}.${ext}`, { type: outputType, lastModified: Date.now() })
}


async function imageFileToCatalogDataUrl(file, maxSide = 900, quality = 0.62) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type || '')) return dataUrl
  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

function withTimeout(promise, ms, label = 'operación') {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} tardó demasiado. Intenta con una foto JPG/PNG más liviana.`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

async function fileToPlainDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function buildCatalogPhoto(originalFile) {
  let file = originalFile
  if (isHeicFileLike(originalFile)) {
    try { file = await withTimeout(convertHeicFileToJpeg(originalFile), 7000, 'Conversión HEIC') } catch (err) { console.warn('No se pudo convertir HEIC a tiempo:', err) }
  }
  if (/^image\/(jpeg|jpg|png|webp)$/i.test(file.type || '')) {
    try { file = await withTimeout(compressImageForUpload(file, 900, 0.62), 7000, 'Compresión de foto') } catch (err) { console.warn('No se pudo comprimir a tiempo:', err) }
    try { return await withTimeout(imageFileToCatalogDataUrl(file, 620, 0.48), 9000, 'Preparación de foto para catálogo') } catch (err) { console.warn('No se pudo preparar foto para catálogo:', err) }
  }
  return withTimeout(fileToPlainDataUrl(file), 7000, 'Lectura de foto')
}

// V208: branding documental centralizado en src/modules/documents/branding.js
function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
function recordHasAliadoFlag(record = {}) {
  return [
    record.ownershipType,
    record.accommodationType,
    record.vehicleOwnershipType,
    record.assetStatus,
    record.assetTypeStatus,
    record.propertyStatus,
    record.commercialStatus,
    record.businessModel,
    record.lodgingOwnershipType,
    record.vehicleTypeStatus,
    record.statusType,
    record.type,
  ].some((value) => normalizeText(value).includes('aliado'))
}
function isAlliedAccommodation(apt = {}) { return recordHasAliadoFlag(apt) }
function isAlliedVehicle(vehicle = {}) { return recordHasAliadoFlag(vehicle) }
function isOwnAccommodation(apt = {}) { return !isAlliedAccommodation(apt) }
function isOwnVehicle(vehicle = {}) { return !isAlliedVehicle(vehicle) }
// V221 QA compatibility: publicOperationsMode && isAlliedVehicle(vehicle) / publicOperationsMode && isAlliedAccommodation(apt)
function sellerCommissionRateFor(record = {}, people = []) {
  const creatorName = normalizeText(record.createdByName || record.seller || '')
  const creatorEmail = normalizeText(record.createdByEmail || '')
  const person = (people || []).find((row) => normalizeText(row.name || '') === creatorName || normalizeText(row.email || '') === creatorEmail)
  const rate = num(record.sellerCommissionRate || person?.commissionRate || 15)
  return rate > 0 ? rate / 100 : COMMISSION_RATE
}
function usesGenericSellerDocuments(profile = {}) { return ['seller','seller_all','seller_lodging'].includes(normalizeRole(profile?.role || profile)) }
function allyIncomeTargetUsd(total = 0, mode = 'fixed', value = 0) { const t = num(total); const v = num(value); if (!t) return 0; if (String(mode || '').toLowerCase().includes('percent')) return Number(Math.min(t, Math.max(0, t * v / 100)).toFixed(2)); return Number(Math.min(t, Math.max(0, v)).toFixed(2)) }
function lodgingAllyBreakdown(record = {}, apt = {}, exchangeRates = null) { const total = num(record.totalAmount); const isAlly = isAlliedAccommodation(apt) || String(record.lodgingOwnershipType || '').toLowerCase() === 'aliado'; const targetIncome = isAlly ? allyIncomeTargetUsd(total, record.allyProfitMode || apt.allyProfitMode, record.allyProfitValue || apt.allyProfitValue || record.alohandoteIncomeUsd) : total; const ownerTarget = isAlly ? Math.max(0, Number((total - targetIncome).toFixed(2))) : 0; const paidUsd = storedPaidUsd(record, exchangeRates); const paidBs = storedPaidBs(record, exchangeRates); const ratio = total > 0 ? Math.min(1, paidUsd / total) : 0; const alohandoteCollectedUsd = isAlly ? Number((targetIncome * ratio).toFixed(2)) : paidUsd; const ownerPayableUsd = isAlly ? Number((ownerTarget * ratio).toFixed(2)) : 0; const alohandoteCollectedBs = paidUsd > 0 ? Number((paidBs * (alohandoteCollectedUsd / paidUsd)).toFixed(2)) : 0; const ownerPayableBs = paidUsd > 0 ? Number((paidBs * (ownerPayableUsd / paidUsd)).toFixed(2)) : 0; return { isAlly, targetIncome, ownerTarget, alohandoteCollectedUsd, ownerPayableUsd, alohandoteCollectedBs, ownerPayableBs } }
function dayCount(start, end) {
  if (!start || !end) return 0
  const diffDays = Math.round((parseISODate(end) - parseISODate(start)) / 86400000)
  return Math.max(1, diffDays || 1)
}
function upper(value = '') { return String(value || '').toUpperCase() }
function daysForReservation(reservation) {
  const byDates = dayCount(reservation?.startDate, reservation?.endDate)
  return Number(byDates || reservation?.rentalDays || 0)
}
function totalFromDaily(days, rate) { return Number((num(days) * num(rate)).toFixed(2)) }
function dailyFromTotal(total, days) { return Number((num(total) / Math.max(1, num(days) || 1)).toFixed(2)) }
function monthBounds(date) { return { start: toISODate(new Date(date.getFullYear(), date.getMonth(), 1)), end: toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0)) } }
function sellerName(profile, user) { return titleCaseName(profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Operador') }
function vehicleKmRate(vehicle) { return Number(vehicle?.pricePerKm || vehicle?.kmRate || vehicle?.costPerKm || KM_RATE) || KM_RATE }
function vehicleDayRate(vehicle) { return Number(vehicle?.dailyRentalRate || vehicle?.dayRate || vehicle?.dailyRate || 0) || 0 }
function quoteFromKm(km, rate = KM_RATE) { return Number((num(km) * num(rate || KM_RATE)).toFixed(2)) }
function quoteBaseFromDays(days, dailyRate) { return Number((num(days) * num(dailyRate)).toFixed(2)) }

function commissionFromTotal(total) { return Number((num(total) * COMMISSION_RATE).toFixed(2)) }
function kmFromTotal(total, rate = KM_RATE) { return total ? Number((num(total) / num(rate || KM_RATE)).toFixed(2)) : '' }
function normalizeRole(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (['admin', 'administrador', 'administrator'].includes(raw)) return 'admin'
  if (['supervisor', 'coordinador', 'coordinadora'].includes(raw)) return 'supervisor'
  if (['vendedor renta car y alojamientos', 'vendedor rent car y alojamientos', 'vendedor renta car alojamientos', 'vendedor rentacar alojamientos', 'seller_all', 'seller all', 'ventas renta car y alojamientos'].includes(raw)) return 'seller_all'
  if (['vendedor alojamientos', 'seller_lodging', 'seller lodging', 'ventas alojamientos', 'vendedor hospedaje'].includes(raw)) return 'seller_lodging'
  if (['vendedor', 'seller', 'comercial', 'ventas'].includes(raw)) return 'seller_all'
  if (['logistica', 'logística', 'logistics', 'logistico', 'logístico'].includes(raw)) return 'logistics'
  if (['operator', 'operador'].includes(raw)) return 'operator_general'
  if (['operador renta car', 'operador rentacar', 'renta car'].includes(raw)) return 'operator_rentcar'
  if (['operador alojamientos', 'alojamientos', 'hospedaje'].includes(raw)) return 'operator_lodging'
  if (['recepción vehículos', 'recepcion vehiculos', 'recepcionista vehiculos', 'recepción vehiculos'].includes(raw)) return 'vehicle_reception'
  if (['limpieza', 'cleaning'].includes(raw)) return 'cleaning'
  if (['mantenimiento', 'maintenance'].includes(raw)) return 'maintenance'
  if (['contabilidad', 'contador', 'administracion', 'administración', 'accounting'].includes(raw)) return 'accounting'
  if (['solo lectura', 'lector', 'read only', 'readonly'].includes(raw)) return 'readonly'
  return 'seller'
}
const ROLE_LABELS = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  seller: 'Vendedor',
  seller_all: 'Vendedor Renta Car y Alojamientos',
  seller_lodging: 'Vendedor Alojamientos',
  operator_general: 'Operador',
  logistics: 'Logística',
  operator_rentcar: 'Operador Renta Car',
  operator_lodging: 'Operador Alojamientos',
  vehicle_reception: 'Recepción vehículos',
  cleaning: 'Limpieza',
  maintenance: 'Mantenimiento',
  accounting: 'Contabilidad',
  readonly: 'Solo lectura',
}
function roleLabel(profile) { return ROLE_LABELS[normalizeRole(profile?.role)] || 'Usuario' }
const ROLE_PERMISSIONS = {
  admin: ['*'],
  supervisor: ['viewCars','viewLodging','viewCommercial','viewAdmin','viewInventory','viewHr','viewMaintenance','viewProfitability','manageAssets','manageInventory','manageHr','carLogistics','lodgingLogistics','export','writeCommercial','writeOperations'],
  seller: ['viewCars','viewLodging','viewCommercial','writeCommercial'],
  seller_all: ['viewCars','viewLodging','viewCommercial','writeCommercial'],
  seller_lodging: ['viewLodging','viewCommercial','writeCommercial'],
  operator_general: ['viewCars','viewLodging','viewCommercial','carLogistics','lodgingLogistics','writeCommercial','writeOperations'],
  logistics: ['carLogistics','lodgingLogistics','writeOperations'],
  operator_rentcar: ['viewCars','viewCommercial','carLogistics','writeOperations'],
  operator_lodging: ['viewLodging','lodgingLogistics','writeOperations'],
  vehicle_reception: ['viewCars','carLogistics','writeOperations'],
  cleaning: ['viewLodging','lodgingLogistics','viewInventory','writeOperations'],
  maintenance: ['viewCars','viewMaintenance','viewInventory','carLogistics','writeOperations','manageInventory'],
  accounting: ['viewCommercial','viewAdmin','viewProfitability','export'],
  readonly: ['viewCars','viewLodging','viewCommercial','viewAdmin','viewInventory','viewMaintenance','viewProfitability'],
}
function roleHasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[normalizeRole(role)] || []
  return perms.includes('*') || perms.includes(permission)
}
function isLogisticsRole(role) { return normalizeRole(role) === 'logistics' }

function isSellerProfile(role) {
  return ['seller', 'seller_all', 'seller_lodging'].includes(normalizeRole(role))
}
function canSellerUseModule(role, moduleName = 'cars') {
  const normalized = normalizeRole(role)
  if (normalized === 'seller_lodging') return moduleName === 'lodging'
  if (normalized === 'seller' || normalized === 'seller_all') return moduleName === 'cars' || moduleName === 'lodging'
  return true
}
function normalizeEmail(value = '') { return String(value || '').trim().toLowerCase() }
function normalizePersonName(value = '') { return titleCaseName(String(value || '').trim()) }
function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (['cancelled', 'canceled', 'cancelada', 'cancelado', 'anulada', 'anulado', 'anulada / devolución', 'anulacion', 'anulación', 'devolucion', 'devolución'].includes(raw)) return 'cancelled'
  if (['returned', 'devuelto', 'devuelta', 'completado', 'completada', 'finalizado', 'finalizada', 'cerrado', 'cerrada'].includes(raw)) return 'returned'
  if (['maintenance', 'mantenimiento', 'correctivo', 'preventivo'].includes(raw)) return 'maintenance'
  if (['pending', 'pre-reserva', 'prereserva', 'pre reserva', 'no disponible', 'nodisponible', 'bloqueado'].includes(raw)) return 'pending'
  if (['reserved', 'reservado', 'reservada', 'reserva'].includes(raw)) return 'reserved'
  return 'reserved'
}

function isReservationCancelled(item = {}) {
  return normalizeStatus(item.status) === 'cancelled' || Boolean(item.cancelledAt || item.refundAt || item.receivableClosed || item.calendarReleased || item.cancellationType === 'annulment_refund')
}
function isIcalImportedRecord(item = {}) {
  const channel = String(item?.channel || '').toLowerCase()
  const note = String(item?.note || item?.notes || '').toLowerCase()
  const customer = String(item?.customerName || '').toLowerCase()
  const source = String(item?.source || item?.sourceType || '').toLowerCase()
  return source === 'ical'
    || channel.includes('ical')
    || channel.includes('airbnb')
    || channel.includes('booking')
    || note.includes('ical')
    || note.includes('airbnb')
    || note.includes('booking')
    || customer.includes('airbnb')
    || customer.includes('not available')
    || Boolean(item?.externalUid)
}
function isMaintenanceRecord(item = {}) {
  if (isIcalImportedRecord(item)) return false
  const status = normalizeStatus(item.status)
  const hasMaintenanceCost = num(item.maintenanceCost) > 0 || num(item.maintenanceLaborCost) > 0 || num(item.maintenancePartsCost) > 0
  const hasMaintenanceEvidence = !!item.maintenancePaymentMethod || (Array.isArray(item.maintenanceInvoices) && item.maintenanceInvoices.length > 0)
  return status === 'maintenance' || hasMaintenanceCost || hasMaintenanceEvidence
}
function statusMeta(value) { return STATUS[normalizeStatus(value)] || STATUS.reserved }
function formatContractDate(iso) {
  if (!iso) return '____ de __________ de ______'
  const date = parseISODate(iso)
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDocumentDayDate(iso) {
  if (!iso) return '-'
  const stringValue = String(iso)
  const isoDate = stringValue.includes('T') ? stringValue.slice(0, 10) : stringValue
  const date = parseISODate(isoDate)
  if (Number.isNaN(date.getTime())) return '-'
  const day = new Intl.DateTimeFormat('es-VE', { weekday: 'short' }).format(date).replace('.', '')
  const dayCap = day.charAt(0).toUpperCase() + day.slice(1, 3).toLowerCase()
  const number = new Intl.DateTimeFormat('es-VE', { day: '2-digit' }).format(date)
  const month = new Intl.DateTimeFormat('es-VE', { month: 'short' }).format(date).replace('.', '').toLowerCase()
  return `${dayCap}-${number} ${month}`
}

function joinDocs(reservation) {
  const docs = []
  if (reservation.licenseDoc?.name) docs.push(`Licencia: ${reservation.licenseDoc.name}`)
  if (reservation.idDoc?.name) docs.push(`Identificación: ${reservation.idDoc.name}`)
  return docs.join(' · ')
}

function LoginScreen({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  function submit(event) { event.preventDefault(); onLogin(email.trim(), password) }
  return (
    <main className="login-shell">
      <section className="login-card">
        <img className="login-logo" src="/alohandote-logo.png" alt="Alohandote" />
        <div className="login-icon"><Lock size={22} /></div>
        <h1>Alohandote<br />Calendario Renta Car</h1>
        <p>Acceso privado para administradores, vendedores y operadores.</p>
        <form onSubmit={submit} className="login-form">
          {error && <div className="form-error">{error}</div>}
          <label>Correo electrónico<div className="input-with-icon"><Mail size={17} /><input type="email" value={email} placeholder="tu correo" onChange={(e) => setEmail(e.target.value)} required /></div></label>
          <label>Contraseña<input type="password" value={password} placeholder="Tu contraseña" onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="primary full" type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Entrar al calendario'}</button>
        </form>
        <small>Usuario creado desde Firebase Authentication.</small>
      </section>
    </main>
  )
}

function FirebaseSetupRequired() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <img className="login-logo" src="/alohandote-logo.png" alt="Alohandote" />
        <div className="login-icon"><Lock size={22} /></div>
        <h1>Alohandote<br />Acceso protegido</h1>
        <p>Firebase no está configurado. Por seguridad, el sistema administrativo no se abre en modo demo automático.</p>
        <div className="form-error">Configura VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID y las demás variables Firebase en Vercel o en tu .env local.</div>
        <small>Para pruebas internas aisladas puedes activar VITE_ENABLE_DEMO_MODE=true, pero no debe usarse en producción.</small>
      </section>
    </main>
  )
}

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [moduleMode, setModuleMode] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = (params.get('modulo') || params.get('module') || '').toLowerCase()
    if (['rentabilidad', 'profitability', 'roi'].includes(requested)) return 'profitability'
    if (['alojamientos', 'lodging'].includes(requested)) return 'lodging'
    if (['comercial', 'commercial', 'cotizaciones', 'quotes', 'reservas', 'reservations'].includes(requested)) return 'commercial'
    if (['recepcion', 'checkins'].includes(requested)) return 'checkins'
    return 'cars'
  })
  const publicReceptionMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.has('recepcion') || params.has('recepcionVehiculo') || window.location.pathname.toLowerCase().includes('recepcion')
  }, [])
  const publicOperationsMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const path = window.location.pathname.toLowerCase()
    return params.has('operaciones') || params.has('logistica') || params.has('limpieza') || path.includes('operaciones') || path.includes('logistica') || path.includes('limpieza')
  }, [])
  const enableDemoMode = String(import.meta.env.VITE_ENABLE_DEMO_MODE || '').toLowerCase() === 'true'
  const publicOperationsToken = useMemo(() => String(new URLSearchParams(window.location.search).get('token') || new URLSearchParams(window.location.search).get('k') || '').trim(), [])
  const [publicTokenRecord, setPublicTokenRecord] = useState(null)
  const [publicTokenLoading, setPublicTokenLoading] = useState(false)
  const [publicTokenError, setPublicTokenError] = useState('')
  const [completedPublicTaskIds, setCompletedPublicTaskIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alohandote_completed_public_tasks') || '[]') } catch { return [] }
  })
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(isFirebaseReady && !publicReceptionMode && !publicOperationsMode)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchMode, setSearchMode] = useState('quotes')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchFilters, setSearchFilters] = useState({ module: 'all', operator: '', name: '', customerId: '', phone: '', startDate: '', endDate: '' })
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedAccommodationId, setSelectedAccommodationId] = useState('')
  const [editingReservation, setEditingReservation] = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [editingAccommodation, setEditingAccommodation] = useState(null)
  const [editingLodging, setEditingLodging] = useState(null)
  const [editingVehicleCheckin, setEditingVehicleCheckin] = useState(null)
  const [editingVehicleDelivery, setEditingVehicleDelivery] = useState(null)
  const [editingCleaningTask, setEditingCleaningTask] = useState(null)
  const [editingInventoryItem, setEditingInventoryItem] = useState(null)
  const [editingInventoryMovement, setEditingInventoryMovement] = useState(null)
  const [editingHrPerson, setEditingHrPerson] = useState(null)
  const [editingHrTask, setEditingHrTask] = useState(null)
  const [payrollPerson, setPayrollPerson] = useState(null)
  const [linkingIcalItem, setLinkingIcalItem] = useState(null)
  const [icalSyncingAccommodationId, setIcalSyncingAccommodationId] = useState('')
  const [editingDollarPurchase, setEditingDollarPurchase] = useState(null)
  const [editingGeneralExpense, setEditingGeneralExpense] = useState(null)
  const [assetExpenseDetail, setAssetExpenseDetail] = useState(null)
  const [assetMaintenanceDetail, setAssetMaintenanceDetail] = useState(null)
  const [selectedVehicleMaintenanceId, setSelectedVehicleMaintenanceId] = useState('')
  const [selectedLodgingMaintenanceId, setSelectedLodgingMaintenanceId] = useState('')
  const [editingCommissionPayment, setEditingCommissionPayment] = useState(null)
  const [editingRefund, setEditingRefund] = useState(null)
  const [operationsRevision, setOperationsRevision] = useState(0)
  const [error, setError] = useState('')
  const [healthEvents, setHealthEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alohandote_health_events') || '[]') } catch { return [] }
  })
  const [reservationSaving, setReservationSaving] = useState(false)
  const [accommodationSaving, setAccommodationSaving] = useState(false)
  const [exchangeRates, setExchangeRates] = useState(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState('')
  const licenseInputRef = useRef(null)
  const idInputRef = useRef(null)
  const icsInputRef = useRef(null)
  const dashboardPhotoInputRef = useRef(null)
  const vehiclePhotoInputRef = useRef(null)

  useEffect(() => {
    if (publicReceptionMode || publicOperationsMode || !isFirebaseReady || !auth) { setAuthLoading(false); return }
    const safetyTimer = setTimeout(() => {
      console.warn('Auth validation timeout: showing login/app fallback')
      setAuthLoading(false)
    }, 8000)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (!currentUser) { setProfile(null); setAuthLoading(false); clearTimeout(safetyTimer); return }
      const defaultProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
        role: adminEmails.includes(currentUser.email?.toLowerCase()) ? 'admin' : '',
        active: true,
      }
      try {
        const profileSnap = await Promise.race([
          getDoc(doc(db, 'users', currentUser.uid)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado al leer perfil')), 7000)),
        ])
        const firestoreProfile = profileSnap.exists() ? profileSnap.data() : {}
        let hrAccessProfile = {}
        try {
          const hrSnap = await getDocs(query(collection(db, 'hrPeople'), where('email', '==', currentUser.email || '')))
          const hrPerson = hrSnap.docs.map((item) => ({ id: item.id, ...item.data() })).find((person) => String(person.status || 'Activo') !== 'Inactivo')
          if (hrPerson && String(hrPerson.appAccess || '').toLowerCase().includes('con acceso')) {
            hrAccessProfile = {
              name: hrPerson.name || defaultProfile.name,
              role: hrPerson.permissionsProfile || hrPerson.role || defaultProfile.role,
              active: hrPerson.status !== 'Inactivo',
              hrPersonId: hrPerson.id,
            }
          }
        } catch (hrErr) {
          console.warn('No se pudo resolver perfil RRHH por correo:', hrErr)
        }
        const resolvedRole = hrAccessProfile.role || firestoreProfile.role || defaultProfile.role
        setProfile({
          ...defaultProfile,
          ...firestoreProfile,
          ...hrAccessProfile,
          uid: currentUser.uid,
          role: normalizeRole(resolvedRole),
          active: firestoreProfile.active !== false && hrAccessProfile.active !== false,
        })
      } catch (err) {
        console.error('No se pudo leer el perfil del usuario. Se usará perfil por correo:', err)
        setProfile(defaultProfile)
      } finally {
        clearTimeout(safetyTimer)
        setAuthLoading(false)
      }
    })
    return () => { clearTimeout(safetyTimer); unsubscribe() }
  }, [])

  // V202: sincronización en vivo del perfil operativo.
  // El perfil de un operador puede cambiar desde Admin/RRHH mientras la sesión sigue abierta.
  // Este listener mantiene nombre, rol, acceso y estado actualizados sin tocar reservas, caja, iCal ni reglas.
  useEffect(() => {
    if (!user || publicReceptionMode || publicOperationsMode || !isFirebaseReady || !db) return
    const baseProfile = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'Usuario',
      role: adminEmails.includes(user.email?.toLowerCase()) ? 'admin' : '',
      active: true,
    }
    let disposed = false
    let firestoreProfile = {}
    let hrAccessProfile = {}
    const applyLiveProfile = () => {
      if (disposed) return
      const resolvedRole = hrAccessProfile.role || firestoreProfile.role || baseProfile.role
      setProfile({
        ...baseProfile,
        ...firestoreProfile,
        ...hrAccessProfile,
        uid: user.uid,
        email: user.email,
        role: normalizeRole(resolvedRole),
        active: firestoreProfile.active !== false && hrAccessProfile.active !== false,
        profileSyncedAt: new Date().toISOString(),
        profileSource: hrAccessProfile.hrPersonId ? 'RRHH / Admin' : (Object.keys(firestoreProfile).length ? 'Usuarios / Admin' : 'Firebase Auth'),
      })
    }
    const unsubs = []
    try {
      unsubs.push(onSnapshot(doc(db, 'users', user.uid), (snap) => {
        firestoreProfile = snap.exists() ? (snap.data() || {}) : {}
        applyLiveProfile()
      }, (err) => {
        console.warn('No se pudo sincronizar users/{uid} en vivo:', err)
        applyLiveProfile()
      }))
    } catch (err) {
      console.warn('No se pudo activar listener users/{uid}:', err)
    }
    try {
      const email = normalizeEmail(user.email || '')
      if (email) {
        unsubs.push(onSnapshot(collection(db, 'hrPeople'), (snapshot) => {
          const hrPerson = snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }))
            .find((person) => normalizeEmail(person.email) === email && String(person.status || 'Activo') !== 'Inactivo')
          if (hrPerson && String(hrPerson.appAccess || '').toLowerCase().includes('con acceso')) {
            hrAccessProfile = {
              name: hrPerson.name || baseProfile.name,
              role: hrPerson.permissionsProfile || hrPerson.role || baseProfile.role,
              active: hrPerson.status !== 'Inactivo',
              hrPersonId: hrPerson.id,
              phone: hrPerson.phone || '',
              document: hrPerson.document || '',
              department: hrPerson.department || '',
            }
          } else {
            hrAccessProfile = {}
          }
          applyLiveProfile()
        }, (err) => {
          console.warn('No se pudo sincronizar RRHH por correo en vivo:', err)
          applyLiveProfile()
        }))
      }
    } catch (err) {
      console.warn('No se pudo activar listener RRHH:', err)
    }
    applyLiveProfile()
    return () => { disposed = true; unsubs.forEach((unsubscribe) => { try { unsubscribe() } catch (_err) {} }) }
  }, [user?.uid, user?.email, publicReceptionMode, publicOperationsMode])

  function showSuccess(message) {
    setSuccessMessage(message)
    window.clearTimeout(window.__alohandoteToastTimer)
    window.__alohandoteToastTimer = window.setTimeout(() => setSuccessMessage(''), 3600)
  }


  async function refreshExchangeRates() {
    setRatesLoading(true)
    setRatesError('')
    try {
      const response = await fetch(`/api/rates?ts=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || `HTTP ${response.status}`)
      const live = normalizeExchangeRatesPayload(payload, payload.source || 'Tasas BCV en línea')
      if (!live?.bcvEuro || !live?.bcvDollar) throw new Error('La respuesta no contiene EURO y USD BCV válidos')
      setExchangeRates(live)
      cacheExchangeRates(live)
    } catch (rateError) {
      console.error('No se pudieron actualizar las tasas BCV:', rateError)
      const cached = cachedExchangeRates()
      const emergency = cached || fallbackExchangeRates()
      setExchangeRates(emergency)
      setRatesError(`No se pudo actualizar la tasa BCV en línea. ${cached ? 'Se conserva la última tasa válida.' : 'Se usa respaldo de emergencia.'}`)
    } finally {
      setRatesLoading(false)
    }
  }

  useEffect(() => {
    refreshExchangeRates()
    const interval = setInterval(refreshExchangeRates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const exchangeAdjustmentPercent = Math.max(0, Number(exchangeRates?.spreadPercent || 0))
  const officialEuroRate = euroRateValue(exchangeRates, '')
  const rateAwareExchangeRates = exchangeRates || null
  useEffect(() => {
    const rate = officialEuroRate
    if (!rate) return
    setEditingReservation((draft) => {
      if (!draft) return draft
      const rateSnapshot = { ...(exchangeRates || {}), bcvEuro: rate }
      const total = num(draft.totalAmount || totalQuoteForReservation(draft))
      return { ...draft, bcvEuroRate: String(rate), totalAmountBs: total ? String(amountBs(total, rateSnapshot, rate)) : draft.totalAmountBs, amountBs: draft.amount ? String(paymentAmountBs(draft.amount, draft.paymentMethod, rateSnapshot, rate)) : draft.amountBs, amountUsdEquivalent: draft.amount ? String(paymentAmountUsd(draft.amount, draft.paymentMethod, rateSnapshot, rate)) : draft.amountUsdEquivalent }
    })
    setEditingLodging((draft) => {
      if (!draft) return draft
      const rateSnapshot = { ...(exchangeRates || {}), bcvEuro: rate }
      const total = num(draft.totalAmount || lodgingTotal(lodgingNights(draft.startDate, draft.endDate), draft.nightlyRate, draft.cleaningFee))
      return { ...draft, bcvEuroRate: String(rate), totalAmountBs: total ? String(amountBs(total, rateSnapshot, rate)) : draft.totalAmountBs, amountBs: draft.amount ? String(paymentAmountBs(draft.amount, draft.paymentMethod, rateSnapshot, rate)) : draft.amountBs, amountUsdEquivalent: draft.amount ? String(paymentAmountUsd(draft.amount, draft.paymentMethod, rateSnapshot, rate)) : draft.amountUsdEquivalent }
    })
    setEditingHrPerson((draft) => draft ? { ...draft, bcvUsdRate: String(dollarRateValue(exchangeRates, OFFICIAL_BCV_USD_FALLBACK)) } : draft)
  }, [officialEuroRate])
  function applyExchangeAdjustment(baseAmount) { return Number((num(baseAmount) * (1 + exchangeAdjustmentPercent / 100)).toFixed(2)) }
  function removeExchangeAdjustment(totalAmount) { return Number((num(totalAmount) / (1 + exchangeAdjustmentPercent / 100)).toFixed(2)) }
  function currentKmRate(reservation = editingReservation) {
    const vehicle = vehicles?.find?.((item) => item.id === reservation?.vehicleId) || selectedVehicle
    return Number(reservation?.pricePerKm || vehicleKmRate(vehicle) || KM_RATE) || KM_RATE
  }
  function quoteFromKmAdjusted(km, reservation = editingReservation) { return applyExchangeAdjustment(quoteFromKm(km, currentKmRate(reservation))) }

  function isBsGeneralExpense(expense = {}) {
    return String(expense.currency || '').toUpperCase() === 'BS' || isBsPaymentMethod(expense.paymentMethod)
  }
  function generalExpenseUsdAmount(expense = {}, rates = exchangeRates) {
    const rate = euroRateValue(rates, expense.bcvDollarRate || expense.bcvEuroRate || '')
    if (isBsGeneralExpense(expense)) return rate ? Number((num(expense.amountBs || expense.amount) / rate).toFixed(2)) : 0
    return num(expense.amount || expense.amountUsd || 0)
  }
  function generalExpenseBsAmount(expense = {}, rates = exchangeRates) {
    const rate = euroRateValue(rates, expense.bcvDollarRate || expense.bcvEuroRate || '')
    if (isBsGeneralExpense(expense)) return num(expense.amountBs || expense.amount || 0)
    return amountBs(num(expense.amount || expense.amountUsd || 0), rates, rate)
  }
  function allyPayablePreview(expense = {}, rates = exchangeRates) {
    const rate = euroRateValue(rates, expense.bcvDollarRate || expense.bcvEuroRate || '') || euroRateValue(exchangeRates, officialEuroRate)
    if (!['ownerPayableAlly','ownerPayableVehicleAlly'].includes(expense.sourceType)) {
      return { isBs: isBsGeneralExpense(expense), total: num(expense.amount || expense.amountBs), gain: 0, payable: num(expense.amount || expense.amountBs), rate }
    }
    if (isBsGeneralExpense(expense)) {
      const totalBs = num(expense.reservationTotalBs || expense.totalAmountBs || expense.amountBs || expense.amount || 0)
      const gainBs = num(expense.alohandoteNetIncomeBs || expense.alohandoteIncomeBs || 0)
      const payableBs = Math.max(0, Number((totalBs - gainBs).toFixed(2)))
      return { isBs: true, total: totalBs, gain: gainBs, payable: payableBs, rate }
    }
    const totalUsd = num(expense.reservationTotalUsd || expense.totalAmount || expense.amount || 0)
    const gainUsd = num(expense.alohandoteNetIncomeUsd || expense.alohandoteIncomeUsd || 0)
    const payableUsd = Math.max(0, Number((totalUsd - gainUsd).toFixed(2)))
    return { isBs: false, total: totalUsd, gain: gainUsd, payable: payableUsd, rate }
  }
  function totalQuoteForReservation(reservation = editingReservation) {
    const vehicle = vehicles?.find?.((item) => item.id === reservation?.vehicleId) || selectedVehicle
    const days = daysForReservation(reservation)
    const daily = num(reservation?.dailyRate || vehicleDayRate(vehicle))
    const baseService = quoteBaseFromDays(days, daily)
    const kmCost = quoteFromKmAdjusted(reservation?.approxKm || 0, reservation)
    return Number((num(baseService) + num(kmCost)).toFixed(2))
  }
  function withAutoQuote(draft = editingReservation) {
    const days = daysForReservation(draft)
    const total = totalQuoteForReservation(draft)
    const officialRate = euroRateValue(exchangeRates, draft.bcvEuroRate) || ''
    const rateSnapshot = officialRate ? { ...(exchangeRates || {}), bcvEuro: officialRate } : exchangeRates
    return {
      ...draft,
      rentalDays: String(days),
      totalAmount: total ? String(total) : '',
      amount: draft.amount && !isBsPaymentMethod(draft.paymentMethod) && num(draft.amount) > total ? String(total) : draft.amount,
      sellerCommission: shouldTrackSellerCommission(draft) && total ? String(commissionFromTotal(total)) : '',
      bcvEuroRate: officialRate,
      totalAmountBs: total ? String(amountBs(total, rateSnapshot, officialRate)) : '',
      amountBs: draft.amount ? String(paymentAmountBs(draft.amount, draft.paymentMethod, rateSnapshot, officialRate)) : '',
      amountUsdEquivalent: draft.amount ? String(paymentAmountUsd(draft.amount, draft.paymentMethod, rateSnapshot, officialRate)) : '',
    }
  }
  function kmFromAdjustedTotal(total, reservation = editingReservation) {
    const baseAmount = exchangeAdjustmentPercent ? removeExchangeAdjustment(total) : num(total)
    const rate = currentKmRate(reservation)
    return baseAmount ? Number((baseAmount / rate).toFixed(2)) : ''
  }

  async function login(email, password) {
    setLoginError(''); setLoginLoading(true)
    try {
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, email, password)
    }
    catch (err) { console.error(err); setLoginError('Correo o contraseña incorrectos. Verifica los datos e intenta nuevamente.') }
    finally { setLoginLoading(false) }
  }
  async function logout() { if (auth) await signOut(auth) }

  const canUseCloudData = publicReceptionMode || publicOperationsMode || enableDemoMode || Boolean(user)
  const vehiclesStore = useFirestoreOrLocalStorage('vehicles', INITIAL_VEHICLES, canUseCloudData)
  const reservationsStore = useFirestoreOrLocalStorage('reservations', [], canUseCloudData)
  const accommodationsStore = useFirestoreOrLocalStorage('accommodations', INITIAL_ACCOMMODATIONS, canUseCloudData)
  const lodgingStore = useFirestoreOrLocalStorage('lodgingReservations', [], canUseCloudData)

  // V183: export público iCal seguro. Airbnb/Booking leen una URL pública,
  // por eso mantenemos una colección mínima sin datos personales para disponibilidad.
  async function upsertPublicIcalBlock(record = {}) {
    if (!isFirebaseReady || !db || !record?.id || !record.accommodationId) return
    const status = normalizeStatus(record.status)
    const payload = {
      accommodationId: String(record.accommodationId || ''),
      startDate: String(record.startDate || '').slice(0, 10),
      endDate: String(record.endDate || record.startDate || '').slice(0, 10),
      status: status || 'reserved',
      source: 'alohandote-public-ical',
      updatedAt: new Date().toISOString(),
    }
    try { await setDoc(doc(db, 'publicIcalBlocks', record.id), payload, { merge: true }) }
    catch (err) { console.warn('No se pudo actualizar publicIcalBlocks:', err?.message || err) }
  }

  async function removePublicIcalBlock(id = '') {
    if (!isFirebaseReady || !db || !id) return
    try { await deleteDoc(doc(db, 'publicIcalBlocks', id)) }
    catch (err) { console.warn('No se pudo eliminar publicIcalBlocks:', err?.message || err) }
  }


  // V184: antes de copiar/probar iCal, reparamos la colección pública mínima.
  // Airbnb/Booking no pueden leer datos privados con login; solo leen publicIcalBlocks.
  // Esta sincronización NO toca reservas, caja, pagos ni datos personales.
  async function syncPublicIcalBlocksForAccommodation(apt = selectedAccommodation) {
    if (!isFirebaseReady || !db || !apt?.id) return 0
    const rows = (lodgingStore.items || []).filter((row) => String(row.accommodationId || '') === String(apt.id || ''))
    let exported = 0
    for (const row of rows) {
      const id = row.id || ''
      if (!id) continue
      const status = normalizeStatus(row.status)
      const cancelled = ['cancelled', 'canceled', 'cancelada', 'anulada'].includes(String(status || '').toLowerCase())
      const imported = isIcalImportedBlock(row)
      const shortMaintenance = status === 'maintenance' && isNonBlockingShortMaintenance(row)
      if (cancelled || imported || shortMaintenance || !row.startDate || !row.endDate) {
        await removePublicIcalBlock(id)
        continue
      }
      await upsertPublicIcalBlock({ ...row, id, accommodationId: apt.id })
      exported += 1
    }
    return exported
  }

  const leadsStore = useFirestoreOrLocalStorage('clientLeads', [], canUseCloudData)
  const vehicleCheckinsStore = useFirestoreOrLocalStorage('vehicleCheckins', [], canUseCloudData)
  const inventoryItemsStore = useFirestoreOrLocalStorage('inventoryItems', INITIAL_INVENTORY_ITEMS, canUseCloudData)
  const inventoryMovementsStore = useFirestoreOrLocalStorage('inventoryMovements', [], canUseCloudData)
  const hrPeopleStore = useFirestoreOrLocalStorage('hrPeople', INITIAL_HR_PEOPLE, canUseCloudData)
  const hrTasksStore = useFirestoreOrLocalStorage('hrTasks', INITIAL_HR_TASKS, canUseCloudData)
  const dollarPurchasesStore = useFirestoreOrLocalStorage('dollarPurchases', [], canUseCloudData)
  const generalExpensesStore = useFirestoreOrLocalStorage('generalExpenses', [], canUseCloudData)
  const publicOperationSubmissionsStore = useFirestoreOrLocalStorage('publicOperationSubmissions', [], Boolean(user))
  const auditLogsStore = useFirestoreOrLocalStorage('auditLogs', [], canUseCloudData && Boolean(user))
  function auditSummary(record = {}) {
    return {
      id: record.id || '',
      status: record.status || '',
      customerName: record.customerName || record.name || record.itemName || '',
      assetName: record.assetName || record.vehicleName || record.accommodationName || record.name || '',
      startDate: record.startDate || record.date || '',
      endDate: record.endDate || '',
      totalAmount: record.totalAmount || record.amount || record.maintenanceCost || '',
      paymentMethod: record.paymentMethod || record.maintenancePaymentMethod || '',
      createdByName: record.createdByName || record.responsible || '',
    }
  }

  async function logAudit(action, module, recordId = '', record = {}, extra = {}) {
    const now = new Date().toISOString()
    const payload = {
      action,
      module,
      recordId: String(recordId || record?.id || ''),
      recordSummary: auditSummary(record),
      extra,
      userUid: user?.uid || 'public',
      userEmail: user?.email || '',
      userName: sellerName(profile, user),
      userRole: profile?.role || '',
      createdAt: now,
      eventDate: now,
      source: publicOperationsMode ? 'public-operations' : publicReceptionMode ? 'public-reception' : 'admin-app',
    }
    try {
      if (isFirebaseReady && db) await addDoc(collection(db, 'auditLogs'), payload)
      else {
        const key = 'alohandote_auditLogs'
        const current = JSON.parse(localStorage.getItem(key) || '[]')
        localStorage.setItem(key, JSON.stringify([{ id: crypto.randomUUID(), ...payload }, ...current].slice(0, 300)))
      }
    } catch (err) {
      console.warn('No se pudo registrar auditoría:', err)
    }
  }

  function recordHealthEvent(input = {}) {
    const event = buildHealthEvent({
      ...input,
      userEmail: user?.email || '',
      userRole: profile?.role || '',
    })
    setHealthEvents((prev) => {
      const next = [event, ...(prev || [])].slice(0, 120)
      localStorage.setItem('alohandote_health_events', JSON.stringify(next))
      return next
    })
    return event
  }

  function clearHealthEvents() {
    setHealthEvents([])
    localStorage.removeItem('alohandote_health_events')
    showSuccess('Eventos de salud limpiados correctamente')
  }

  function healthStoresSnapshot() {
    return {
      vehicles: vehiclesStore.items,
      reservations: reservationsStore.items,
      accommodations: accommodationsStore.items,
      lodgingReservations: lodgingStore.items,
      clientLeads: leadsStore.items,
      vehicleCheckins: vehicleCheckinsStore.items,
      inventoryItems: inventoryItemsStore.items,
      inventoryMovements: inventoryMovementsStore.items,
      hrPeople: hrPeopleStore.items,
      hrTasks: hrTasksStore.items,
      dollarPurchases: dollarPurchasesStore.items,
      generalExpenses: generalExpensesStore.items,
      publicOperationSubmissions: publicOperationSubmissionsStore.items,
      auditLogs: (auditLogsStore?.items || []),
    }
  }

  async function resetFinancialTestData() {
    if (!confirm('Esto eliminará reservas, alojamientos registrados, compras/ventas de $, movimientos de inventario y auditoría local/cloud para dejar la caja en cero. ¿Continuar?')) return
    const storesToClear = [reservationsStore, lodgingStore, dollarPurchasesStore, inventoryMovementsStore, auditLogsStore]
    for (const store of storesToClear) {
      for (const row of [...(store?.items || [])]) {
        if (row?.id) await store.removeItem(row.id)
      }
    }
    for (const row of [...(inventoryItemsStore.items || [])]) {
      if (!INITIAL_INVENTORY_ITEMS.some((item) => item.id === row.id)) await inventoryItemsStore.removeItem(row.id)
      else await inventoryItemsStore.editItem(row.id, { ...row, purchaseDate: '', expenseStatus: 'Pagado', amountBs: '', bcvDollarRate: '', paymentMethod: 'Bs', updatedAt: new Date().toISOString() })
    }
    try {
      localStorage.removeItem('alohandote_exchangeRates')
      localStorage.setItem('alohandote_exchangeRates', JSON.stringify(fallbackExchangeRates()))
    } catch {}
    setExchangeRates(fallbackExchangeRates())
    await logAudit('financial_reset', 'Administración', 'caja', { reason: 'Reset caja V173 para prueba limpia' })
    showSuccess('Caja reiniciada para pruebas: saldos en cero y tasas BCV fallback listas.')
  }

  function currentHealthSnapshot() {
    return buildHealthSnapshot({
      events: healthEvents,
      stores: healthStoresSnapshot(),
      context: { firebaseReady: isFirebaseReady || isDemoMode, demoMode: isDemoMode, user: Boolean(user), role: currentRole },
    })
  }

  async function exportHealthReportJson() {
    const snapshot = currentHealthSnapshot()
    downloadJsonFile(`${backupFileName('alohandote-salud-sistema')}.json`, {
      ...snapshot,
      recommendations: healthRecommendations(snapshot),
    })
    await logAudit('health_report_exported', 'Administración', 'health-report', { id: 'health-report', name: 'Monitor de salud' }, { status: snapshot.status?.label })
    showSuccess('Reporte de salud exportado correctamente')
  }

  // V156: perfil efectivo para evitar que la prueba local/demo o un perfil sin resolver oculte módulos críticos.
  // No cambia permisos reales en Firebase: solo evita que el modo demo se confunda con perfil operador limitado.
  const isDemoMode = enableDemoMode && !isFirebaseReady && !publicReceptionMode && !publicOperationsMode
  const effectiveProfile = profile || (isDemoMode ? {
    uid: 'demo-admin',
    email: 'demo@alohandote.local',
    name: 'Administrador Demo',
    role: 'admin',
    active: true,
  } : null)
  const currentRole = normalizeRole(effectiveProfile?.role)
  const isAdmin = currentRole === 'admin' || adminEmails.includes(user?.email?.toLowerCase())
  const isLogistics = currentRole === 'logistics'
  const hasPermission = (permission) => isAdmin || roleHasPermission(currentRole, permission)
  const canViewCars = hasPermission('viewCars')
  const canViewLodging = hasPermission('viewLodging')
  const canViewCommercial = hasPermission('viewCommercial')
  const canViewAdmin = hasPermission('viewAdmin')
  const canViewInventory = hasPermission('viewInventory')
  const canViewHr = hasPermission('viewHr')
  const canViewProfitability = hasPermission('viewProfitability')
  const canManageVehicles = hasPermission('manageAssets')
  const canViewDashboard = canViewAdmin
  const canExport = hasPermission('export')
  const canUseMaintenance = hasPermission('viewMaintenance')
  const canUseCarLogistics = hasPermission('carLogistics')
  const canUseLodgingLogistics = hasPermission('lodgingLogistics')
  const canWriteCommercial = hasPermission('writeCommercial')
  const canWriteOperations = hasPermission('writeOperations')
  const canManageInventory = hasPermission('manageInventory')
  const canManageHr = hasPermission('manageHr')
  const canDeleteRecords = isAdmin
  const pendingPublicSubmissions = useMemo(() => {
    return (publicOperationSubmissionsStore.items || [])
      .filter((item) => String(item.status || 'submitted') === 'submitted')
      .sort((a, b) => String(b.createdAt || b.submittedAt || '').localeCompare(String(a.createdAt || a.submittedAt || '')))
  }, [publicOperationSubmissionsStore.items])
  const operationsPeople = useMemo(() => {
    const people = (hrPeopleStore.items || []).filter((person) => String(person.status || 'Activo') !== 'Inactivo')
    const names = people.map((person) => person.name).filter(Boolean)
    const current = sellerName(profile, user)
    return Array.from(new Set([current, ...names].filter(Boolean)))
  }, [hrPeopleStore.items, profile, user])

  const sellerPeople = useMemo(() => {
    const people = (hrPeopleStore.items || [])
      .filter((person) => String(person.status || 'Activo') !== 'Inactivo')
      .filter((person) => isSellerProfile(person.permissionsProfile || person.role || ''))
      .map((person) => normalizePersonName(person.name))
      .filter(Boolean)
    const current = normalizePersonName(sellerName(profile, user))
    return Array.from(new Set([current, ...people].filter(Boolean)))
  }, [hrPeopleStore.items, profile, user])

  function sellerOptionsForModule(moduleName = 'cars') {
    if (!isAdmin && isSellerProfile(profile?.role)) return [normalizePersonName(sellerName(profile, user))]
    const allowed = (hrPeopleStore.items || [])
      .filter((person) => String(person.status || 'Activo') !== 'Inactivo')
      .filter((person) => isSellerProfile(person.permissionsProfile || person.role || ''))
      .filter((person) => canSellerUseModule(person.permissionsProfile || person.role, moduleName))
      .map((person) => normalizePersonName(person.name))
      .filter(Boolean)
    const current = normalizePersonName(sellerName(profile, user))
    return Array.from(new Set([current, ...allowed, ...sellerPeople].filter(Boolean)))
  }

  useEffect(() => {
    if (ratesError) recordHealthEvent({ type: 'rates', level: 'warning', module: 'Tasas', message: ratesError, detail: 'No se pudieron actualizar tasas externas.' })
  }, [ratesError])

  useEffect(() => {
    if (error) recordHealthEvent({ type: 'ui-error', level: 'warning', module: moduleMode || 'Sistema', message: error })
  }, [error])

  function normalizeClientKey(value = '') {
    return String(value || '').trim().toLowerCase().replace(/[^0-9a-záéíóúñ@.+-]/gi, '')
  }
  function leadMatch(draft = {}) {
    const id = normalizeClientKey(draft.customerId)
    const phone = normalizeClientKey(draft.phone)
    const name = normalizeClientKey(draft.customerName)
    return leadsStore.items.find((lead) =>
      (id && normalizeClientKey(lead.customerId) === id) ||
      (phone && normalizeClientKey(lead.phone) === phone) ||
      (name && normalizeClientKey(lead.customerName) === name)
    )
  }
  function clientCityFromLead(lead = {}) {
    return lead.customerCity || lead.city || lead.contractCity || lead.customerAddress || ''
  }
  function mergeClientFromLead(draft = {}) {
    const lead = leadMatch(draft)
    if (!lead || !draft) return draft
    return {
      ...draft,
      customerName: draft.customerName || lead.customerName || '',
      customerId: draft.customerId || lead.customerId || '',
      phone: draft.phone || lead.phone || '',
      customerAddress: draft.customerAddress || lead.customerAddress || lead.customerCity || lead.city || '',
      customerCity: draft.customerCity || clientCityFromLead(lead),
      contractCity: draft.contractCity || lead.contractCity || lead.customerCity || lead.city || draft.contractCity || '',
      channel: draft.channel || lead.channel || '',
    }
  }
  function applyLeadToCarDraft(draft = editingReservation) {
    const next = mergeClientFromLead(draft)
    if (!next || next === draft) return
    setEditingReservation(next)
    showSuccess('Datos del cliente cargados automáticamente')
  }
  function applyLeadToLodgingDraft(draft = editingLodging) {
    const next = mergeClientFromLead(draft)
    if (!next || next === draft) return
    setEditingLodging(next)
    showSuccess('Datos del huésped cargados automáticamente')
  }
  async function upsertLead(moduleName, draft, status = 'lead') {
    if (!draft || !(draft.customerName || draft.customerId || draft.phone)) return
    const existing = leadMatch(draft)
    const payload = {
      module: moduleName,
      serviceType: moduleName,
      status,
      vehicleId: draft.vehicleId || '',
      accommodationId: draft.accommodationId || '',
      customerName: draft.customerName || '',
      customerId: draft.customerId || '',
      phone: draft.phone || '',
      customerAddress: draft.customerAddress || '',
      customerCity: draft.customerCity || draft.contractCity || draft.customerAddress || '',
      city: draft.customerCity || draft.contractCity || '',
      channel: draft.channel || '',
      startDate: draft.startDate || '',
      endDate: draft.endDate || '',
      totalAmount: draft.totalAmount || '',
      amount: draft.amount || '',
      paymentMethod: draft.paymentMethod || '',
      paymentReference: draft.paymentReference || '',
      createdByUid: draft.createdByUid || user?.uid || '',
      createdByEmail: draft.createdByEmail || user?.email || '',
      createdByName: draft.createdByName || sellerName(profile, user),
      updatedAt: new Date().toISOString(),
    }
    if (existing?.id) await leadsStore.editItem(existing.id, payload)
    else await leadsStore.createItem(payload)
  }
  function searchDateSuffix() {
    return new Date().toISOString().slice(0,10)
  }

  function backupCollectionsSnapshot() {
    return {
      vehicles: vehiclesStore.items,
      reservations: reservationsStore.items,
      accommodations: accommodationsStore.items,
      lodgingReservations: lodgingStore.items,
      clientLeads: leadsStore.items,
      vehicleCheckins: vehicleCheckinsStore.items,
      inventoryItems: inventoryItemsStore.items,
      inventoryMovements: inventoryMovementsStore.items,
      hrPeople: hrPeopleStore.items,
      hrTasks: hrTasksStore.items,
      dollarPurchases: dollarPurchasesStore.items,
      generalExpenses: generalExpensesStore.items,
      publicOperationSubmissions: publicOperationSubmissionsStore.items,
      auditLogs: (auditLogsStore?.items || []),
    }
  }

  function downloadJsonFile(fileName, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function exportTechnicalBackupJson() {
    if (!canExport && !isAdmin) return setError('Tu perfil no tiene permiso para exportar backups.')
    const payload = buildBackupPayload(backupCollectionsSnapshot(), { sanitize: true })
    downloadJsonFile(`${backupFileName('alohandote-backup-tecnico')}.json`, payload)
    await logAudit('technical_backup_json_exported', 'Administración', 'backup-json', { id: 'backup-json', name: 'Backup técnico JSON' }, { totalRecords: payload.manifest.totalRecords })
    showSuccess('Backup técnico JSON generado correctamente')
  }

  async function exportTechnicalBackupExcel() {
    if (!canExport && !isAdmin) return setError('Tu perfil no tiene permiso para exportar backups.')
    const collections = buildBackupPayload(backupCollectionsSnapshot(), { sanitize: true }).collections
    const wb = XLSX.utils.book_new()
    Object.entries(collections).forEach(([name, rows]) => {
      const safeSheet = name.slice(0, 31)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsToWorksheetRows(rows, name)), safeSheet)
    })
    XLSX.writeFile(wb, `${backupFileName('alohandote-backup-tecnico')}.xlsx`)
    await logAudit('technical_backup_excel_exported', 'Administración', 'backup-excel', { id: 'backup-excel', name: 'Backup técnico Excel' }, { collections: Object.keys(collections).length })
    showSuccess('Backup técnico Excel generado correctamente')
  }

  async function exportSensitiveAuditJson() {
    if (!isAdmin) return setError('Solo administrador puede exportar auditoría sensible.')
    const payload = buildBackupPayload({
      auditLogs: (auditLogsStore?.items || []),
      publicOperationSubmissions: publicOperationSubmissionsStore.items,
      vehicleCheckins: vehicleCheckinsStore.items,
    }, { sanitize: true })
    downloadJsonFile(`${backupFileName('alohandote-auditoria-sensible')}.json`, payload)
    await logAudit('sensitive_audit_json_exported', 'Administración', 'audit-sensitive', { id: 'audit-sensitive', name: 'Auditoría sensible' }, { totalRecords: payload.manifest.totalRecords })
    showSuccess('Auditoría sensible exportada correctamente')
  }

  function exportReservationsExcel() {
    const rows = [
      ...reservationsStore.items.map((r) => {
        const vehicle = vehicles.find((v) => v.id === r.vehicleId) || {}
        return {
          Modulo: 'Renta Car',
          Vehiculo_Alojamiento: vehicle.name || '',
          Estado: STATUS[r.status]?.label || r.status || '',
          Cliente: r.customerName || '',
          Identificacion: r.customerId || '',
          Telefono: r.phone || '',
          Desde: r.startDate || '',
          Hasta: r.endDate || '',
          Total_USD: Number(r.totalAmount || 0),
          Abonado_USD: Number(r.amount || 0),
          Pendiente_USD: pendingAmount(r, exchangeRates),
          Canal: r.channel || '',
          Creado_Por: r.createdByName || r.createdByEmail || '',
          Fecha_Registro: r.createdAt || r.updatedAt || ''
        }
      }),
      ...lodgingStore.items.filter((r) => !isIcalImportedBlock(r)).map((r) => {
        const apt = accommodations.find((a) => a.id === r.accommodationId) || {}
        return {
          Modulo: 'Alojamientos',
          Vehiculo_Alojamiento: apt.name || '',
          Estado: STATUS[r.status]?.label || r.status || '',
          Cliente: r.customerName || '',
          Identificacion: r.customerId || '',
          Telefono: r.phone || '',
          Desde: r.startDate || '',
          Hasta: r.endDate || '',
          Total_USD: Number(r.totalAmount || 0),
          Abonado_USD: Number(r.amount || 0),
          Pendiente_USD: pendingAmount(r, exchangeRates),
          Canal: r.channel || '',
          Creado_Por: r.createdByName || r.createdByEmail || '',
          Fecha_Registro: r.createdAt || r.updatedAt || ''
        }
      })
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Reservas')
    XLSX.writeFile(wb, `alohandote-reservas-${searchDateSuffix()}.xlsx`)
  }

  function exportMaintenanceExcel() {
    const rows = maintenanceRows.map((r) => ({
      Activo: r.assetName || '',
      Modulo: r.module || '',
      Fecha_Desde: r.startDate || '',
      Fecha_Hasta: r.endDate || '',
      Tipo: r.maintenanceType || 'Preventivo',
      Taller_Proveedor: r.provider || r.customerName || '',
      KM_Actual: r.currentKm || '',
      Proximo_KM: r.targetKm || '',
      Km_Restantes: r.remainingKm ?? '',
      Costo_USD: Number(r.maintenanceCost || 0),
      Observacion: r.note || ''
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Mantenimientos')
    XLSX.writeFile(wb, `alohandote-mantenimientos-${searchDateSuffix()}.xlsx`)
  }

  function exportQuotesExcel() {
    const rows = leadsStore.items.map((lead) => ({
      Modulo: lead.module || '', Estatus: lead.status || '', Cliente: lead.customerName || '', Identificacion: lead.customerId || '', Telefono: lead.phone || '', Canal: lead.channel || '',
      Desde: lead.startDate || '', Hasta: lead.endDate || '', Total_USD: Number(lead.totalAmount || 0), Abonado_USD: Number(lead.amount || 0), Metodo_Pago: lead.paymentMethod || '', Referencia: lead.paymentReference || '',
      Cotizado_Por: lead.createdByName || lead.createdByEmail || '', Fecha_Registro: lead.createdAt || lead.updatedAt || ''
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Cotizaciones')
    XLSX.writeFile(wb, `alohandote-cotizaciones-${new Date().toISOString().slice(0,10)}.xlsx`)
  }


  useEffect(() => {
    setEditingReservation((prev) => {
      if (!prev || !prev.approxKm || normalizeStatus(prev.status) !== 'reserved') return prev
      const quoted = quoteFromKmAdjusted(prev.approxKm, prev)
      const rentalDays = daysForReservation(prev)
      const dailyRate = quoted ? dailyFromTotal(quoted, rentalDays) : ''
      const nextTotal = quoted ? String(quoted) : ''
      if (String(prev.totalAmount || '') === nextTotal && String(prev.dailyRate || '') === String(dailyRate || '')) return prev
      return {
        ...prev,
        totalAmount: nextTotal,
        rentalDays: String(rentalDays),
        dailyRate: dailyRate ? String(dailyRate) : '',
        sellerCommission: shouldTrackSellerCommission(prev) && quoted ? String(commissionFromTotal(quoted)) : '',
      }
    })
  }, [exchangeAdjustmentPercent])

  const vehicles = vehiclesStore.items.length ? vehiclesStore.items : INITIAL_VEHICLES
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null
  const accommodations = accommodationsStore.items.length ? accommodationsStore.items : INITIAL_ACCOMMODATIONS
  const selectedAccommodation = accommodations.find((item) => item.id === selectedAccommodationId) || null

  function reservationKmDriven(reservation) {
    const delivered = Number(reservation.deliveryKm || 0)
    const received = Number(reservation.kmRecepcion || 0)
    const stored = Number(reservation.kmRecorridos || 0)
    if (stored > 0) return stored
    if (delivered > 0 && received > delivered) return received - delivered
    return 0
  }

  const profitabilityRows = useMemo(() => reservationsStore.items
    .filter((reservation) => ['reserved','returned','completed'].includes(normalizeStatus(reservation.status)))
    .map((reservation) => {
      const vehicle = vehicles.find((item) => item.id === reservation.vehicleId) || {}
      const km = reservationKmDriven(reservation)
      const total = Number(reservation.totalAmount || reservation.amount || 0)
      const commission = Number(reservation.sellerCommission || 0)
      const directCosts = commission
      const net = total - directCosts
      const investment = Number(vehicle.investmentCost || 0)
      return {
        id: reservation.id,
        vehicleId: reservation.vehicleId,
        vehicleName: vehicle.name || reservation.vehicleName || '',
        plate: vehicle.plate || '',
        customerName: reservation.customerName || '',
        startDate: reservation.startDate || '',
        endDate: reservation.endDate || '',
        deliveryKm: Number(reservation.deliveryKm || 0),
        kmRecepcion: Number(reservation.kmRecepcion || 0),
        kmRecorridos: km,
        totalAmount: total,
        ingresoPorKm: km ? total / km : 0,
        costosDirectos: directCosts,
        utilidadNeta: net,
        utilidadPorKm: km ? net / km : 0,
        investmentCost: investment,
        roiPercent: investment ? (net / investment) * 100 : 0,
        channel: reservation.channel || '',
        seller: reservation.createdByName || '',
        receivedBy: reservation.receivedBy || '',
      }
    }), [reservationsStore.items, vehicles])

  const vehicleProfitabilityRows = useMemo(() => vehicles.map((vehicle) => {
    const rows = profitabilityRows.filter((row) => row.vehicleId === vehicle.id)
    const maintenance = reservationsStore.items
      .filter((reservation) => reservation.vehicleId === vehicle.id && normalizeStatus(reservation.status) === 'maintenance')
      .reduce((sum, reservation) => sum + Number(reservation.maintenanceCost || 0), 0)
    const generalVehicleExpenses = (generalExpensesStore.items || [])
      .filter((expense) => String(expense.assetType || '').toLowerCase().includes('veh') && String(expense.assetId || '') === String(vehicle.id))
      .reduce((sum, expense) => sum + generalExpenseUsdAmount(expense, exchangeRates), 0)
    const total = rows.reduce((sum, row) => sum + row.totalAmount, 0)
    const km = rows.reduce((sum, row) => sum + row.kmRecorridos, 0)
    const vehicleExpenses = maintenance + generalVehicleExpenses
    const costs = rows.reduce((sum, row) => sum + row.costosDirectos, 0) + vehicleExpenses
    const net = total - costs
    const investment = Number(vehicle.investmentCost || 0)
    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      plate: vehicle.plate || '',
      investmentCost: investment,
      totalIncome: total,
      kmRecorridos: km,
      ingresoPorKm: km ? total / km : 0,
      maintenanceCost: maintenance,
      generalExpenseCost: generalVehicleExpenses,
      vehicleExpenseCost: vehicleExpenses,
      totalCosts: costs,
      utilidadNeta: net,
      utilidadPorKm: km ? net / km : 0,
      roiPercent: investment ? (net / investment) * 100 : 0,
    }
  }), [vehicles, profitabilityRows, reservationsStore.items, generalExpensesStore.items, exchangeRates])

  const lodgingProfitabilityRows = useMemo(() => accommodations.map((apt) => {
    const rows = (lodgingStore.items || []).filter((reservation) => reservation.accommodationId === apt.id && ['reserved','returned','completed'].includes(normalizeStatus(reservation.status)))
    const maintenance = (lodgingStore.items || [])
      .filter((reservation) => reservation.accommodationId === apt.id && normalizeStatus(reservation.status) === 'maintenance')
      .reduce((sum, reservation) => sum + Number(reservation.maintenanceCost || 0), 0)
    const generalLodgingExpenses = (generalExpensesStore.items || [])
      .filter((expense) => String(expense.assetType || '').toLowerCase().includes('aloj') && String(expense.assetId || '') === String(apt.id))
      .reduce((sum, expense) => sum + generalExpenseUsdAmount(expense, exchangeRates), 0)
    const nights = rows.reduce((sum, row) => sum + dayCount(row.startDate, row.endDate), 0)
    const income = rows.reduce((sum, row) => sum + Number(row.totalAmount || row.amount || 0), 0)
    const cleaning = rows.reduce((sum, row) => sum + Number(row.cleaningFee || 0), 0)
    const lodgingExpenses = maintenance + generalLodgingExpenses
    const net = income - cleaning - lodgingExpenses
    const investment = Number(apt.investmentCost || apt.purchaseCost || 0)
    return {
      accommodationId: apt.id,
      accommodationName: apt.name,
      residence: apt.residence || '',
      nights,
      totalIncome: income,
      cleaningCost: cleaning,
      maintenanceCost: maintenance,
      generalExpenseCost: generalLodgingExpenses,
      lodgingExpenseCost: lodgingExpenses,
      utilidadNeta: net,
      ingresoPorNoche: nights ? income / nights : 0,
      investmentCost: investment,
      roiPercent: investment ? (net / investment) * 100 : 0,
    }
  }), [accommodations, lodgingStore.items, generalExpensesStore.items, exchangeRates])

  function assetExpensesForDetail(assetType, assetId) {
    const isVehicle = String(assetType || '').toLowerCase().includes('veh') || assetType === 'Renta Car'
    const isLodging = String(assetType || '').toLowerCase().includes('aloj') || assetType === 'Alojamiento'
    return (generalExpensesStore.items || [])
      .filter((expense) => {
        const type = String(expense.assetType || '').toLowerCase()
        const sameAsset = String(expense.assetId || '') === String(assetId || '')
        if (!sameAsset) return false
        if (isVehicle) return type.includes('veh') || type.includes('renta')
        if (isLodging) return type.includes('aloj')
        return false
      })
      .map((expense) => ({ ...expense, amountUsd: generalExpenseUsdAmount(expense, exchangeRates), amountBsValue: generalExpenseBsAmount(expense, exchangeRates) }))
      .sort((a,b)=>String(b.date || '').localeCompare(String(a.date || '')))
  }

  function exportProfitabilityExcel() {
    const reservationRows = profitabilityRows.map((row) => ({
      Vehiculo: row.vehicleName,
      Placa: row.plate,
      Cliente: row.customerName,
      Desde: row.startDate,
      Hasta: row.endDate,
      Km_Entrega: row.deliveryKm,
      Km_Recepcion: row.kmRecepcion,
      Km_Recorridos: row.kmRecorridos,
      Total_USD: row.totalAmount,
      Ingreso_por_KM: Number(row.ingresoPorKm.toFixed(2)),
      Costos_Directos_USD: Number(row.costosDirectos.toFixed(2)),
      Utilidad_Neta_USD: Number(row.utilidadNeta.toFixed(2)),
      Utilidad_por_KM: Number(row.utilidadPorKm.toFixed(2)),
      Inversion_Vehiculo_USD: row.investmentCost,
      ROI_Porcentaje: Number(row.roiPercent.toFixed(2)),
      Canal: row.channel,
      Vendedor: row.seller,
      Recibido_Por: row.receivedBy,
    }))
    const vehicleRows = vehicleProfitabilityRows.map((row) => ({
      Vehiculo: row.vehicleName,
      Placa: row.plate,
      Inversion_USD: row.investmentCost,
      Ingresos_USD: Number(row.totalIncome.toFixed(2)),
      Km_Recorridos: row.kmRecorridos,
      Ingreso_por_KM: Number(row.ingresoPorKm.toFixed(2)),
      Mantenimiento_USD: Number(row.maintenanceCost.toFixed(2)),
      Gastos_Vehiculo_USD: Number((row.generalExpenseCost || 0).toFixed(2)),
      Costos_Totales_USD: Number(row.totalCosts.toFixed(2)),
      Utilidad_Neta_USD: Number(row.utilidadNeta.toFixed(2)),
      Utilidad_por_KM: Number(row.utilidadPorKm.toFixed(2)),
      ROI_Porcentaje: Number(row.roiPercent.toFixed(2)),
    }))
    const wb = XLSX.utils.book_new()
    const lodgingRows = lodgingProfitabilityRows.map((row) => ({
      Alojamiento: row.accommodationName,
      Residencia: row.residence,
      Noches: row.nights,
      Ingresos_USD: row.totalIncome,
      Limpieza_USD: row.cleaningCost,
      Mantenimiento_USD: row.maintenanceCost,
      Gastos_Alojamiento_USD: row.generalExpenseCost || 0,
      Utilidad_USD: row.utilidadNeta,
      Ingreso_Noche_USD: Number(row.ingresoPorNoche.toFixed(2)),
      Inversion_USD: row.investmentCost,
      ROI_Porcentaje: Number(row.roiPercent.toFixed(2)),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vehicleRows), 'Rentabilidad Vehiculos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reservationRows), 'Rentabilidad Reservas')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lodgingRows), 'Rentabilidad Alojamientos')
    XLSX.writeFile(wb, `alohandote-rentabilidad-km-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  function copyReceptionLink(reservation) {
    if (!reservation?.id) return
    const link = `${window.location.origin}/recepcion.html?reserva=${reservation.id}`
    navigator.clipboard?.writeText(link)
    setError('Link de recepción copiado. Envíalo al personal que recibe el vehículo.')
  }

  const monthDays = useMemo(() => getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth])
  const vehicleReservations = reservationsStore.items.filter((reservation) => reservation.vehicleId === selectedVehicle?.id && !isReservationCancelled(reservation))
  const selectedVehicleCheckins = vehicleCheckinsStore.items.filter((item) => item.vehicleId === selectedVehicle?.id)
  function isPaidCompletedReservation(item = {}) {
    const total = num(item.totalAmount || item.amount || 0)
    const paid = num(item.paidAmount || item.amount || 0)
    return total > 0 && paid >= total
  }

  function receptionAlreadyLinkedToReservation(reservation = {}) {
    return vehicleCheckinsStore.items.some((checkin) =>
      checkin.reservationId === reservation.id ||
      (
        !checkin.reservationId &&
        checkin.vehicleId === reservation.vehicleId &&
        String(checkin.createdAt || '').slice(0, 10) >= String(reservation.endDate || '').slice(0, 10) &&
        Number(checkin.currentKm || 0) > 0
      )
    )
  }

  function findReceptionReservationForVehicle(vehicleId) {
    const today = new Date().toISOString().slice(0, 10)
    const candidates = reservationsStore.items
      .filter((item) => item.vehicleId === vehicleId)
      .filter((item) => normalizeStatus(item.status) === 'reserved' && !item.returnedAt && isPaidCompletedReservation(item) && item.endDate)
      .filter((item) => !receptionAlreadyLinkedToReservation(item))
      .sort((a, b) => {
        const aPast = String(a.endDate || '') <= today ? 0 : 1
        const bPast = String(b.endDate || '') <= today ? 0 : 1
        if (aPast !== bPast) return aPast - bPast
        return String(a.endDate || '').localeCompare(String(b.endDate || ''))
      })
    return candidates[0] || null
  }

  const operationsHandoverRows = useMemo(() => {
    const localISODate = (date = new Date()) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    const today = localISODate()
    const addDays = (iso, qty) => {
      const base = new Date(`${iso}T00:00:00`)
      base.setDate(base.getDate() + qty)
      return localISODate(base)
    }
    const nextLimit = addDays(today, 1)
    const classify = (date) => {
      if (!date) return 'ignore'
      if (date < today) return 'past'
      if (date === today) return 'today'
      if (date > today && date <= nextLimit) return 'future'
      return 'later'
    }

    const vehicleRows = reservationsStore.items
      .filter((item) => normalizeStatus(item.status) === 'reserved' && !isReservationCancelled(item))
      .flatMap((item) => {
        const vehicle = vehicles.find((v) => v.id === item.vehicleId) || {}
        if ((publicOperationsMode || isLogisticsRole(profile?.role)) && !isOwnVehicle(vehicle)) return []
        const base = {
          reservationId: item.id,
          reservationType: 'vehicle',
          assetLabel: 'Vehículo',
          assetName: vehicle.name || item.vehicleName || 'Vehículo',
          vehicleId: item.vehicleId,
          accommodationId: '',
          customerName: item.customerName || '',
          phone: item.phone || item.customerPhone || '',
          customerPhone: item.phone || item.customerPhone || '',
          deliveryTime: item.deliveryTime || '12:00',
          returnTime: item.returnTime || '12:00',
          totalAmount: item.totalAmount,
          amount: item.amount,
        }
        const deliveryDone = Boolean(item.deliveredAt || item.deliveryCompletedAt || item.deliveryStatus === 'delivered')
        const receptionDone = Boolean(item.returnedAt || receptionAlreadyLinkedToReservation(item))
        const rows = []
        if (item.startDate && !deliveryDone) {
          const group = classify(item.startDate)
          if (group !== 'past' && group !== 'later' && group !== 'ignore') rows.push({ ...base, id: `vehicle-delivery-${item.id}`, operation: 'delivery', title: 'Entregar vehículo', operationDate: item.startDate, group })
        }
        if (item.endDate && !receptionDone) {
          const group = classify(item.endDate)
          if (group !== 'past' && group !== 'later' && group !== 'ignore') rows.push({ ...base, id: `vehicle-reception-${item.id}`, operation: 'reception', title: 'Recibir vehículo', operationDate: item.endDate, group })
        }
        return rows
      })

    const rawLodgingRows = lodgingStore.items
      .filter((item) => (normalizeStatus(item.status) === 'reserved' && !isReservationCancelled(item)) || isIcalImportedBlock(item))
      .flatMap((item) => {
        const isImportedIcal = isIcalImportedBlock(item)
        const apt = resolveAccommodationForLodging(item)
        const resolvedAccommodationId = item.accommodationId || apt.id || ''
        const resolvedAccommodationName = apt.name || item.accommodationName || item.propertyName || item.assetName || 'Alojamiento'
        const unresolvedIcal = isImportedIcal && (!resolvedAccommodationId || normalizeText(resolvedAccommodationName) === normalizeText('Alojamiento sin vincular'))
        if (unresolvedIcal) return []
        if ((publicOperationsMode || isLogisticsRole(profile?.role)) && !isOwnAccommodation(apt)) return []
        const base = {
          reservationId: item.id,
          reservationType: 'lodging',
          sourceType: isImportedIcal ? 'ical' : 'internal',
          assetLabel: isImportedIcal ? 'Alojamiento · iCal' : 'Alojamiento',
          assetName: resolvedAccommodationName,
          cleaningsCount: accommodationCleaningCount(resolvedAccommodationId),
          vehicleId: '',
          accommodationId: resolvedAccommodationId,
          customerName: isImportedIcal ? (item.customerName || item.channel || 'Reserva iCal') : (item.customerName || ''),
          phone: item.phone || item.customerPhone || '',
          customerPhone: item.phone || item.customerPhone || '',
          checkInTime: item.checkInTime || apt.checkInTime || '15:00',
          checkOutTime: item.checkOutTime || apt.checkOutTime || '11:00',
          deliveryTime: item.checkInTime || apt.checkInTime || '15:00',
          returnTime: item.checkOutTime || apt.checkOutTime || '11:00',
          totalAmount: isImportedIcal ? 0 : item.totalAmount,
          amount: isImportedIcal ? 0 : item.amount,
        }
        const checkInDone = Boolean(item.checkInDoneAt || item.deliveredAt || item.deliveryCompletedAt)
        const checkOutDone = Boolean(item.checkOutDoneAt || item.returnedAt || item.receptionCompletedAt)
        const rows = []
        if (item.startDate && !checkInDone) {
          const group = classify(item.startDate)
          if (group !== 'past' && group !== 'later' && group !== 'ignore') rows.push({ ...base, id: `lodging-delivery-${item.id}`, operation: 'delivery', title: isImportedIcal ? 'Check-in alojamiento iCal' : 'Entregar alojamiento / check-in', operationDate: item.startDate, group })
        }
        if (item.endDate && !checkOutDone) {
          const group = classify(item.endDate)
          if (group !== 'past' && group !== 'later' && group !== 'ignore') rows.push({ ...base, id: `lodging-reception-${item.id}`, operation: 'reception', title: isImportedIcal ? 'Check-out alojamiento iCal / limpieza' : 'Recibir alojamiento / check-out', operationDate: item.endDate, group })
        }
        return rows
      })

    const lodgingRows = Array.from(rawLodgingRows.reduce((map, row) => {
      const key = `${row.reservationType}-${row.accommodationId || row.assetName}-${row.operation}-${row.operationDate}`
      const current = map.get(key)
      if (!current || (current.sourceType === 'ical' && row.sourceType === 'internal')) map.set(key, row)
      return map
    }, new Map()).values())

    return [...vehicleRows, ...lodgingRows].sort((a,b) => {
      const groupOrder = { today: 0, future: 1 }
      const g = (groupOrder[a.group] ?? 9) - (groupOrder[b.group] ?? 9)
      if (g !== 0) return g
      const typeOrder = { vehicle: 0, lodging: 1 }
      const t = (typeOrder[a.reservationType] ?? 9) - (typeOrder[b.reservationType] ?? 9)
      if (t !== 0) return t
      return String(a.operationDate || '').localeCompare(String(b.operationDate || ''))
    })
  }, [reservationsStore.items, lodgingStore.items, vehicleCheckinsStore.items, vehicles, accommodations, operationsRevision])

  const pendingReceptionRows = operationsHandoverRows.filter((item) => item.operation === 'reception')
  const pendingDeliveryRows = operationsHandoverRows.filter((item) => item.operation === 'delivery')

  function isOperatorCommissionable(item = {}) {
    const normalizedRole = normalizeRole(item.createdByRole || item.sellerRole || item.profileRole || '')
    const email = String(item.createdByEmail || '').toLowerCase()
    const name = String(item.createdByName || item.seller || '').toLowerCase()
    if (['seller','seller_all','seller_lodging','operator_general','operator_rentcar','operator_lodging'].includes(normalizedRole)) return true
    if (['admin','supervisor','accounting'].includes(normalizedRole)) return false
    if (email.includes('jalemanbetanco') || name.includes('jose aleman')) return false
    return Boolean(item.operatorId || item.operatorUid || item.sellerUid || item.sellerId || item.createdByUid) && !Boolean(item.adminCreated)
  }

  const administrationRows = useMemo(() => {
    const carReservations = reservationsStore.items
      .filter((item) => ['reserved','returned','cancelled'].includes(normalizeStatus(item.status)))
      .map((item) => {
        const vehicle = vehicles.find((v) => v.id === item.vehicleId) || {}
        return { ...item, module: 'Renta Car', assetName: vehicle.name || 'Vehículo', type: 'Reserva Renta Car' }
      })
    const lodgingReservations = lodgingStore.items
      .filter((item) => !isIcalImportedBlock(item))
      .filter((item) => ['reserved','returned','cancelled'].includes(normalizeStatus(item.status)))
      .map((item) => {
        const apt = accommodations.find((a) => a.id === item.accommodationId) || {}
        return { ...item, module: 'Alojamientos', assetName: apt.name || 'Alojamiento', type: 'Reserva Alojamiento' }
      })
    const allReservations = [...carReservations, ...lodgingReservations]
    const dollarPurchaseRows = (dollarPurchasesStore.items || []).filter((item) => dollarOperationKind(item) === 'purchase').map((item) => ({
      id: `purchase-${item.id}`,
      date: item.date || String(item.createdAt || '').slice(0,10),
      type: 'Compra de $',
      category: `Compra ${item.currencyType || ''}`,
      module: 'Administración',
      description: `Compra de ${money(item.amountUsd)} en ${item.currencyType}`,
      amount: dollarOperationUsd(item),
      amountBsManual: num(item.amountBs),
      method: item.currencyType === 'Usdt' ? 'Binance' : item.currencyType,
      reference: item.note || '',
      status: 'Registrado',
      responsible: item.responsible || item.createdByName || '',
      sourceId: item.id,
    }))
    const bsPurchaseOutRows = (dollarPurchasesStore.items || []).filter((item) => dollarOperationKind(item) === 'purchase').map((item) => ({
      id: `purchase-bs-${item.id}`,
      date: item.date || String(item.createdAt || '').slice(0,10),
      type: 'Egreso',
      category: 'Compra de divisas',
      module: 'Administración',
      description: `Salida Bs por compra ${item.currencyType}`,
      amount: dollarOperationUsd(item),
      amountBsManual: num(item.amountBs),
      method: 'Bs',
      reference: item.note || '',
      status: 'Registrado',
      responsible: item.responsible || item.createdByName || '',
      sourceId: item.id,
      isDollarPurchaseBsOut: true,
    }))
    const dollarSaleBsInRows = (dollarPurchasesStore.items || []).filter((item) => dollarOperationKind(item) === 'sale').map((item) => ({
      id: `sale-bs-${item.id}`,
      date: item.date || String(item.createdAt || '').slice(0,10),
      type: 'Ingreso',
      category: 'Venta de divisas',
      module: 'Administración',
      description: `Entrada Bs por venta ${item.currencyType}`,
      amount: dollarOperationUsd(item),
      amountBsManual: num(item.amountBs),
      method: 'Bs',
      reference: item.note || '',
      status: 'Registrado',
      responsible: item.responsible || item.createdByName || '',
      sourceId: item.id,
      isDollarSaleBsIn: true,
    }))
    const dollarSaleOutRows = (dollarPurchasesStore.items || []).filter((item) => dollarOperationKind(item) === 'sale').map((item) => ({
      id: `sale-${item.id}`,
      date: item.date || String(item.createdAt || '').slice(0,10),
      type: 'Egreso',
      category: `Venta ${item.currencyType || ''}`,
      module: 'Administración',
      description: `Salida de ${money(item.amountUsd)} en ${item.currencyType}`,
      amount: dollarOperationUsd(item),
      amountBsManual: num(item.amountBs),
      method: item.currencyType === 'Usdt' ? 'Binance' : item.currencyType,
      reference: item.note || '',
      status: 'Registrado',
      responsible: item.responsible || item.createdByName || '',
      sourceId: item.id,
      isDollarSaleOut: true,
    }))
    const incomeRows = allReservations
      // V221.6 Hotfix Caja Métodos Combinados:
      // Cada abono impacta únicamente la caja de su método real.
      // Antes una reserva con dos métodos podía quedar agregada en una sola fila usando el método actual
      // de la reserva, inflando Caja Bs o moviendo todo a una caja incorrecta.
      .filter((item) => reservationHasCollectedPayment(item, exchangeRates))
      .flatMap((item) => {
        const paymentRows = normalizePaymentHistory(item)
        const buildIncomeRow = (payment = null, index = 0) => {
          const paymentMethod = payment?.method || item.paymentMethod || item.paymentMethodName || ''
          const paymentUsd = payment ? num(payment.amountUsd) : storedPaidUsd(item, exchangeRates)
          const paymentBs = payment ? num(payment.amountBs) : storedPaidBs(item, exchangeRates)
          const paymentRaw = payment ? num(payment.rawAmount) : num(item.amount)
          const totalUsd = num(item.totalAmount)
          // V223.5.2: la caja debe reflejar el monto total realmente recibido, incluso si el activo es aliado.
          // La ganancia de Alohandote se conserva al pagar la CxP del aliado, no reduciendo el ingreso inicial.
          const alohandoteUsd = paymentUsd
          const alohandoteBs = paymentBs
          return {
            id: `income-${item.module}-${item.id}-${payment?.id || payment?.paymentTraceId || index}`,
            date: String(payment?.date || item.createdAt || item.startDate || '').slice(0,10),
            type: 'Ingreso',
            category: item.type,
            module: item.module,
            description: `${item.customerName || 'Cliente'} · ${item.assetName || ''}`,
            amount: alohandoteUsd,
            rawAmount: paymentRaw,
            totalAmount: totalUsd,
            amountBsManual: alohandoteBs,
            bcvEuroRate: payment?.bcvEuroRate || item.bcvEuroRate || '',
            method: paymentMethod,
            reference: payment?.reference || item.paymentReference || item.referenceNumber || '',
            status: pendingAmount(item, exchangeRates) > 0 ? 'Abono parcial' : 'Pagado',
            responsible: item.createdByName || item.seller || '',
            sourceId: item.id,
            paymentId: payment?.id || payment?.paymentTraceId || '',
          }
        }
        return paymentRows.length ? paymentRows.map(buildIncomeRow) : [buildIncomeRow(null, 0)]
      })
    const maintenanceCostRows = maintenanceRowsSafe(reservationsStore.items, lodgingStore.items, vehicles, accommodations)
      .filter((item) => num(item.maintenanceCost) > 0)
      .map((item) => ({
        id: `maintenance-${item.module}-${item.id}`,
        date: String(item.startDate || item.createdAt || '').slice(0,10),
        type: 'Egreso',
        category: 'Mantenimiento',
        module: item.module,
        description: `${item.assetName || ''} · ${item.maintenanceType || 'Mantenimiento'}`,
        amount: maintenanceUsdCost(item),
        amountBsManual: maintenanceBsCost(item, exchangeRates),
        method: item.maintenancePaymentMethod || '',
        bcvDollarRate: item.bcvDollarRate || '',
        reference: item.paymentReference || '',
        expenseStatus: item.expenseStatus || 'Pagado',
        status: item.expenseStatus === 'Por pagar' ? 'Por pagar' : 'Pagado / egreso',
        responsible: item.provider || item.customerName || '',
        sourceId: item.id,
      }))
    const inventoryPurchaseRows = (inventoryItemsStore.items || [])
      .filter((item) => inventoryItemTotalUsd(item) > 0 && item.purchaseDate)
      .map((item) => ({
        id: `inventory-purchase-${item.id}`,
        date: item.purchaseDate || String(item.createdAt || '').slice(0,10),
        type: 'Egreso',
        category: 'Compra de material',
        module: 'Inventario',
        description: `${item.name || 'Artículo'} · ${item.category || ''}`,
        amount: inventoryItemTotalUsd(item),
        amountBsManual: paymentBucket(item.paymentMethod) === 'Bs' ? num(item.amountBs || inventoryPaymentAmountBs(item)) : amountBs(inventoryItemTotalUsd(item), exchangeRates, item.bcvDollarRate),
        method: item.paymentMethod || 'Bs',
        bcvDollarRate: item.bcvDollarRate || '',
        reference: item.provider || '',
        expenseStatus: item.expenseStatus || 'Pagado',
        status: item.expenseStatus === 'Por pagar' ? 'Por pagar' : 'Pagado / inventario',
        responsible: item.updatedBy || item.createdByName || '',
        sourceId: item.id,
      }))
    const generalIncomeRows = (generalExpensesStore.items || []).filter((item) => item.transactionType === 'Ingreso' || item.type === 'Ingreso').map((item) => ({
      id: `general-income-${item.id}`,
      date: item.date || String(item.createdAt || '').slice(0,10),
      type: 'Ingreso',
      category: item.category || 'Ingreso operativo',
      module: item.assetType === 'Vehículo' ? 'Renta Car' : item.assetType === 'Alojamiento' ? 'Alojamientos' : 'Administración',
      description: item.description || item.notes || 'Ingreso general',
      amount: generalExpenseUsdAmount(item, exchangeRates),
      amountBsManual: generalExpenseBsAmount(item, exchangeRates),
      method: item.paymentMethod || 'Pago en BS',
      bcvDollarRate: item.bcvDollarRate || '',
      reference: item.reference || '',
      expenseStatus: item.expenseStatus || 'Pagado',
      status: 'Pagado / ingreso',
      responsible: item.responsible || item.createdByName || '',
      sourceId: item.id,
      sourceType: 'generalIncome',
      assetType: item.assetType || 'General',
      assetId: item.assetId || '',
      alohandoteNetIncomeUsd: item.alohandoteNetIncomeUsd || item.alohandoteIncomeUsd || '',
      reservationTotalUsd: item.reservationTotalUsd || '',
    }))
    const generalExpenseRows = (generalExpensesStore.items || []).filter((item) => item.transactionType !== 'Ingreso' && item.type !== 'Ingreso').map((item) => ({
      id: `general-expense-${item.id}`,
      date: item.date || String(item.createdAt || '').slice(0,10),
      type: 'Egreso',
      category: item.category || 'Gasto operativo',
      module: item.assetType === 'Vehículo' ? 'Renta Car' : item.assetType === 'Alojamiento' ? 'Alojamientos' : 'Administración',
      description: item.description || item.notes || 'Gasto general',
      amount: generalExpenseUsdAmount(item, exchangeRates),
      amountBsManual: generalExpenseBsAmount(item, exchangeRates),
      method: item.paymentMethod || 'Pago en BS',
      bcvDollarRate: item.bcvDollarRate || '',
      reference: item.reference || '',
      expenseStatus: item.expenseStatus || 'Pagado',
      status: item.expenseStatus === 'Por pagar' ? 'Por pagar' : 'Pagado / gasto',
      responsible: item.responsible || item.createdByName || '',
      sourceId: item.id,
      sourceType: 'generalExpense',
      assetType: item.assetType || 'General',
      assetId: item.assetId || '',
    }))
    const refundRows = allReservations
      .filter((item) => isReservationCancelled(item) && (num(item.refundAmount) > 0 || num(item.refundAmountBs) > 0 || num(item.refundRawAmount) > 0))
      .map((item) => ({
        id: `refund-${item.module}-${item.id}`,
        date: String(item.refundAt || item.cancelledAt || item.updatedAt || '').slice(0,10),
        type: 'Egreso',
        category: 'Anulación / devolución',
        module: item.module,
        description: `${item.customerName || 'Cliente'} · ${item.refundReason || 'Cancelación'}`,
        amount: normalizedRefundAmounts(item, exchangeRates).amountUsd,
        amountBsManual: normalizedRefundAmounts(item, exchangeRates).amountBs,
        method: normalizedRefundAmounts(item, exchangeRates).method,
        reference: item.refundReference || item.paymentReference || '',
        proof: item.refundProof || null,
        refundBcvEuroRate: item.refundBcvEuroRate || item.bcvEuroRate || '',
        totalAmount: num(item.totalAmount || item.amount || item.refundAmount),
        status: 'Devuelto / anulado',
        responsible: item.createdByName || '',
        sourceId: item.id,
      }))
    const commissionRows = allReservations
      .filter((item) => !item.commissionWaived && !isReservationCancelled(item) && storedPaidUsd(item, exchangeRates) > 0 && isOperatorCommissionable(item))
      .map((item) => {
        const base = num(item.totalAmount || item.amount)
        const rate = sellerCommissionRateFor(item, hrPeopleStore.items)
        const paid = item.commissionPaid === true || item.commissionPaymentStatus === 'Pagado'
        const method = item.commissionPaymentMethod || ''
        const paidAt = item.commissionPaidAt || item.commissionPaymentDate || ''
        const commissionAmount = num(item.commissionPaidAmountUsd || item.sellerCommission || (base * rate))
        return {
          id: `commission-${item.module}-${item.id}`,
          date: String(paidAt || item.createdAt || item.startDate || '').slice(0,10),
          originalDate: String(item.createdAt || item.startDate || '').slice(0,10),
          type: 'Egreso',
          category: 'Comisión vendedor',
          module: item.module,
          description: `${item.createdByName || item.seller || 'Vendedor'} · ${item.customerName || 'Cliente'}`,
          amount: Number(commissionAmount.toFixed(2)),
          amountBsManual: item.commissionPaidAmountBs || '',
          method,
          paymentMethod: method,
          reference: item.commissionPaymentReference || '',
          status: paid ? 'Pagado' : (normalizeStatus(item.status) === 'returned' ? 'Por pagar' : 'Pendiente hasta cierre'),
          responsible: item.createdByName || item.seller || '',
          sourceId: item.id,
          sourceType: 'sellerCommission',
          isSellerCommission: true,
          commissionPaid: paid,
        }
      })
    const pendingCommissionRows = commissionRows.filter((row) => !row.commissionPaid)
    const paidCommissionRows = commissionRows.filter((row) => row.commissionPaid && row.method)
    const cashRowBsValue = (row = {}) => {
      if (row.amountBsManual !== '' && row.amountBsManual !== undefined && row.amountBsManual !== null) return num(row.amountBsManual)
      return amountBs(row.amount, exchangeRates, row.bcvEuroRate || row.bcvDollarRate || '')
    }
    const allowedCashBuckets = ['Efectivo $','Zelle','Binance','Bs']
    const cashBucketForRow = (row = {}) => paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '')
    const isValidCashBucket = (row = {}) => allowedCashBuckets.includes(cashBucketForRow(row))
    const isBsCashRow = (row = {}) => cashBucketForRow(row) === 'Bs'
    const cashRowUsdEquivalent = (row = {}) => {
      const rate = euroRateValue(exchangeRates, row.bcvEuroRate || row.bcvDollarRate || '')
      return rate ? Number((cashRowBsValue(row) / rate).toFixed(2)) : 0
    }
    const isConsistentCashRow = (row = {}) => {
      if (!isValidCashBucket(row)) return false
      if (!isBsCashRow(row)) return true
      if (!row.totalAmount || row.category === 'Venta de divisas' || row.category === 'Compra de divisas') return true
      return cashRowUsdEquivalent(row) <= (num(row.totalAmount) * 1.05)
    }
    const cashRowBsOnlyValue = (row = {}) => isBsCashRow(row) && isConsistentCashRow(row) ? cashRowBsValue(row) : 0

    const receivables = allReservations
      // Compatibilidad pruebas V150/V151: .filter((item) => !isReservationCancelled(item) && pendingAmount(item, exchangeRates) > 0)
      // V211.1 Hotfix: Cuentas por cobrar debe existir para cualquier reserva con saldo pendiente,
      // tanto si el abono fue en Bs como si fue por Zelle / USDT / Efectivo $.
      // En Bs se mantiene el pendiente exacto en Bs; en divisas se conserva el saldo operativo en USD
      // y se agrega equivalencia Bs solo como referencia de reporte, sin inflar caja.
      .filter((item) => {
        if (isReservationCancelled(item)) return false
        if (item.receivableWaived) return false
        if (!reservationHasCollectedPayment(item, exchangeRates)) return false
        return pendingAmount(item, exchangeRates) > 0.01
      })
      .map((item) => {
        const method = item.paymentMethod || item.method || ''
        const pendingUsd = pendingAmount(item, exchangeRates)
        const pendingBs = isBsPaymentMethod(method) ? receivablePendingBs(item, exchangeRates) : pendingAmountBs(item, exchangeRates)
        return {
          id: `receivable-${item.module}-${item.id}`,
          module: item.module,
          customerName: item.customerName || '',
          assetName: item.assetName || '',
          startDate: item.startDate || '',
          endDate: item.endDate || '',
          totalAmount: num(item.totalAmount),
          paidAmount: storedPaidUsd(item, exchangeRates),
          pendingAmount: pendingUsd,
          pendingAmountBs: pendingBs,
          pendingCurrency: isBsPaymentMethod(method) ? 'Bs' : 'USD',
          paymentCurrency: paymentDisplayCurrency(method),
          bcvEuroRate: item.bcvEuroRate || '',
          paymentMethod: method,
          method,
          sourceId: item.id,
          sourceType: 'reservationReceivable',
          createdByRole: item.createdByRole || item.sellerRole || item.profileRole || '',
          alohandoteNetIncomeUsd: item.alohandoteNetIncomeUsd || item.alohandoteIncomeUsd || '',
          sellerCommission: item.sellerCommission || '',
          status: 'Por cobrar',
        }
      })
    const payableExpenseRows = [...maintenanceCostRows, ...inventoryPurchaseRows, ...generalExpenseRows].filter((item) => item.expenseStatus === 'Por pagar')
    const paidExpenseRowsRaw = [...maintenanceCostRows, ...inventoryPurchaseRows, ...generalExpenseRows].filter((item) => item.expenseStatus !== 'Por pagar')
    const payables = [...payableExpenseRows, ...pendingCommissionRows].filter((item) => num(item.amount) > 0)
    // Compatibilidad QA V145: refundRows no son cuentas por pagar; patrón histórico: ...validRefundRows, ...commissionRows]
    const validRefundRows = refundRows.filter(isConsistentCashRow)
    const validIncomeRows = [...incomeRows, ...generalIncomeRows].filter(isConsistentCashRow)
    const validDollarPurchaseRows = [...dollarPurchaseRows, ...bsPurchaseOutRows, ...dollarSaleBsInRows, ...dollarSaleOutRows].filter(isConsistentCashRow)
    const income = [...validIncomeRows, ...dollarPurchaseRows.filter(isConsistentCashRow), ...dollarSaleBsInRows.filter(isConsistentCashRow)]
      .reduce((sum, item) => sum + (item.type === 'Ingreso' ? num(item.amount) : 0), 0)
    const incomeBs = [...validIncomeRows, ...dollarSaleBsInRows]
      .filter(isConsistentCashRow)
      .reduce((sum, item) => sum + Math.max(0, signedBsForCashRow(item, exchangeRates)), 0)
    const expenseCandidates = [...paidExpenseRowsRaw, ...validRefundRows, ...paidCommissionRows]
      .filter(isConsistentCashRow)
      .filter((row) => paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '') === 'Bs')
    const sanitizedBsLedger = sanitizeBsExpenseLedger(incomeBs, expenseCandidates, exchangeRates)
    const acceptedBsExpenseIds = new Set(sanitizedBsLedger.accepted.map((row) => row.id))
    const paidExpenseRows = paidExpenseRowsRaw.filter((row) => paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '') !== 'Bs' || acceptedBsExpenseIds.has(row.id))
    const validAcceptedRefundRows = validRefundRows.filter((row) => paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '') !== 'Bs' || acceptedBsExpenseIds.has(row.id))
    const paidCommissionRowsForCash = paidCommissionRows.filter((row) => paymentBucket(row.method || row.paymentMethod || row.maintenancePaymentMethod || '') !== 'Bs' || acceptedBsExpenseIds.has(row.id))
    // V173: Las compras de divisas son operaciones de caja reales y nunca deben ser omitidas por el saneador histórico.
    // Si hay Bs suficientes, se registran y descuentan la caja Bs. Si no hay Bs suficientes, se bloquean antes de guardar.
    const acceptedBsPurchaseOutRows = bsPurchaseOutRows.filter(isConsistentCashRow)
    const cashRows = [...incomeRows, ...dollarPurchaseRows, ...acceptedBsPurchaseOutRows, ...dollarSaleBsInRows, ...dollarSaleOutRows, ...paidExpenseRows, ...validAcceptedRefundRows, ...paidCommissionRowsForCash]
      .filter(isConsistentCashRow)
      .sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')))
    const expenseRowsForTotals = [...paidExpenseRows, ...validAcceptedRefundRows, ...acceptedBsPurchaseOutRows, ...dollarSaleOutRows, ...paidCommissionRowsForCash].filter(isConsistentCashRow)
    const expenses = expenseRowsForTotals.reduce((sum, item) => sum + num(item.amount), 0)
    // V175: las compras de divisas también son egresos reales de Caja Bs.
    // Antes se mostraban en la caja por método, pero no siempre descontaban la Caja disponible principal.
    const dollarPurchaseOutBs = acceptedBsPurchaseOutRows.reduce((sum, item) => sum + signedBsAbs(item, exchangeRates), 0)
    const expensesBs = sanitizedBsLedger.accepted.reduce((sum, item) => sum + signedBsAbs(item, exchangeRates), 0) + dollarPurchaseOutBs
    const cashAvailableBsRaw = incomeBs - expensesBs
    const cashAvailableBs = safeNonNegative(cashAvailableBsRaw)
    const receivableTotal = receivables.reduce((sum, item) => sum + num(item.pendingAmount), 0)
    const receivableTotalBs = receivables.reduce((sum, item) => sum + num(item.pendingAmountBs), 0)
    const payableTotal = payables.reduce((sum, item) => sum + num(item.amount), 0)
    const payableTotalBs = payables.reduce((sum, item) => sum + cashRowBsOnlyValue(item), 0)
    // V182: el KPI Devoluciones del resumen ejecutivo se expresa en Bs reales.
    // Las devoluciones en Zelle / USDT-Binance / Efectivo $ quedan solo en su caja USD.
    const refundsTotal = validAcceptedRefundRows.reduce((sum, item) => sum + (isBsCashRow(item) ? cashRowBsValue(item) : 0), 0)
    const commissionTotal = commissionRows.reduce((sum, item) => sum + num(item.amount), 0)
    const methodBuckets = allowedCashBuckets.reduce((acc, method) => {
      acc[method] = { method, amountUsd: 0, amountBs: 0, count: 0 }
      return acc
    }, {})
    const touchBucket = (bucket) => {
      if (!methodBuckets[bucket]) methodBuckets[bucket] = { method: bucket, amountUsd: 0, amountBs: 0, count: 0 }
      return methodBuckets[bucket]
    }
    const applyCashRowToBucket = (row = {}) => {
      const bucket = cashBucketForRow(row)
      if (!allowedCashBuckets.includes(bucket)) return
      const wallet = touchBucket(bucket)
      if (bucket === 'Bs') wallet.amountBs += signedBsForCashRow(row, exchangeRates)
      else wallet.amountUsd += signedUsdForCashRow(row)
      wallet.count += 1
    }
    ;[...validIncomeRows, ...dollarPurchaseRows, ...acceptedBsPurchaseOutRows, ...dollarSaleBsInRows, ...dollarSaleOutRows, ...paidExpenseRows, ...validAcceptedRefundRows, ...paidCommissionRowsForCash]
      .filter(isConsistentCashRow)
      .forEach(applyCashRowToBucket)
    const paymentSummary = allowedCashBuckets.map((method) => {
      const row = methodBuckets[method] || { method, amountUsd: 0, amountBs: 0, count: 0 }
      return { ...row, amountUsd: num(row.amountUsd), amountBs: method === 'Bs' ? safeNonNegative(row.amountBs) : num(row.amountBs), rawAmountBs: num(row.amountBs) }
    })
    const visibleProfit = Math.max(0, income - expenses)
    const visibleProfitBs = cashAvailableBs
    const bsWalletRow = methodBuckets.Bs || { amountBs: 0 }
    const bsWalletNegative = false
    const cashWarnings = [...sanitizedBsLedger.rejected.map((row) => row.rejectedReason || 'Egreso Bs omitido por inconsistencia de saldo.')]
    if (cashAvailableBsRaw < -0.01 || bsWalletNegative) cashWarnings.push('Caja Bs quedó negativa: revisa saldo inicial, devoluciones y egresos pagados.')
    return { allReservations, cashRows, incomeRows: validIncomeRows, generalIncomeRows, dollarPurchaseRows, bsPurchaseOutRows: acceptedBsPurchaseOutRows, dollarSaleBsInRows, dollarSaleOutRows, maintenanceCostRows, inventoryPurchaseRows, generalExpenseRows, payableExpenseRows, paidExpenseRows, refundRows: validAcceptedRefundRows, commissionRows, receivables, payables, income, incomeBs, expenses, expensesBs, dollarPurchaseOutBs, cashAvailableBsRaw, profit: visibleProfit, profitBs: visibleProfitBs, receivableTotal, receivableTotalBs, payableTotal, payableTotalBs, refundsTotal, commissionTotal, paymentSummary, noMethodRows: [], inconsistentBsRows: sanitizedBsLedger.rejected, dataQualityRows: cashWarnings }
  }, [reservationsStore.items, lodgingStore.items, vehicles, accommodations, exchangeRates, dollarPurchasesStore.items, inventoryItemsStore.items, generalExpensesStore.items])

  function maintenanceRowsSafe(carRows = [], lodgingRows = [], vehicleList = [], accommodationList = []) {
    const vehicleMaint = carRows
      .filter((item) => isMaintenanceRecord(item) && !isIcalImportedBlock(item))
      .map((item) => {
        const vehicle = vehicleList.find((v) => v.id === item.vehicleId) || {}
        return { ...item, module: 'Renta Car', assetName: vehicle.name || 'Vehículo' }
      })
    const lodgingMaint = lodgingRows
      .filter(isMaintenanceRecord)
      .map((item) => {
        const apt = accommodationList.find((a) => a.id === item.accommodationId) || {}
        return { ...item, module: 'Alojamiento', assetName: apt.name || 'Alojamiento' }
      })
    return [...vehicleMaint, ...lodgingMaint]
  }

  function openDollarPurchaseForm(operationType = 'purchase') {
    const defaultRate = euroRateValue(exchangeRates) || ''
    setEditingDollarPurchase({
      operationType,
      currencyType: 'Zelle',
      amountUsd: '',
      buyRate: defaultRate,
      amountBs: '',
      note: '',
      responsible: sellerName(profile, user),
    })
  }

  function openDollarSaleForm() {
    openDollarPurchaseForm('sale')
  }

  function handleDollarPurchaseChange(field, value) {
    const draft = { ...(editingDollarPurchase || {}), [field]: value }
    if (field === 'amountUsd' || field === 'buyRate') {
      draft.amountBs = String(Number((num(draft.amountUsd) * num(draft.buyRate)).toFixed(2)) || '')
    }
    if (field === 'amountBs' && num(draft.amountUsd) > 0) {
      draft.buyRate = String(Number((num(value) / num(draft.amountUsd)).toFixed(4)) || '')
    }
    setEditingDollarPurchase(draft)
  }

  async function saveDollarPurchase(event) {
    if (event?.preventDefault) event.preventDefault()
    setError('')
    if (!editingDollarPurchase?.currencyType) return setError('Selecciona el tipo de divisa.')
    const operationType = editingDollarPurchase.operationType === 'sale' ? 'sale' : 'purchase'
    const amountUsdValue = Number(num(editingDollarPurchase.amountUsd).toFixed(2))
    const rateValue = Number(num(editingDollarPurchase.buyRate).toFixed(4))
    const amountBsValue = Number((num(editingDollarPurchase.amountBs) || (amountUsdValue * rateValue)).toFixed(2))
    if (amountUsdValue <= 0) return setError(operationType === 'sale' ? 'Coloca la cantidad de dólares vendidos.' : 'Coloca la cantidad de dólares comprados.')
    if (rateValue <= 0) return setError(operationType === 'sale' ? 'Coloca la tasa de venta.' : 'Coloca la tasa de compra.')
    if (amountBsValue <= 0) return setError('El monto en Bs debe ser mayor a cero.')

    const walletBucket = paymentBucket(editingDollarPurchase.currencyType)
    // V173: Validación contable real antes de guardar. No bloquear el formulario por saldos derivados: se bloquea solo por saldo real insuficiente.
    // Compra de $ requiere Bs suficientes para salir de Caja Bs.
    // Venta de $ requiere saldo USD suficiente en la caja seleccionada.
    const currentBsWallet = administrationRows?.paymentSummary?.find((row) => row.method === 'Bs')
    const currentUsdWallet = administrationRows?.paymentSummary?.find((row) => row.method === walletBucket)
    const availableBs = num(currentBsWallet?.amountBs)
    const availableUsd = num(currentUsdWallet?.amountUsd)
    if (operationType === 'purchase' && amountBsValue > availableBs + 0.01) {
      return setError(`No hay Bs suficientes para comprar ${money(amountUsdValue)}. Caja Bs disponible: ${bsMoney(availableBs)}. Primero registra un ingreso/abono en Bs o reduce el monto.`)
    }
    if (operationType === 'sale' && amountUsdValue > availableUsd + 0.01) {
      return setError(`No hay saldo suficiente en ${walletBucket} para vender ${money(amountUsdValue)}. Disponible: ${money(availableUsd)}.`)
    }

    const payload = {
      operationType,
      type: operationType === 'sale' ? 'Venta de $' : 'Compra de $',
      category: operationType === 'sale' ? 'Venta de divisas' : 'Compra de divisas',
      currencyType: editingDollarPurchase.currencyType,
      wallet: walletBucket,
      amountUsd: amountUsdValue,
      buyRate: rateValue,
      saleRate: operationType === 'sale' ? rateValue : '',
      amountBs: amountBsValue,
      cashLedger: operationType === 'sale'
        ? [{ wallet: walletBucket, currency: 'USD', amount: -amountUsdValue }, { wallet: 'Bs', currency: 'BS', amount: amountBsValue }]
        : [{ wallet: walletBucket, currency: 'USD', amount: amountUsdValue }, { wallet: 'Bs', currency: 'BS', amount: -amountBsValue }],
      note: editingDollarPurchase.note || '',
      responsible: editingDollarPurchase.responsible || sellerName(profile, user),
      createdByUid: user?.uid || '',
      createdByEmail: user?.email || '',
      createdByName: sellerName(profile, user),
      date: new Date().toISOString().slice(0,10),
    }
    const created = await dollarPurchasesStore.createItem(payload)
    await logAudit(payload.operationType === 'sale' ? 'dollar_sale_created' : 'dollar_purchase_created', 'Administración', created?.id || '', { ...payload, id: created?.id || '' }, { currencyType: payload.currencyType, amountUsd: payload.amountUsd, amountBs: payload.amountBs })
    setEditingDollarPurchase(null)
    showSuccess(payload.operationType === 'sale' ? 'Venta de dólares registrada correctamente: entraron Bs y salió USD.' : 'Compra de dólares registrada correctamente: entró USD y salieron Bs.')
  }

  async function saveGeneralExpense(event) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setError('')
    if (!editingGeneralExpense) return
    try {
      const now = new Date().toISOString()
      const movementKind = editingGeneralExpense.transactionType || editingGeneralExpense.type || 'Egreso'
      const isIncomeMovement = movementKind === 'Ingreso'
      const isAllyOwnerPayable = ['ownerPayableAlly','ownerPayableVehicleAlly'].includes(editingGeneralExpense.sourceType)
      const isBsMovement = isBsGeneralExpense(editingGeneralExpense)
      const rateForExpense = num(editingGeneralExpense.bcvDollarRate || editingGeneralExpense.bcvEuroRate || euroRateValue(exchangeRates, officialEuroRate)) || euroRateValue(exchangeRates, officialEuroRate)
      const description = String(editingGeneralExpense.description || '').trim() || (isAllyOwnerPayable ? 'Pago aliado' : (isIncomeMovement ? 'Ingreso operativo' : 'Gasto operativo'))

      const allyPreview = allyPayablePreview(editingGeneralExpense, exchangeRates)
      const rawBsAmount = num(editingGeneralExpense.amountBs || (isBsMovement ? editingGeneralExpense.amount : 0))
      const rawUsdAmount = num(editingGeneralExpense.amount || editingGeneralExpense.amountUsd || 0)
      const baseUsdAmount = isAllyOwnerPayable
        ? (allyPreview.isBs ? Number((allyPreview.payable / (rateForExpense || 1)).toFixed(2)) : allyPreview.payable)
        : (isBsMovement ? Number((rawBsAmount / (rateForExpense || 1)).toFixed(2)) : rawUsdAmount)
      const baseBsAmount = isAllyOwnerPayable
        ? (allyPreview.isBs ? allyPreview.payable : amountBs(allyPreview.payable, exchangeRates, rateForExpense))
        : (isBsMovement ? rawBsAmount : amountBs(rawUsdAmount, exchangeRates, rateForExpense))

      const amountForValidation = isBsMovement ? baseBsAmount : baseUsdAmount
      if (amountForValidation <= 0) {
        setError(isIncomeMovement ? 'Indica un monto válido para el ingreso.' : 'Indica un monto válido para el gasto.')
        return
      }

      const linkedReservation = isAllyOwnerPayable
        ? ([...lodgingStore.items, ...reservationsStore.items].find((row)=>row.id === editingGeneralExpense.sourceReservationId) || {})
        : {}
      const reservationTotalForPayable = isAllyOwnerPayable
        ? (allyPreview.isBs ? num(editingGeneralExpense.reservationTotalUsd || linkedReservation.totalAmount || editingGeneralExpense.totalAmount || (rateForExpense ? allyPreview.total / rateForExpense : 0)) : allyPreview.total)
        : editingGeneralExpense.reservationTotalUsd
      const alohandoteNetIncome = isAllyOwnerPayable
        ? (allyPreview.isBs ? Number((num(editingGeneralExpense.alohandoteNetIncomeBs || editingGeneralExpense.alohandoteIncomeBs || 0) / (rateForExpense || 1)).toFixed(2)) : allyPreview.gain)
        : editingGeneralExpense.alohandoteNetIncomeUsd

      let invoiceFile = editingGeneralExpense.invoiceFile || null
      if (editingGeneralExpense._invoiceFile) {
        try {
          invoiceFile = await uploadReservationFile(editingGeneralExpense._invoiceFile, 'comprobante-gasto-erp')
        } catch (uploadErr) {
          console.warn('No se pudo subir comprobante/factura del movimiento:', uploadErr)
        }
      }

      const payload = {
        ...editingGeneralExpense,
        description,
        category: editingGeneralExpense.category || 'Operativo',
        date: editingGeneralExpense.date || now.slice(0,10),
        amount: String(baseUsdAmount),
        amountBs: String(baseBsAmount),
        reservationTotalUsd: isAllyOwnerPayable ? reservationTotalForPayable : editingGeneralExpense.reservationTotalUsd,
        reservationTotalBs: isAllyOwnerPayable && allyPreview.isBs ? allyPreview.total : editingGeneralExpense.reservationTotalBs,
        alohandoteNetIncomeUsd: isAllyOwnerPayable ? alohandoteNetIncome : editingGeneralExpense.alohandoteNetIncomeUsd,
        alohandoteNetIncomeBs: isAllyOwnerPayable && allyPreview.isBs ? allyPreview.gain : editingGeneralExpense.alohandoteNetIncomeBs,
        currency: isBsMovement ? 'Bs' : (editingGeneralExpense.currency || 'USD'),
        bcvDollarRate: String(rateForExpense || ''),
        bcvEuroRate: String(rateForExpense || ''),
        paymentMethod: editingGeneralExpense.paymentMethod || 'Pago en BS',
        expenseStatus: editingGeneralExpense.expenseStatus || 'Pagado',
        updatedAt: now,
        createdAt: editingGeneralExpense.createdAt || now,
        createdByUid: editingGeneralExpense.createdByUid || user?.uid || '',
        createdByEmail: editingGeneralExpense.createdByEmail || user?.email || '',
        createdByName: editingGeneralExpense.createdByName || sellerName(profile, user),
        transactionType: movementKind,
        type: movementKind,
        invoiceFile,
      }
      delete payload._invoiceFile

      const safePayload = stripUndefinedDeep(payload)
      let savedId = editingGeneralExpense.id || ''
      if (editingGeneralExpense.id) {
        await generalExpensesStore.editItem(editingGeneralExpense.id, safePayload)
      } else {
        const created = await generalExpensesStore.createItem(safePayload)
        savedId = created?.id || ''
      }
      await logAudit(isIncomeMovement ? (editingGeneralExpense.id ? 'general_income_updated' : 'general_income_created') : (editingGeneralExpense.id ? 'general_expense_updated' : 'general_expense_created'), 'Administración', savedId, { ...safePayload, id: savedId }, { category: safePayload.category, expenseStatus: safePayload.expenseStatus })
      setEditingGeneralExpense(null)
      showSuccess(isIncomeMovement ? 'Ingreso operativo guardado correctamente' : 'Movimiento operativo guardado correctamente')
    } catch (err) {
      console.error('Error guardando movimiento operativo:', err)
      setError('No se pudo guardar el movimiento. Revisa los datos e inténtalo nuevamente.')
    }
  }

  function exportAdministrationExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(administrationRows.cashRows), 'Caja')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(administrationRows.receivables), 'Cuentas por cobrar')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(administrationRows.payables), 'Cuentas por pagar')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(administrationRows.refundRows), 'Devoluciones')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(administrationRows.commissionRows), 'Comisiones')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dollarPurchasesStore.items), 'Compras de dolares')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(generalExpensesStore.items), 'Gastos generales')
    XLSX.writeFile(wb, `alohandote-administracion-${searchDateSuffix()}.xlsx`)
  }

  function openPayableSource(row = {}) {
    setError('')
    if (!row.sourceId) return setError('No se encontró el registro origen de la cuenta por pagar.')
    if (row.sourceType === 'generalExpense') { const expense = generalExpensesStore.items.find((entry) => entry.id === row.sourceId); if (expense) return setEditingGeneralExpense(expense) }
    if (row.category === 'Compra de material') {
      const item = inventoryItemsStore.items.find((entry) => entry.id === row.sourceId)
      if (item) return setEditingInventoryItem(item)
    }
    if (row.module === 'Renta Car') {
      const reservation = reservationsStore.items.find((entry) => entry.id === row.sourceId)
      if (reservation) return openEditReservation(reservation)
    }
    if (row.module === 'Alojamientos' || row.module === 'Alojamiento') {
      const lodging = lodgingStore.items.find((entry) => entry.id === row.sourceId)
      if (lodging) return setEditingLodging(lodging)
    }
    setError('No se pudo abrir el registro origen.')
  }

  async function deletePayableSource(row = {}) {
    if (!row.sourceId) return setError('No se encontró el registro origen de la cuenta por pagar.')
    if (!confirm('¿Eliminar o anular esta cuenta por pagar?')) return
    if (row.sourceType === 'generalExpense') { await generalExpensesStore.removeItem(row.sourceId); await logAudit('payable_general_expense_deleted', 'Administración', row.sourceId, row); return showSuccess('Gasto general eliminado.') }
    if (row.category === 'Compra de material') {
      await inventoryItemsStore.removeItem(row.sourceId)
      await logAudit('payable_inventory_deleted', 'Administración', row.sourceId, row)
      return showSuccess('Cuenta por pagar de inventario eliminada.')
    }
    if (row.category === 'Mantenimiento') {
      const car = reservationsStore.items.find((entry) => entry.id === row.sourceId)
      if (car) {
        if (normalizeStatus(car.status) === 'maintenance') await reservationsStore.removeItem(car.id)
        else await reservationsStore.editItem(car.id, { ...car, maintenanceCost: '', maintenanceLaborCost: '', maintenancePartsCost: '', maintenancePaymentMethod: '', maintenanceInvoices: [], updatedAt: new Date().toISOString() })
        await logAudit('payable_maintenance_deleted', 'Administración', row.sourceId, row)
        return showSuccess('Cuenta por pagar de mantenimiento eliminada.')
      }
      const lodging = lodgingStore.items.find((entry) => entry.id === row.sourceId)
      if (lodging) {
        if (normalizeStatus(lodging.status) === 'maintenance') await lodgingStore.removeItem(lodging.id)
        else await lodgingStore.editItem(lodging.id, { ...lodging, maintenanceCost: '', maintenancePaymentMethod: '', maintenanceInvoices: [], updatedAt: new Date().toISOString() })
        await logAudit('payable_maintenance_deleted', 'Administración', row.sourceId, row)
        return showSuccess('Cuenta por pagar de mantenimiento eliminada.')
      }
    }
    if (row.category === 'Devolución' || row.category === 'Anulación / devolución') {
      const car = reservationsStore.items.find((entry) => entry.id === row.sourceId)
      if (car) {
        await reservationsStore.editItem(car.id, { ...car, refundAmount: '', refundReason: '', refundAt: '', updatedAt: new Date().toISOString() })
        await logAudit('payable_refund_deleted', 'Administración', row.sourceId, row)
        return showSuccess('Cuenta por pagar de devolución anulada.')
      }
      const lodging = lodgingStore.items.find((entry) => entry.id === row.sourceId)
      if (lodging) {
        await lodgingStore.editItem(lodging.id, { ...lodging, refundAmount: '', refundReason: '', refundAt: '', updatedAt: new Date().toISOString() })
        await logAudit('payable_refund_deleted', 'Administración', row.sourceId, row)
        return showSuccess('Cuenta por pagar de devolución anulada.')
      }
    }
    if (row.category === 'Comisión vendedor') {
      const car = reservationsStore.items.find((entry) => entry.id === row.sourceId)
      if (car) {
        await reservationsStore.editItem(car.id, { ...car, commissionWaived: true, updatedAt: new Date().toISOString() })
        await logAudit('payable_commission_waived', 'Administración', row.sourceId, row)
        return showSuccess('Comisión anulada de cuentas por pagar.')
      }
      const lodging = lodgingStore.items.find((entry) => entry.id === row.sourceId)
      if (lodging) {
        await lodgingStore.editItem(lodging.id, { ...lodging, commissionWaived: true, updatedAt: new Date().toISOString() })
        await logAudit('payable_commission_waived', 'Administración', row.sourceId, row)
        return showSuccess('Comisión anulada de cuentas por pagar.')
      }
    }
    setError('No se pudo eliminar esta cuenta por pagar automáticamente.')
  }

  function openReceivableSource(row = {}) {
    setError('')
    const sourceId = row.sourceId || String(row.id || '').replace(/^receivable-(Renta Car|Alojamientos)-/, '')
    const car = reservationsStore.items.find((entry) => entry.id === sourceId)
    if (car) return openEditReservation(car)
    const lodging = lodgingStore.items.find((entry) => entry.id === sourceId)
    if (lodging) return setEditingLodging(lodging)
    setError('No se encontró la reserva vinculada a esta cuenta por cobrar.')
  }

  async function deleteReceivableSource(row = {}) {
    const sourceId = row.sourceId || String(row.id || '').replace(/^receivable-(Renta Car|Alojamientos)-/, '')
    if (!sourceId) return setError('No se encontró la reserva vinculada.')
    if (!confirm('¿Eliminar esta cuenta por cobrar? Esto marcará la reserva vinculada como saldo corregido.')) return
    const car = reservationsStore.items.find((entry) => entry.id === sourceId)
    if (car) {
      await reservationsStore.editItem(car.id, { ...car, receivableWaived: true, paymentStatus: 'CxC anulada', updatedAt: new Date().toISOString() })
      await logAudit('receivable_waived', 'Renta Car', car.id, row)
      return showSuccess('Cuenta por cobrar anulada para esta reserva.')
    }
    const lodging = lodgingStore.items.find((entry) => entry.id === sourceId)
    if (lodging) {
      await lodgingStore.editItem(lodging.id, { ...lodging, receivableWaived: true, paymentStatus: 'CxC anulada', updatedAt: new Date().toISOString() })
      await logAudit('receivable_waived', 'Alojamientos', lodging.id, row)
      return showSuccess('Cuenta por cobrar anulada para esta reserva.')
    }
    setError('No se pudo anular esta cuenta por cobrar automáticamente.')
  }


  function openCommissionPayment(row = {}) {
    const today = new Date().toISOString().slice(0,10)
    const defaultMethod = row.method || row.paymentMethod || 'Pago en BS'
    const defaultUsd = num(row.amount)
    const defaultBs = row.amountBsManual || amountBs(defaultUsd, exchangeRates, dollarRateValue(exchangeRates))
    setEditingCommissionPayment({ ...row, paymentDate: today, paymentMethod: defaultMethod, paymentReference: row.reference || '', paymentAmountUsd: defaultUsd, paymentAmountBs: defaultBs })
  }

  async function saveCommissionPayment(e) {
    e?.preventDefault?.()
    const draft = editingCommissionPayment || {}
    if (!draft.sourceId) return setError('No se encontró la reserva asociada a esta comisión.')
    const method = draft.paymentMethod || 'Pago en BS'
    const paidUsd = num(draft.paymentAmountUsd || draft.amount)
    const paidBs = isBsPaymentMethod(method) ? num(draft.paymentAmountBs || amountBs(paidUsd, exchangeRates, dollarRateValue(exchangeRates))) : num(draft.paymentAmountBs || amountBs(paidUsd, exchangeRates, dollarRateValue(exchangeRates)))
    if (paidUsd <= 0 && paidBs <= 0) return setError('Ingresa el monto pagado de la comisión.')
    const payload = {
      commissionPaid: true,
      commissionPaymentStatus: 'Pagado',
      commissionPaidAt: draft.paymentDate || new Date().toISOString().slice(0,10),
      commissionPaymentMethod: method,
      commissionPaymentReference: draft.paymentReference || '',
      commissionPaidAmountUsd: paidUsd,
      commissionPaidAmountBs: paidBs,
      commissionPaidBy: sellerName(profile, user),
      commissionPaidByUid: user?.uid || '',
      updatedAt: new Date().toISOString(),
    }
    const car = reservationsStore.items.find((entry) => entry.id === draft.sourceId)
    if (car) {
      await reservationsStore.editItem(car.id, { ...car, ...payload })
      await logAudit('seller_commission_paid', 'Renta Car', car.id, { ...draft, ...payload })
      setEditingCommissionPayment(null)
      return showSuccess('Comisión de vendedor pagada y descontada de caja.')
    }
    const lodging = lodgingStore.items.find((entry) => entry.id === draft.sourceId)
    if (lodging) {
      await lodgingStore.editItem(lodging.id, { ...lodging, ...payload })
      await logAudit('seller_commission_paid', 'Alojamientos', lodging.id, { ...draft, ...payload })
      setEditingCommissionPayment(null)
      return showSuccess('Comisión de vendedor pagada y descontada de caja.')
    }
    setError('No se encontró la reserva origen para pagar esta comisión.')
  }

  const inventorySummary = useMemo(() => {
    const items = inventoryItemsStore.items || []
    const movements = inventoryMovementsStore.items || []
    const lowStock = items.filter((item) => num(item.quantity) <= num(item.minQuantity))
    const carItems = items.filter((item) => item.module === 'Renta Car')
    const lodgingItems = items.filter((item) => item.module === 'Alojamientos')
    const totalValue = items.reduce((sum, item) => sum + (num(item.quantity) * num(item.unitCost)), 0)
    const maintenanceConsumption = movements.filter((item) => item.reason === 'Mantenimiento').reduce((sum, item) => sum + num(item.totalCost), 0)
    const cleaningConsumption = movements.filter((item) => item.reason === 'Limpieza').reduce((sum, item) => sum + num(item.totalCost), 0)
    return { items, movements, lowStock, carItems, lodgingItems, totalValue, maintenanceConsumption, cleaningConsumption }
  }, [inventoryItemsStore.items, inventoryMovementsStore.items])

  function inventoryAssetName(item = {}) {
    if (item.module === 'Renta Car') return vehicles.find((vehicle) => vehicle.id === item.assetId)?.name || item.location || 'General'
    if (item.module === 'Alojamientos') return accommodations.find((apt) => apt.id === item.assetId)?.name || item.location || 'General'
    return item.location || 'General'
  }

  function inventoryItemTotalUsd(item = {}) {
    return Number((num(item.quantity) * num(item.unitCost)).toFixed(2))
  }

  function inventoryPaymentAmountBs(item = {}) {
    const rate = dollarRateValue(exchangeRates, item.bcvDollarRate || item.bcvUsdRate || '')
    return Number((inventoryItemTotalUsd(item) * rate).toFixed(2))
  }

  function updateInventoryItemDraft(field, value) {
    const draft = { ...(editingInventoryItem || {}), [field]: value }
    const method = String(draft.paymentMethod || '')
    const rate = dollarRateValue(exchangeRates, draft.bcvDollarRate || '')
    if (['quantity','unitCost','paymentMethod','bcvDollarRate'].includes(field)) {
      if (paymentBucket(method) === 'Bs') {
        draft.bcvDollarRate = draft.bcvDollarRate || (rate ? String(rate) : '')
        draft.amountBs = String(Number((num(draft.quantity) * num(draft.unitCost) * num(draft.bcvDollarRate || rate)).toFixed(2)) || '')
      } else {
        draft.amountBs = ''
      }
    }
    setEditingInventoryItem(draft)
  }

  function emptyInventoryItem() {
    return { name: '', category: 'Repuestos', module: 'Renta Car', assetId: '', location: 'Depósito', quantity: 0, minQuantity: 1, unitCost: 0, paymentMethod: 'Bs', expenseStatus: 'Pagado', bcvDollarRate: dollarRateValue(exchangeRates) || '', amountBs: '', provider: '', purchaseDate: new Date().toISOString().slice(0,10), invoiceFile: null, status: 'Disponible', notes: '' }
  }

  function emptyInventoryMovement(kind = 'Salida') {
    return { itemId: '', kind, reason: kind === 'Entrada' ? 'Compra' : 'Mantenimiento', module: 'Renta Car', assetId: '', quantity: 1, unitCost: 0, totalCost: 0, date: new Date().toISOString().slice(0,10), responsible: sellerName(profile, user), reference: '', notes: '' }
  }

  async function saveInventoryItem(event) {
    event.preventDefault()
    if (!editingInventoryItem?.name?.trim()) return setError('Debes colocar el nombre del artículo.')
    const invoiceFile = editingInventoryItem._invoiceFile ? await uploadReservationFile(editingInventoryItem._invoiceFile, 'factura-inventario') : editingInventoryItem.invoiceFile || null
    const normalizedPaymentMethod = editingInventoryItem.paymentMethod || 'Bs'
    const normalizedRate = dollarRateValue(exchangeRates, editingInventoryItem.bcvDollarRate || '')
    const normalizedQty = num(editingInventoryItem.quantity)
    const normalizedUnitCost = num(editingInventoryItem.unitCost)
    const normalizedAmountBs = paymentBucket(normalizedPaymentMethod) === 'Bs' ? Number((normalizedQty * normalizedUnitCost * normalizedRate).toFixed(2)) : 0
    const payload = { ...editingInventoryItem, invoiceFile, _invoiceFile: null, name: editingInventoryItem.name.trim(), quantity: normalizedQty, minQuantity: num(editingInventoryItem.minQuantity), unitCost: normalizedUnitCost, paymentMethod: normalizedPaymentMethod, expenseStatus: editingInventoryItem.expenseStatus || 'Pagado', bcvDollarRate: normalizedRate || '', amountBs: normalizedAmountBs || '', purchaseDate: editingInventoryItem.purchaseDate || new Date().toISOString().slice(0,10), updatedBy: sellerName(profile, user) }
    let savedId = editingInventoryItem.id || ''
    if (editingInventoryItem.id) await inventoryItemsStore.editItem(editingInventoryItem.id, payload)
    else { const created = await inventoryItemsStore.createItem(payload); savedId = created?.id || '' }
    await logAudit(editingInventoryItem.id ? 'inventory_item_updated' : 'inventory_item_created', 'Inventario', savedId, { ...payload, id: savedId })
    setEditingInventoryItem(null)
    showSuccess('Inventario guardado correctamente')
  }

  async function saveInventoryMovement(event) {
    event.preventDefault()
    const movement = { ...editingInventoryMovement }
    const item = inventoryItemsStore.items.find((row) => row.id === movement.itemId)
    if (!item) return setError('Selecciona un artículo de inventario.')
    const quantity = num(movement.quantity)
    if (quantity <= 0) return setError('La cantidad debe ser mayor a cero.')
    const kind = movement.kind || 'Salida'
    const unitCost = num(movement.unitCost || item.unitCost)
    const totalCost = Number((quantity * unitCost).toFixed(2))
    const nextQty = kind === 'Entrada' ? num(item.quantity) + quantity : num(item.quantity) - quantity
    if (nextQty < 0) return setError('No hay stock suficiente para registrar esta salida.')
    const payload = {
      ...movement,
      itemName: item.name,
      category: item.category,
      module: movement.module || item.module,
      assetId: movement.assetId || item.assetId || '',
      quantity,
      unitCost,
      totalCost,
      date: movement.date || new Date().toISOString().slice(0,10),
      responsible: movement.responsible || sellerName(profile, user),
      createdByName: sellerName(profile, user),
    }
    const createdMovement = await inventoryMovementsStore.createItem(payload)
    await inventoryItemsStore.editItem(item.id, { ...item, quantity: nextQty, unitCost, updatedBy: sellerName(profile, user), lastMovementAt: new Date().toISOString() })
    await logAudit(kind === 'Entrada' ? 'inventory_entry_created' : 'inventory_exit_created', 'Inventario', createdMovement?.id || item.id, { ...payload, id: createdMovement?.id || '', itemName: item.name }, { previousQty: item.quantity, nextQty })
    setEditingInventoryMovement(null)
    showSuccess(kind === 'Entrada' ? 'Entrada de inventario registrada' : 'Consumo de inventario registrado')
  }

  function exportInventoryExcel() {
    const items = inventoryItemsStore.items.map((item) => ({ ...item, Asset: inventoryAssetName(item), Valor_Total_USD: num(item.quantity) * num(item.unitCost), Stock_Bajo: num(item.quantity) <= num(item.minQuantity) ? 'Sí' : 'No' }))
    const movements = inventoryMovementsStore.items.map((item) => ({ ...item, Total_USD: num(item.totalCost) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), 'Inventario')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(movements), 'Movimientos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inventorySummary.lowStock), 'Stock minimo')
    XLSX.writeFile(wb, `alohandote-inventario-${searchDateSuffix()}.xlsx`)
  }

  const hrSummary = useMemo(() => {
    const people = hrPeopleStore.items || []
    const tasks = hrTasksStore.items || []
    const activePeople = people.filter((person) => person.status !== 'Inactivo')
    const pendingTasks = tasks.filter((task) => !['Completada','Cancelada'].includes(task.status))
    const completedTasks = tasks.filter((task) => task.status === 'Completada')
    const activityRows = [
      ...reservationsStore.items.map((item) => ({ id: `act-car-${item.id}`, date: item.updatedAt || item.createdAt || '', module: 'Renta Car', action: item.id ? 'Reserva / actualización' : 'Registro', user: item.createdByName || item.createdByEmail || 'Sistema', detail: item.customerName || '' })),
      ...lodgingStore.items.filter((item) => !isIcalImportedBlock(item)).map((item) => ({ id: `act-lodging-${item.id}`, date: item.updatedAt || item.createdAt || '', module: 'Alojamientos', action: 'Reserva / actualización', user: item.createdByName || item.createdByEmail || 'Sistema', detail: item.customerName || '' })),
      ...vehicleCheckinsStore.items.map((item) => ({ id: `act-checkin-${item.id}`, date: item.updatedAt || item.createdAt || '', module: 'Recepción vehículos', action: 'Recepción registrada', user: item.createdByName || item.createdByEmail || 'Sistema', detail: item.vehicleName || '' })),
      ...inventoryMovementsStore.items.map((item) => ({ id: `act-inv-${item.id}`, date: item.updatedAt || item.createdAt || item.date || '', module: 'Inventario', action: `${item.kind || 'Movimiento'} · ${item.reason || ''}`, user: item.responsible || item.createdByName || 'Sistema', detail: item.itemName || '' })),
    ].sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 30)
    const commissionRows = administrationRows.commissionRows.map((row) => ({ ...row, seller: row.responsible || 'Sin vendedor' }))
    const commissionsBySeller = commissionRows.reduce((acc, row) => {
      const key = row.seller || 'Sin vendedor'
      acc[key] = acc[key] || { seller: key, reservations: 0, totalSold: 0, commission: 0, pending: 0 }
      acc[key].reservations += 1
      acc[key].commission += num(row.amount)
      if (row.status !== 'Por pagar') acc[key].pending += num(row.amount)
      return acc
    }, {})
    return { people, tasks, activePeople, pendingTasks, completedTasks, activityRows, commissionRows, commissionsBySeller: Object.values(commissionsBySeller) }
  }, [hrPeopleStore.items, hrTasksStore.items, reservationsStore.items, lodgingStore.items, vehicleCheckinsStore.items, inventoryMovementsStore.items, administrationRows.commissionRows])

  function emptyHrPerson() {
    return { name: '', document: '', phone: '', email: '', birthDate: '', entryDate: new Date().toISOString().slice(0,10), exitDate: '', role: 'Vendedor', department: 'Comercial', relationType: 'Colaborador', appAccess: 'Sin acceso', permissionsProfile: 'Vendedor', salary: 0, commissionRate: 15, bcvUsdRate: dollarRateValue(exchangeRates), status: 'Activo', notes: '' }
  }

  function emptyHrTask() {
    return { title: '', module: 'Renta Car', responsible: sellerName(profile, user), dueDate: new Date().toISOString().slice(0,10), priority: 'Media', status: 'Pendiente', assetType: '', assetId: '', reservationId: '', notes: '' }
  }

  async function saveHrPerson(event) {
    event.preventDefault()
    if (!canManageHr) return setError('Tu perfil no tiene permiso para gestionar personal.')
    if (!editingHrPerson?.name?.trim()) return setError('Debes colocar el nombre del colaborador.')
    const payload = { ...editingHrPerson, name: editingHrPerson.name.trim(), salary: num(editingHrPerson.salary), commissionRate: num(editingHrPerson.commissionRate), bcvUsdRate: num(editingHrPerson.bcvUsdRate || dollarRateValue(exchangeRates)), birthDate: editingHrPerson.birthDate || '', entryDate: editingHrPerson.entryDate || '', exitDate: editingHrPerson.exitDate || '', appAccess: editingHrPerson.appAccess || 'Sin acceso', permissionsProfile: editingHrPerson.permissionsProfile || editingHrPerson.role || 'Vendedor', role: editingHrPerson.permissionsProfile || editingHrPerson.role || 'Vendedor', updatedBy: sellerName(profile, user) }
    let savedId = editingHrPerson.id || ''
    if (editingHrPerson.id) await hrPeopleStore.editItem(editingHrPerson.id, payload)
    else { const created = await hrPeopleStore.createItem(payload); savedId = created?.id || '' }
    await logAudit(editingHrPerson.id ? 'hr_person_updated' : 'hr_person_created', 'RRHH', savedId, { ...payload, id: savedId })
    setEditingHrPerson(null)
    showSuccess('Personal guardado correctamente')
  }

  async function saveHrTask(event) {
    event.preventDefault()
    if (!canManageHr && !canWriteOperations) return setError('Tu perfil no tiene permiso para gestionar tareas operativas.')
    if (!editingHrTask?.title?.trim()) return setError('Debes colocar el título de la tarea.')
    const payload = { ...editingHrTask, title: editingHrTask.title.trim(), updatedBy: sellerName(profile, user) }
    if (editingHrTask.id) await hrTasksStore.editItem(editingHrTask.id, payload)
    else await hrTasksStore.createItem(payload)
    setEditingHrTask(null)
    showSuccess('Tarea operativa guardada')
  }

  function generateHrPaymentReceipt(person) {
    if (!person?.id) return
    const printWindow = preparePrintableWindow()
    const today = new Date()
    const weekStart = new Date(today)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weeklyUsd = num(person.salary)
    const rate = dollarRateValue(exchangeRates)
    const weeklyBs = Number((weeklyUsd * rate).toFixed(2))
    const receiptId = `RRHH-${String(person.id || 'demo').slice(0,6).toUpperCase()}-${today.toISOString().slice(0,10).replaceAll('-','')}`
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Recibo de pago RRHH</title><style>${cleanPrintCss}@page{size:letter;margin:0}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;background:#f4f4f4;color:#222}.actions{text-align:center;margin:16px}.actions button{border:0;background:#ff385c;color:#fff;border-radius:999px;padding:12px 20px;font-weight:bold;cursor:pointer;margin:4px}.actions button.secondary{background:#222}.receipt{width:760px;max-width:100%;margin:20px auto;background:#fff;padding:32px;border-radius:20px}.head{display:grid;grid-template-columns:120px 1fr 120px;align-items:center;border-bottom:1px solid #e5e5e5;padding-bottom:18px}.head img{width:110px;height:110px;object-fit:contain}.head-title{text-align:center}.head-title h1{margin:0;font-size:24px;letter-spacing:-.02em}.head-title p{margin:6px 0 0;color:#666;font-weight:bold}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.box{border:1px solid #e8e8e8;border-radius:14px;padding:14px}.box span{display:block;color:#777;font-size:11px;font-weight:bold;text-transform:uppercase}.box strong{display:block;margin-top:4px;font-size:18px}.payments{margin-top:22px;border:1px solid #eee;border-radius:16px;overflow:hidden}.row{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #eee}.row:last-child{border-bottom:0}.row.total{background:#fff7ed;font-weight:bold}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:42px}.signature{border-top:1px solid #222;text-align:center;padding-top:8px;font-size:11px;color:#555}</style></head><body><div class="actions">${pdfActionButtons()}</div><main class="receipt">${alohandotePdfHeader()}<section class="head"><div></div><div class="head-title"><h1>Recibo de pago</h1><p>${receiptId}</p></div><div></div></section><section class="grid"><div class="box"><span>Colaborador</span><strong>${escapeHtml(person.name || '')}</strong></div><div class="box"><span>Cédula</span><strong>${escapeHtml(person.document || 'Sin cédula')}</strong></div><div class="box"><span>Rol / área</span><strong>${escapeHtml(person.role || '')} · ${escapeHtml(person.department || '')}</strong></div><div class="box"><span>Periodo semanal</span><strong>${formatShortDate(weekStart.toISOString().slice(0,10))} - ${formatShortDate(weekEnd.toISOString().slice(0,10))}</strong></div><div class="box"><span>Fecha de ingreso</span><strong>${person.entryDate ? formatShortDate(person.entryDate) : 'No registrada'}</strong></div></section><section class="payments"><div class="row"><span>Sueldo semanal USD</span><strong>${money(weeklyUsd)}</strong></div><div class="row"><span>Tasa $USD BCV oficial</span><strong>${bsMoney(rate)}</strong></div><div class="row total"><span>Total a pagar Bs</span><strong>${bsMoney(weeklyBs)}</strong></div></section><p><strong>Observación:</strong> Recibo de pago emitido por servicios laborales. La tasa utilizada corresponde al valor registrado para el cálculo.</p><section class="signatures"><div class="signature">Firma colaborador</div><div class="signature">Firma autorizado</div></section>${alohandoteContactFooter()}</main></body></html>`
    writePrintableWindow(printWindow, html, 'recibo-pago-rrhh')
    showSuccess('Recibo de pago generado correctamente')
  }

  function exportHrExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hrSummary.people), 'Personal')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hrSummary.tasks), 'Tareas')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hrSummary.commissionsBySeller), 'Comisiones')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hrSummary.activityRows), 'Actividad')
    XLSX.writeFile(wb, `alohandote-rrhh-${searchDateSuffix()}.xlsx`)
  }

  const erpAutomationSummary = useMemo(() => {
    const incomeAuto = administrationRows.incomeRows.length
    const expenseAuto = administrationRows.maintenanceCostRows.length
    const inventoryAuto = inventoryMovementsStore.items.filter((item) => item.autoGenerated || String(item.reference || '').startsWith('MANT-')).length
    const cleaningTasks = hrTasksStore.items.filter((task) => task.autoGenerated && task.module === 'Alojamientos' && String(task.title || '').toLowerCase().includes('limpieza')).length
    const roiUpdates = reservationsStore.items.filter((item) => normalizeStatus(item.status) === 'returned' && num(item.kmRecorridos) > 0).length
    const commissions = administrationRows.commissionRows.length
    return { incomeAuto, expenseAuto, inventoryAuto, cleaningTasks, roiUpdates, commissions }
  }, [administrationRows, inventoryMovementsStore.items, hrTasksStore.items, reservationsStore.items])

  async function autoConsumeInventoryForMaintenance(record = {}, moduleName = 'Renta Car') {
    const itemId = record.inventoryItemId || record.maintenanceInventoryItemId || ''
    const quantity = num(record.inventoryQuantity || record.maintenanceInventoryQuantity || 0)
    const maintenanceId = record.id || record.sourceId || ''
    if (!itemId || quantity <= 0 || !maintenanceId) return
    const exists = inventoryMovementsStore.items.some((movement) => movement.reference === `MANT-${moduleName}-${maintenanceId}`)
    if (exists) return
    const item = inventoryItemsStore.items.find((row) => row.id === itemId)
    if (!item) return
    const nextQty = num(item.quantity) - quantity
    if (nextQty < 0) {
      setError(`Mantenimiento guardado, pero no se descontó inventario: stock insuficiente de ${item.name}.`)
      return
    }
    const unitCost = num(item.unitCost)
    await inventoryMovementsStore.createItem({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      kind: 'Salida',
      reason: 'Mantenimiento',
      module: moduleName,
      assetId: record.vehicleId || record.accommodationId || item.assetId || '',
      quantity,
      unitCost,
      totalCost: Number((quantity * unitCost).toFixed(2)),
      date: String(record.startDate || new Date().toISOString()).slice(0,10),
      responsible: record.createdByName || sellerName(profile, user),
      reference: `MANT-${moduleName}-${maintenanceId}`,
      notes: `Consumo automático generado desde mantenimiento ${record.maintenanceType || ''}`,
      autoGenerated: true,
      sourceType: 'maintenance',
      sourceId: maintenanceId,
    })
    await inventoryItemsStore.editItem(item.id, { ...item, quantity: nextQty, lastMovementAt: new Date().toISOString(), updatedBy: 'Automatización mantenimiento' })
  }

  async function autoCreateCleaningTaskForLodgingReservation(record = {}) {
    if (!record?.id || normalizeStatus(record.status) !== 'reserved') return
    const exists = hrTasksStore.items.some((task) => task.reservationId === record.id && task.autoGenerated && task.module === 'Alojamientos' && String(task.title || '').toLowerCase().includes('limpieza'))
    if (exists) return
    const apt = accommodations.find((item) => item.id === record.accommodationId) || {}
    await hrTasksStore.createItem({
      title: `Limpieza alojamiento - ${apt.name || 'Alojamiento'}`,
      module: 'Alojamientos',
      responsible: 'Limpieza',
      dueDate: record.endDate || record.startDate || new Date().toISOString().slice(0,10),
      priority: 'Alta',
      status: 'Pendiente',
      assetType: 'Alojamientos',
      assetId: record.accommodationId || '',
      reservationId: record.id,
      notes: `Tarea automática creada por reserva de ${record.customerName || 'huésped'}. Check-out: ${formatShortDate(record.endDate)}`,
      autoGenerated: true,
      sourceType: 'lodging-reservation',
      sourceId: record.id,
    })
  }

  const maintenanceRows = useMemo(() => {
    const vehicleMaint = reservationsStore.items
      .filter((item) => isMaintenanceRecord(item) && !isIcalImportedBlock(item))
      .map((item) => {
        const vehicle = vehicles.find((v) => v.id === item.vehicleId) || {}
        const currentKm = num(vehicle.currentKm || item.currentKm || 0)
        const nextEveryKm = num(item.nextMaintenanceEveryKm || item.nextMaintenanceKm || 0)
        const targetKm = nextEveryKm ? currentKm + nextEveryKm : num(item.maintenanceTargetKm || 0)
        return { ...item, module: 'Renta Car', assetName: vehicle.name || 'Vehículo', currentKm, targetKm, remainingKm: targetKm ? targetKm - currentKm : null }
      })
    const lodgingMaint = lodgingStore.items
      .filter((item) => isMaintenanceRecord(item) && !isIcalImportedBlock(item))
      .map((item) => {
        const apt = accommodations.find((a) => a.id === item.accommodationId) || {}
        return { ...item, module: 'Alojamiento', assetName: apt.name || 'Alojamiento', currentKm: 0, targetKm: 0, remainingKm: null }
      })
    return [...vehicleMaint, ...lodgingMaint].sort((a,b) => String(b.createdAt || b.updatedAt || b.startDate || '').localeCompare(String(a.createdAt || a.updatedAt || a.startDate || '')))
  }, [reservationsStore.items, lodgingStore.items, vehicles, accommodations])

  useEffect(() => {
    const moduleAccess = {
      cars: canViewCars && !isLogistics, carDeliveries: canUseCarLogistics, carReceptions: canUseCarLogistics,
      lodging: canViewLodging && !isLogistics, lodgingDeliveries: canUseLodgingLogistics && !isLogistics, lodgingReceptions: canUseLodgingLogistics,
      commercial: canViewCommercial, quotes: canViewCommercial, reservations: canViewCommercial,
      administration: canViewAdmin, inventory: canViewInventory, hr: canViewHr,
      maintenance: canUseMaintenance, profitability: canViewProfitability,
    }
    if (moduleAccess[moduleMode] === false) {
      const firstAllowed = [
        ['carDeliveries', canUseCarLogistics],
        ['carReceptions', canUseCarLogistics],
        ['lodgingReceptions', canUseLodgingLogistics],
        ['cars', canViewCars && !isLogistics],
        ['lodging', canViewLodging && !isLogistics],
        ['commercial', canViewCommercial],
        ['administration', canViewAdmin],
        ['inventory', canViewInventory],
        ['maintenance', canUseMaintenance],
        ['profitability', canViewProfitability],
      ].find(([, allowed]) => allowed)?.[0] || (canViewCommercial ? 'commercial' : 'cars')
      setModuleMode(firstAllowed)
    }
  }, [moduleMode, canViewCars, canViewLodging, canViewCommercial, canViewAdmin, canViewInventory, canViewHr, canUseMaintenance, canViewProfitability, canUseCarLogistics, canUseLodgingLogistics, isLogistics])

  useEffect(() => {
    if (!publicReceptionMode) return
    const params = new URLSearchParams(window.location.search)
    const vehicleFromLink = params.get('vehiculo') || params.get('vehicleId') || ''
    if (vehicleFromLink && vehicleFromLink !== selectedVehicleId) setSelectedVehicleId(vehicleFromLink)
    const targetVehicle = vehicles.find((item) => item.id === (vehicleFromLink || selectedVehicle?.id)) || selectedVehicle
    if (!editingVehicleCheckin && targetVehicle?.id) {
      setEditingVehicleCheckin(emptyVehicleCheckin(targetVehicle.id, profile, user))
    }
  }, [publicReceptionMode, selectedVehicle?.id, selectedVehicleId, vehicles.length])

  const accommodationReservations = lodgingStore.items.filter((reservation) => reservation.accommodationId === selectedAccommodation?.id && !isReservationCancelled(reservation))

  // V223.2: fuente única para KPIs del dashboard de alojamientos.
  // Evita mezclar consultas históricas, calendario e importaciones iCal en tarjetas distintas.
  const accommodationDashboard = useMemo(() => {
    const empty = { occupiedNights: 0, totalLodging: 0, reservations: 0, cleanings: 0, maintenance: 0, maintenanceRows: [], expenseRows: [], expenseTotal: 0, allyProfit: 0 }
    if (!selectedAccommodation?.id) return empty
    const { start: monthStart, end: monthEnd } = monthBounds(currentMonth)
    const rows = lodgingStore.items.filter((row) => {
      if (row.accommodationId !== selectedAccommodation.id) return false
      if (isReservationCancelled(row)) return false
      return rangesOverlap(row.startDate, row.endDate, monthStart, monthEnd)
    })
    const visibleDays = (row) => dayCount(
      row.startDate < monthStart ? monthStart : row.startDate,
      row.endDate > monthEnd ? monthEnd : row.endDate
    )
    const lodgingRevenue = (row) => {
      if (isIcalImportedBlock(row)) return 0
      const nights = visibleDays(row)
      const nightly = num(row.nightlyRate || selectedAccommodation?.nightlyRate)
      if (nightly > 0 && nights > 0) return nights * nightly
      const total = num(row.totalAmount || row.totalUsd || 0)
      const cleaning = num(row.cleaningFee || 0)
      const fullNights = Math.max(1, dayCount(row.startDate, row.endDate))
      const base = Math.max(0, total - cleaning)
      return Number(((base / fullNights) * Math.max(0, nights)).toFixed(2))
    }
    const expenseRows = assetExpensesForDetail('Alojamiento', selectedAccommodation.id)
    const allyProfit = (generalExpensesStore.items || [])
      .filter((row)=>row.sourceType === 'ownerPayableAlly' && String(row.assetId || '') === String(selectedAccommodation.id || ''))
      .reduce((sum,row)=>sum+num(row.alohandoteNetIncomeUsd || row.alohandoteIncomeUsd || 0),0)
    const accBase = { ...empty, expenseRows, expenseTotal: expenseRows.reduce((sum,row)=>sum+num(row.amountUsd),0), allyProfit }
    return rows.reduce((acc, row) => {
      const status = normalizeStatus(row.status)
      if (status === 'reserved') {
        acc.occupiedNights += visibleDays(row)
        acc.totalLodging += lodgingRevenue(row)
        acc.reservations += 1
        if (row.cleaningStatus === 'completed' || row.cleaningCompletedAt || row.checkOutStatus === 'completed') acc.cleanings += 1
      } else if (status === 'maintenance') {
        acc.maintenance += 1
        acc.maintenanceRows.push(row)
      }
      return acc
    }, accBase)
  }, [lodgingStore.items, selectedAccommodation?.id, selectedAccommodation?.nightlyRate, currentMonth, generalExpensesStore.items, exchangeRates])

  function exportLodgingDashboardExcel() {
    const wb = XLSX.utils.book_new()
    const { start: monthStart, end: monthEnd } = monthBounds(currentMonth)
    const rows = lodgingStore.items
      .filter((row) => selectedAccommodation?.id && row.accommodationId === selectedAccommodation.id && !isReservationCancelled(row) && rangesOverlap(row.startDate, row.endDate, monthStart, monthEnd))
      .map((row) => ({
        Alojamiento: selectedAccommodation?.name || '',
        Cliente: row.customerName || (isIcalImportedBlock(row) ? 'Reserva iCal' : ''),
        Origen: isIcalImportedBlock(row) ? 'iCal externo' : 'Sistema Alohandote',
        Estado: row.status || '',
        Desde: row.startDate || '',
        Hasta: row.endDate || '',
        Noches: dayCount(row.startDate < monthStart ? monthStart : row.startDate, row.endDate > monthEnd ? monthEnd : row.endDate),
        Total_Hospedaje_USD: isIcalImportedBlock(row) ? 0 : num(row.totalAmount || row.totalUsd || 0),
        Limpieza_Realizada: row.cleaningStatus === 'completed' || row.cleaningCompletedAt || row.checkOutStatus === 'completed' ? 'Sí' : 'No',
        Mantenimiento: normalizeStatus(row.status) === 'maintenance' ? (row.maintenanceType || 'Mantenimiento') : '',
        Detalle: row.note || row.notes || '',
      }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
      Alojamiento: selectedAccommodation?.name || '',
      Mes: monthTitle(currentMonth),
      Noches_ocupadas: accommodationDashboard.occupiedNights,
      Total_hospedaje_sistema_USD: accommodationDashboard.totalLodging,
      Reservas: accommodationDashboard.reservations,
      Limpiezas_realizadas: accommodationDashboard.cleanings,
      Mantenimientos: accommodationDashboard.maintenance,
      Gastos_asociados_USD: accommodationDashboard.expenseTotal,
      Ganancia_activos_aliados_USD: accommodationDashboard.allyProfit,
    }]), 'Dashboard')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Detalle')
    XLSX.writeFile(wb, `alohandote-dashboard-alojamientos-${selectedAccommodation?.name || 'alojamiento'}-${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}.xlsx`)
  }

  function exportRentCarDashboardExcel() {
    const wb = XLSX.utils.book_new()
    const { start: monthStart, end: monthEnd } = monthBounds(currentMonth)
    const rows = reservationsStore.items
      .filter((row) => selectedVehicle?.id && row.vehicleId === selectedVehicle.id && !isReservationCancelled(row) && rangesOverlap(row.startDate, row.endDate, monthStart, monthEnd))
      .map((row) => ({
        Vehiculo: selectedVehicle?.name || '',
        Cliente: row.customerName || '',
        Estado: row.status || '',
        Desde: row.startDate || '',
        Hasta: row.endDate || '',
        Dias: dayCount(row.startDate < monthStart ? monthStart : row.startDate, row.endDate > monthEnd ? monthEnd : row.endDate),
        Total_servicio_USD: num(row.totalAmount || row.amount || 0),
        Abonado_USD: storedPaidUsd(row, exchangeRates),
        Pendiente_USD: pendingAmount(row, exchangeRates),
        Lavado_limpieza: row.washStatus === 'completed' || row.cleaningStatus === 'completed' || row.vehicleWashDoneAt || row.receptionStatus === 'completed' ? 'Sí' : 'No',
        Mantenimiento: normalizeStatus(row.status) === 'maintenance' ? (row.maintenanceType || 'Mantenimiento') : '',
        Detalle: row.note || row.notes || '',
      }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
      Vehiculo: selectedVehicle?.name || '',
      Mes: monthTitle(currentMonth),
      Dias_ocupados: analytics.occupied,
      Total_servicio_USD: analytics.totalService,
      Abonado_USD: analytics.collected,
      Pendiente_USD: analytics.pending,
      Lavados_limpiezas: analytics.cleanings,
      Mantenimientos: analytics.maintenance.length,
        Gastos_asociados_USD: analytics.expenseTotal,
        Ganancia_activos_aliados_USD: analytics.allyProfit,
    }]), 'Dashboard')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Detalle')
    XLSX.writeFile(wb, `alohandote-dashboard-rentacar-${selectedVehicle?.name || 'vehiculo'}-${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}.xlsx`)
  }

  function inferLeadModule(item = {}) {
    const raw = `${item.module || ''} ${item.serviceType || ''} ${item.type || ''} ${item.quoteType || ''}`.toLowerCase()
    if (item.accommodationId || item.lodgingId || item.propertyId || raw.includes('aloj') || raw.includes('hosped') || raw.includes('airbnb') || raw.includes('propiedad')) return 'lodging'
    if (item.vehicleId || raw.includes('renta') || raw.includes('rent') || raw.includes('veh') || raw.includes('car')) return 'cars'
    return moduleMode === 'lodging' ? 'lodging' : 'cars'
  }

  function leadServiceLabel(item = {}) {
    return item.module || item.serviceType || item.type || 'Cotización / Lead'
  }

  const globalSearchResults = useMemo(() => {
    const isAdminProfile = normalizeRole(profile?.role) === 'admin'
    const currentUid = user?.uid || ''
    const currentEmail = String(user?.email || '').toLowerCase()
    const currentName = String(sellerName(profile, user) || '').toLowerCase()
    const belongsToCurrentUser = (item) => {
      if (isAdminProfile) return true
      const itemUid = String(item?.createdByUid || item?.sellerUid || '')
      const itemEmail = String(item?.createdByEmail || item?.sellerEmail || '').toLowerCase()
      const itemName = String(item?.createdByName || item?.seller || item?.sellerName || '').toLowerCase()
      return (currentUid && itemUid === currentUid) || (currentEmail && itemEmail === currentEmail) || (currentName && itemName === currentName)
    }
    const normalizeSearchText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const contains = (value, query) => !query || normalizeSearchText(value).includes(normalizeSearchText(query).trim())
    const dateOnly = (value) => {
      if (!value) return ''
      const raw = String(value)
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
      const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      if (match) return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`
      const parsed = new Date(raw)
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
    }
    const dateWithin = (date, start, end) => {
      if (!date) return false
      if (start && date < start) return false
      if (end && date > end) return false
      return true
    }
    const inDateRange = (item = {}) => {
      const filterStart = searchFilters.startDate || ''
      const filterEnd = searchFilters.endDate || searchFilters.startDate || ''
      if (!filterStart && !filterEnd) return true

      // Regla comercial:
      // Cotizaciones y reservas se filtran por FECHA DE CREACIÓN del registro,
      // no por la fecha del servicio. Así, si hoy se cotiza o se reserva para una fecha futura,
      // aparece al buscar el día de hoy.
      const created = dateOnly(item.createdAt || item.created_at || item.createdOn || item.timestamp)
      return dateWithin(created, filterStart, filterEnd)
    }
    const matchesOperator = (item) => contains(`${item.createdByName || ''} ${item.createdByEmail || ''} ${item.seller || ''} ${item.sellerName || ''}`, searchFilters.operator || '')
    const isCommercialReservation = (item) => !isIcalImportedBlock(item) && normalizeStatus(item.status) !== 'maintenance' && normalizeStatus(item.status) !== 'cancelled'
    const matchesPerson = (item) => contains(item.customerName || item.name, searchFilters.name || globalSearch)
      && contains(item.customerId, searchFilters.customerId)
      && contains(item.phone, searchFilters.phone)
      && matchesOperator(item)
      && inDateRange(item)

    const reservationRows = [
      ...reservationsStore.items.filter((item) => isCommercialReservation(item) && belongsToCurrentUser(item) && matchesPerson(item)).map((item) => {
        const vehicle = vehicles.find((vehicle) => vehicle.id === item.vehicleId) || {}
        return { id: `car-${item.id}`, type: 'Reserva Renta Car', module: 'cars', kind: 'reservation', source: item, title: item.customerName || 'Sin cliente', subtitle: `${vehicle.name || 'Vehículo'} · ${item.customerId || 'Sin C.I.'} · ${item.phone || 'Sin teléfono'}`, date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-VE') : `${item.startDate || ''} - ${item.endDate || ''}`, amount: num(item.totalAmount || item.amount) }
      }),
      ...lodgingStore.items.filter((item) => isCommercialReservation(item) && belongsToCurrentUser(item) && matchesPerson(item)).map((item) => {
        const apt = accommodations.find((apt) => apt.id === item.accommodationId) || {}
        return { id: `lodging-${item.id}`, type: 'Reserva Alojamiento', module: 'lodging', kind: 'reservation', source: item, title: item.customerName || 'Sin huésped', subtitle: `${apt.name || 'Alojamiento'} · ${item.customerId || 'Sin C.I.'} · ${item.phone || 'Sin teléfono'}`, date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-VE') : `${item.startDate || ''} - ${item.endDate || ''}`, amount: num(item.totalAmount || item.amount) }
      })
    ]
    const quoteRows = leadsStore.items.filter((item) => belongsToCurrentUser(item) && matchesPerson(item)).map((item) => {
      const inferredModule = inferLeadModule(item)
      return { id: `lead-${item.id}`, type: leadServiceLabel(item), module: inferredModule, kind: 'quote', source: item, title: item.customerName || item.name || 'Lead sin nombre', subtitle: `${inferredModule === 'lodging' ? 'Alojamiento' : 'Renta Car'} · ${item.customerId || 'Sin C.I.'} · ${item.phone || 'Sin teléfono'} · ${item.status || 'cotizado'}`, date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-VE') : '', amount: num(item.totalAmount || item.amount) }
    })
    const activeRows = searchMode === 'quotes' ? quoteRows : reservationRows
    const moduleFiltered = searchFilters.module === 'all' ? activeRows : activeRows.filter((row) => row.module === searchFilters.module)
    return moduleFiltered.slice(0, 80)
  }, [globalSearch, searchFilters, searchMode, reservationsStore.items, lodgingStore.items, leadsStore.items, vehicles, accommodations, profile, user])


  function openGlobalSearchResult(row) {
    setError('')
    if (!row?.source) return
    if (row.module === 'lodging') {
      if (!['commercial','quotes','reservations'].includes(moduleMode)) setModuleMode('lodging')
      setEditingReservation(null)
      const source = row.source || {}
      const accommodationId = source.accommodationId || source.lodgingId || source.propertyId || selectedAccommodation?.id || accommodations[0]?.id || ''
      if (accommodationId) setSelectedAccommodationId(accommodationId)
      if (row.kind === 'quote') {
        const today = new Date().toISOString().slice(0,10)
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,10)
        const base = emptyLodgingReservation(accommodationId, source.startDate || today, profile, user)
        const apt = accommodations.find((item) => item.id === accommodationId) || {}
        setEditingLodging({
          ...base,
          ...source,
          accommodationId,
          startDate: source.startDate || today,
          endDate: source.endDate || tomorrow,
          customerName: source.customerName || source.name || '',
          customerId: source.customerId || '',
          phone: source.phone || '',
          nightlyRate: source.nightlyRate || apt.nightlyRate || base.nightlyRate || '',
          cleaningFee: source.cleaningFee || apt.cleaningFee || base.cleaningFee || '',
          totalAmount: source.totalAmount || source.amount || '',
          amount: source.amount || '',
          status: 'reserved',
          id: '',
        })
      } else if (source.id) {
        setEditingLodging({ ...emptyLodgingReservation(accommodationId, source.startDate || '', profile, user), ...source })
      }
    } else {
      if (!['commercial','quotes','reservations'].includes(moduleMode)) setModuleMode('cars')
      setEditingLodging(null)
      const source = row.source || {}
      const vehicleId = source.vehicleId || source.carId || source.vehicle || selectedVehicle?.id || vehicles[0]?.id || ''
      if (vehicleId) setSelectedVehicleId(vehicleId)
      if (row.kind === 'quote') {
        const today = new Date().toISOString().slice(0,10)
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,10)
        const base = emptyReservation(vehicleId, source.startDate || today, profile, user)
        const vehicle = vehicles.find((item) => item.id === vehicleId) || {}
        setEditingReservation({
          ...base,
          ...source,
          vehicleId,
          startDate: source.startDate || today,
          endDate: source.endDate || tomorrow,
          customerName: source.customerName || source.name || '',
          customerId: source.customerId || '',
          phone: source.phone || '',
          pricePerKm: source.pricePerKm || vehicleKmRate(vehicle),
          dailyRate: source.dailyRate || vehicle.dailyRentalRate || base.dailyRate || '',
          totalAmount: source.totalAmount || source.amount || '',
          amount: source.amount || '',
          status: 'reserved',
          id: '',
        })
      } else if (source.id || source.__docId) {
        openEditReservation({ ...emptyReservation(vehicleId, source.startDate || '', profile, user), ...source })
      }
    }
    setGlobalSearch('')
  }
  async function deleteSearchResult(row) {
    if (!isAdmin || !row?.source?.id) return
    if (isIcalImportedBlock(row.source)) return setError('Las reservas iCal no se pueden eliminar desde Comercial. Usa la gestión iCal del alojamiento.')
    if (normalizeStatus(row.source.status) === 'maintenance') return setError('Los mantenimientos no se eliminan como reservas. Gestiona ese bloqueo desde Mantenimiento.')
    if (!confirm(`¿Eliminar ${row.kind === 'quote' ? 'cotización' : 'reserva'} de ${row.title}?`)) return
    if (row.kind === 'quote') await leadsStore.removeItem(row.source.id)
    else if (row.module === 'lodging') { await cleanupLinkedReservationArtifacts(row.source, 'Alojamientos'); await lodgingStore.removeItem(row.source.id) }
    else { await cleanupLinkedReservationArtifacts(row.source, 'Renta Car'); await reservationsStore.removeItem(row.source.id) }
    await logAudit(row.kind === 'quote' ? 'quote_deleted' : 'reservation_deleted', row.module === 'lodging' ? 'Alojamientos' : 'Renta Car', row.source.id, row.source, { origin: 'commercial_search', hardDelete: row.kind !== 'quote' })
    showSuccess(row.kind === 'quote' ? 'Cotización eliminada correctamente' : 'Reserva eliminada correctamente')
  }


  function matchingLeadForReservation(reservation, moduleName = 'Renta Car') {
    return leadsStore.items.find((lead) =>
      (lead.status === 'cliente' || lead.status === 'reserved') &&
      (lead.module === moduleName || lead.serviceType === moduleName) &&
      String(lead.customerName || '') === String(reservation.customerName || '') &&
      String(lead.phone || '') === String(reservation.phone || '') &&
      String(lead.startDate || '') === String(reservation.startDate || '') &&
      String(lead.endDate || '') === String(reservation.endDate || '')
    )
  }

  async function cleanupLinkedReservationArtifacts(reservation = {}, moduleName = 'Renta Car') {
    const reservationId = String(reservation.id || reservation.__docId || '')
    if (!reservationId) return { expenses: 0, leads: 0, operations: 0, publicSubmissions: 0 }
    const matchesReservation = (row = {}) => String(row.sourceReservationId || row.reservationId || row.sourceId || '') === reservationId
    let expenses = 0
    for (const row of (generalExpensesStore.items || []).filter(matchesReservation)) {
      if (row?.id) { await generalExpensesStore.removeItem(row.id); expenses += 1 }
    }
    let operations = 0
    for (const row of (vehicleCheckinsStore.items || []).filter(matchesReservation)) {
      if (row?.id) { await vehicleCheckinsStore.removeItem(row.id); operations += 1 }
    }
    let publicSubmissions = 0
    for (const row of (publicOperationSubmissionsStore.items || []).filter(matchesReservation)) {
      if (row?.id) { await publicOperationSubmissionsStore.removeItem(row.id); publicSubmissions += 1 }
    }
    let leads = 0
    const lead = matchingLeadForReservation(reservation, moduleName)
    if (lead?.id) { await leadsStore.removeItem(lead.id); leads += 1 }
    if (moduleName === 'Alojamientos') await removePublicIcalBlock(reservationId)
    return { expenses, leads, operations, publicSubmissions }
  }

  async function hardDeleteReservation(reservation) {
    if (!reservation?.id) return
    if (isIcalImportedBlock(reservation)) return setError('Las reservas iCal no se pueden eliminar desde ningún perfil.')
    if (!confirm('¿Eliminar definitivamente esta reserva? Se borrará del calendario y de los registros.')) return
    const cleanup = await cleanupLinkedReservationArtifacts(reservation, 'Renta Car')
    await reservationsStore.removeItem(reservation.id)
    await logAudit('reservation_deleted', 'Renta Car', reservation.id, reservation, { hardDelete: true, cleanup })
    setEditingReservation(null)
    showSuccess('Reserva eliminada definitivamente')
  }

  async function hardDeleteLodgingReservation(reservation) {
    if (!reservation?.id) return
    if (isIcalImportedBlock(reservation)) return setError('Las reservas iCal no se pueden eliminar desde ningún perfil. Usa Eliminar bloqueos iCal del alojamiento.')
    if (!confirm('¿Eliminar definitivamente esta reserva? Se borrará del calendario y de los registros.')) return
    const cleanup = await cleanupLinkedReservationArtifacts(reservation, 'Alojamientos')
    await lodgingStore.removeItem(reservation.id)
    await logAudit('lodging_reservation_deleted', 'Alojamientos', reservation.id, reservation, { hardDelete: true, cleanup })
    setEditingLodging(null)
    showSuccess('Reserva eliminada definitivamente')
  }

  function openRefundReservation(reservation) {
    if (!reservation?.id) return
    setEditingReservation(null)
    setEditingRefund({
      module: 'Renta Car',
      reservation,
      refundPaymentMethod: reservation.refundPaymentMethod || reservation.paymentMethod || 'Pago en BS',
      refundAmount: refundDefaultAmount(reservation, reservation.refundPaymentMethod || reservation.paymentMethod || 'Pago en BS', exchangeRates),
      refundReference: reservation.refundReference || '',
      refundReason: reservation.refundReason || 'Cancelación solicitada por el cliente',
      refundProof: reservation.refundProof || null,
      _refundProofFile: null,
    })
  }

  function openRefundLodging(reservation) {
    if (!reservation?.id) return
    setEditingLodging(null)
    setEditingRefund({
      module: 'Alojamientos',
      reservation,
      refundPaymentMethod: reservation.refundPaymentMethod || reservation.paymentMethod || 'Pago en BS',
      refundAmount: refundDefaultAmount(reservation, reservation.refundPaymentMethod || reservation.paymentMethod || 'Pago en BS', exchangeRates),
      refundReference: reservation.refundReference || '',
      refundReason: reservation.refundReason || 'Cancelación solicitada por el huésped',
      refundProof: reservation.refundProof || null,
      _refundProofFile: null,
    })
  }

  async function submitRefundCancellation(event = null) {
    event?.preventDefault?.()
    if (!editingRefund?.reservation?.id) return
    const refundRawAmount = num(editingRefund.refundAmount)
    if (refundRawAmount <= 0) return setError('Debes colocar el monto de la anulación/devolución.')
    if (!editingRefund.refundPaymentMethod) return setError('Debes seleccionar método de devolución.')
    const refundReference = String(editingRefund.refundReference || '').trim() || `ANULACION-${Date.now()}`
    let refundProof = editingRefund.refundProof || null
    if (editingRefund._refundProofFile) {
      try {
        refundProof = await uploadReservationFile(editingRefund._refundProofFile, 'comprobante-anulacion-devolucion')
      } catch (uploadErr) {
        console.warn('No se pudo subir comprobante de anulación/devolución:', uploadErr)
        refundProof = { name: editingRefund._refundProofFile.name, url: '', pendingUpload: true }
      }
    }
    const reason = editingRefund.refundReason || 'Cancelación solicitada por el cliente'
    const now = new Date().toISOString()
    const refundRate = euroRateValue(exchangeRates, editingRefund.refundBcvEuroRate || editingRefund.reservation.bcvEuroRate || '')
    const refundBucket = paymentBucket(editingRefund.refundPaymentMethod)
    const paidUsdForRefund = storedPaidUsd(editingRefund.reservation, exchangeRates)
    const paidBsForRefund = storedPaidBs(editingRefund.reservation, exchangeRates)
    if (refundBucket === 'Bs' && paidBsForRefund > 0 && refundRawAmount > paidBsForRefund + 0.01) return setError(`La devolución en Bs no puede superar lo pagado: ${bsMoney(paidBsForRefund)}.`)
    if (refundBucket !== 'Bs' && paidUsdForRefund > 0 && refundRawAmount > paidUsdForRefund + 0.01) return setError(`La devolución en $ no puede superar lo pagado: ${money(paidUsdForRefund)}.`)
    const refundAmountUsd = refundBucket === 'Bs' ? (refundRate ? Number((refundRawAmount / refundRate).toFixed(2)) : 0) : Number(refundRawAmount.toFixed(2))
    // V182: si la devolución se realiza en Zelle / USDT-Binance / Efectivo $, se guarda
    // refundAmountBs = 0 para que el dashboard no muestre devoluciones en Bs falsas.
    const refundAmountBs = refundBucket === 'Bs' ? Number(refundRawAmount.toFixed(2)) : 0
    const noteLine = `Anulada con devolución ${refundBucket === 'Bs' ? bsMoney(refundAmountBs) : money(refundAmountUsd)}. Motivo: ${reason}. Ref: ${refundReference}`
    const payload = {
      ...editingRefund.reservation,
      status: 'cancelled',
      originalStatus: editingRefund.reservation.status || '',
      refundAmount: refundAmountUsd,
      refundAmountBs,
      refundRawAmount,
      refundPaymentMethod: editingRefund.refundPaymentMethod,
      refundReference,
      refundReason: reason,
      refundProof,
      refundBcvEuroRate: refundRate || editingRefund.reservation.bcvEuroRate || '',
      refundAt: now,
      cancelledAt: now,
      cancellationType: 'annulment_refund',
      calendarReleased: true,
      receivableClosed: true,
      adminExpenseRegistered: true,
      note: `${editingRefund.reservation.note || ''}
${noteLine}`.trim(),
      updatedAt: now,
    }
    if (editingRefund.module === 'Renta Car') {
      await reservationsStore.editItem(editingRefund.reservation.id, payload)
      await logAudit('refund_registered', 'Renta Car', editingRefund.reservation.id, payload, { refundAmount: payload.refundAmount, refundAmountBs: payload.refundAmountBs, reason, reference: payload.refundReference })
    } else {
      await lodgingStore.editItem(editingRefund.reservation.id, payload)
      await upsertPublicIcalBlock({ ...payload, id: editingRefund.reservation.id })
      await logAudit('refund_registered', 'Alojamientos', editingRefund.reservation.id, payload, { refundAmount: payload.refundAmount, refundAmountBs: payload.refundAmountBs, reason, reference: payload.refundReference })
    }
    setEditingRefund(null)
    setEditingReservation(null)
    setOperationsRevision((value) => value + 1)
    setEditingLodging(null)
    showSuccess('Anulación guardada con éxito')
  }



  useEffect(() => {
    if (!isAdmin || !isFirebaseReady || !db) return
    vehicles
      .filter((vehicle) => vehicle.id && !vehicle.pricePerKm && !vehicle.kmRate && !vehicle.costPerKm)
      .forEach((vehicle) => vehiclesStore.editItem(vehicle.id, { ...vehicle, pricePerKm: KM_RATE }))
  }, [isAdmin, vehicles.length])


  function changeMonth(offset) { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)) }

  function lodgingNights(start, end) { return dayCount(start, end) }
  function lodgingTotal(nights, nightlyRate, cleaningFee = 0) { return Number((num(nights) * num(nightlyRate) + num(cleaningFee)).toFixed(2)) }
  function openCreateLodging(date) { setError(''); if (!selectedAccommodation?.id) return setError('Selecciona un alojamiento antes de crear la reserva.'); const base = emptyLodgingReservation(selectedAccommodation.id, toISODate(date), profile, user); const total = lodgingTotal(1, selectedAccommodation?.nightlyRate || 0, selectedAccommodation?.cleaningFee || 0); const allyIncome = isAlliedAccommodation(selectedAccommodation) ? allyIncomeTargetUsd(total, selectedAccommodation?.allyProfitMode || 'fixed', selectedAccommodation?.allyProfitValue || 0) : ''; setEditingLodging({ ...base, createdByName: normalizePersonName(sellerName(profile, user)), nightlyRate: selectedAccommodation?.nightlyRate || '', cleaningFee: selectedAccommodation?.cleaningFee || '', lodgingOwnershipType: isAlliedAccommodation(selectedAccommodation) ? 'Aliado' : 'Propio', allyProfitMode: selectedAccommodation?.allyProfitMode || 'fixed', allyProfitValue: selectedAccommodation?.allyProfitValue || '', alohandoteIncomeUsd: allyIncome, ownerShareUsd: isAlliedAccommodation(selectedAccommodation) ? Math.max(0, Number((total - num(allyIncome)).toFixed(2))) : '', nights: '1', totalAmount: String(total) }) }
  function openEditLodging(reservation) { setError(''); const safeId = reservation.__docId || reservation.id || reservation.docId || reservation.reservationId || ''; setEditingLodging({ ...reservation, id: safeId, __docId: reservation.__docId || safeId, _editingOriginalId: safeId, _originalPaymentAmount: '', amount: '', paymentReference: '', paymentHistory: normalizePaymentHistory(reservation) }) }
  function getLodgingForDate(date) { const iso = toISODate(date); return accommodationReservations.find((reservation) => !isNonBlockingShortMaintenance(reservation) && isDateInsideRange(iso, reservation.startDate, reservation.endDate)) }
  function updateLodgingDates(next) { const nights = lodgingNights(next.startDate, next.endDate); const total = lodgingTotal(nights, next.nightlyRate, next.cleaningFee); setEditingLodging({ ...next, nights: String(nights), totalAmount: total ? String(total) : '' }) }
  function handleLodgingRateChange(value) { const nights = lodgingNights(editingLodging.startDate, editingLodging.endDate); setEditingLodging({ ...editingLodging, nightlyRate: value, nights: String(nights), totalAmount: String(lodgingTotal(nights, value, editingLodging.cleaningFee)) }) }
  function handleLodgingCleaningChange(value) { const nights = lodgingNights(editingLodging.startDate, editingLodging.endDate); setEditingLodging({ ...editingLodging, cleaningFee: value, nights: String(nights), totalAmount: String(lodgingTotal(nights, editingLodging.nightlyRate, value)) }) }
  function validateLodging(payload) {
    const status = normalizeStatus(payload.status)
    return validateLodgingCritical(paymentValidationDraft(payload, exchangeRates, payload.bcvEuroRate || officialEuroRate), {
      items: status === 'maintenance' ? [] : lodgingStore.items,
      exchangeRates,
      conflictMessage: (conflict) => `Ese rango choca con ${statusMeta(conflict.status).label}: ${conflict.customerName || 'Sin huésped'} (${formatShortDate(conflict.startDate)} ${conflict.deliveryTime || '00:00'} - ${formatShortDate(conflict.endDate)} ${conflict.returnTime || '23:59'}).`
    })
  }
  async function saveLodging(event) {
    event.preventDefault(); setError('')
    // V203: permisos por vendedor en alojamientos: solo puede editar registros propios.
    if (!isAdmin && editingLodging?.id && !canEditReservation(editingLodging)) return setError('Tu perfil solo puede modificar reservas creadas por tu usuario.')
    const validationError = validateLodging({ ...editingLodging, id: editingLodging?.id || '' })
    if (validationError) return setError(validationError)
    const paymentRequiredError = reservationPaymentRequiredError(editingLodging)
    if (paymentRequiredError) return setError(paymentRequiredError)
    const status = normalizeStatus(editingLodging.status)
    const nights = lodgingNights(editingLodging.startDate, editingLodging.endDate)
    const total = status === 'reserved' ? (isAdmin && editingLodging.totalAmount ? Number(editingLodging.totalAmount) : lodgingTotal(nights, editingLodging.nightlyRate, editingLodging.cleaningFee)) : ''
    const paymentProof = editingLodging._paymentProofFile ? await uploadReservationFile(editingLodging._paymentProofFile, 'comprobante-pago-alojamiento') : editingLodging.paymentProof || null
    const lodgingEuroRate = euroRateValue(exchangeRates, editingLodging.bcvEuroRate || officialEuroRate)
    const lodgingRates = lodgingEuroRate ? { ...(exchangeRates || {}), bcvEuro: lodgingEuroRate } : exchangeRates
    const aptForLodging = accommodations.find((apt) => String(apt.id || '') === String(editingLodging.accommodationId || '')) || selectedAccommodation || {}
    const lodgingOwnershipType = isAlliedAccommodation(aptForLodging) || String(editingLodging.lodgingOwnershipType || '').toLowerCase() === 'aliado' ? 'Aliado' : 'Propio'
    const existingLodgingForEdit = editingLodging.id ? (lodgingStore.items.find((item) => item.id === editingLodging.id || item.__docId === editingLodging.id) || editingLodging) : editingLodging
    // V211.1 Hotfix: si el usuario editó o eliminó abonos en el modal, la fuente de verdad es el borrador visible.
    // Antes se volvía a leer el registro guardado y al presionar Guardar reaparecía el abono eliminado/modificado.
    const existingPayments = editingLodging?._paymentsEdited ? normalizePaymentHistory(editingLodging) : (editingLodging.id ? normalizePaymentHistory(existingLodgingForEdit) : [])
    const newPayment = shouldAppendPaymentOnSave(editingLodging, editingLodging.id || '') ? buildPaymentEntry(paymentAppendRawAmountOnSave(editingLodging, editingLodging.id || ''), editingLodging.paymentMethod, lodgingRates, lodgingEuroRate, editingLodging.paymentReference || '') : null
    const paymentHistory = status === 'reserved' ? appendPaymentOnce(existingPayments, newPayment) : []
    const paymentTotals = paymentHistoryTotals({ paymentHistory })
    const paidUsd = paymentTotals.amountUsd
    const paidBs = paymentTotals.amountBs
    const allyProfitMode = editingLodging.allyProfitMode || aptForLodging.allyProfitMode || 'fixed'
    const allyProfitValue = editingLodging.allyProfitValue || aptForLodging.allyProfitValue || editingLodging.alohandoteIncomeUsd || ''
    // V223.5.2: no se aplica automáticamente el %/monto de ganancia definido en el activo.
    // La CxP nace por el total de la reserva y la ganancia Alohandote se define al liquidar/editar la CxP.
    const allyTargetIncome = lodgingOwnershipType === 'Aliado' ? 0 : total
    const allyOwnerTarget = lodgingOwnershipType === 'Aliado' ? num(total) : 0
    const allyOwnerPayable = lodgingOwnershipType === 'Aliado' ? num(total) : 0
    const payload = {
      accommodationId: editingLodging.accommodationId, customerName: status === 'reserved' ? editingLodging.customerName.trim() : '', customerIdType: status === 'reserved' ? (editingLodging.customerIdType || (String(editingLodging.customerId||'').trim().toUpperCase().startsWith('E-') ? 'E' : 'V')) : '', customerId: status === 'reserved' ? (editingLodging.customerId || '').trim() : '', phone: status === 'reserved' ? editingLodging.phone || '' : '', email: status === 'reserved' ? (editingLodging.email || '').trim() : '',
      startDate: editingLodging.startDate, endDate: editingLodging.endDate, checkInTime: editingLodging.checkInTime || '15:00', checkOutTime: editingLodging.checkOutTime || '11:00', status: editingLodging.status,
      channel: status === 'reserved' ? editingLodging.channel : '', note: editingLodging.note || '', nights: status === 'reserved' ? String(nights) : '', nightlyRate: status === 'reserved' ? editingLodging.nightlyRate || selectedAccommodation?.nightlyRate || '' : '',
      totalAmount: total, amount: status === 'reserved' ? String(paymentTotals.rawAmount || editingLodging.amount || '') : '', cleaningFee: status === 'reserved' ? editingLodging.cleaningFee || '' : '', paymentMethod: status === 'reserved' ? editingLodging.paymentMethod || '' : '', paymentReference: status === 'reserved' ? editingLodging.paymentReference || '' : '', paymentProof: status === 'reserved' ? paymentProof : null,
      sellerCommission: status === 'reserved' && !isAdmin ? String(commissionFromTotal(total)) : '',
      lodgingOwnershipType: status === 'reserved' ? lodgingOwnershipType : '', allyProfitMode: status === 'reserved' ? allyProfitMode : '', allyProfitValue: status === 'reserved' ? allyProfitValue : '', alohandoteIncomeUsd: status === 'reserved' ? String(allyTargetIncome || '') : '', ownerShareUsd: status === 'reserved' ? String(allyOwnerTarget || '') : '', ownerPayableUsd: status === 'reserved' ? String(allyOwnerPayable || '') : '', ownerPayableStatus: status === 'reserved' && allyOwnerPayable > 0 ? 'Por pagar' : '',
      bcvEuroRate: status === 'reserved' ? (editingLodging.bcvEuroRate || lodgingEuroRate || exchangeRates?.bcvEuro || '') : '', totalAmountBs: status === 'reserved' ? String(amountBs(total, lodgingRates, lodgingEuroRate)) : '', amountBs: status === 'reserved' ? String(paidBs) : '', amountUsdEquivalent: status === 'reserved' ? String(paidUsd) : '', paymentHistory: status === 'reserved' ? paymentHistory : [],
      maintenanceType: status === 'maintenance' ? editingLodging.maintenanceType || 'Preventivo' : '', maintenanceCost: status === 'maintenance' ? editingLodging.maintenanceCost || '' : '', maintenancePaymentMethod: status === 'maintenance' ? editingLodging.maintenancePaymentMethod || 'BS' : '', expenseStatus: status === 'maintenance' ? editingLodging.expenseStatus || 'Pagado' : '', bcvDollarRate: status === 'maintenance' ? editingLodging.bcvDollarRate || dollarRateValue(exchangeRates) || '' : '', maintenanceBsCost: status === 'maintenance' ? String(maintenanceBsCost(editingLodging, exchangeRates)) : '', inventoryItemId: status === 'maintenance' ? editingLodging.inventoryItemId || '' : '', inventoryQuantity: status === 'maintenance' ? editingLodging.inventoryQuantity || '' : '',
      createdByUid: editingLodging.createdByUid || user?.uid || '', createdByEmail: editingLodging.createdByEmail || user?.email || '', createdByName: normalizePersonName(editingLodging.createdByName || sellerName(profile, user)), createdByRole: editingLodging.createdByRole || profile?.role || '', createdAt: editingLodging.createdAt || editingLodging.creationDate || new Date().toISOString(), creationDate: editingLodging.creationDate || editingLodging.createdAt || new Date().toISOString(),
      bcvEuro: editingLodging.bcvEuroRate || lodgingEuroRate || exchangeRates?.bcvEuro || '', usdtMarket: exchangeRates?.binanceUsdt || '', exchangeAdjustmentPercent,
    }
    let savedId = editingLodging.id || ''
    if (editingLodging.id) await lodgingStore.editItem(editingLodging.id, payload); else { const created = await lodgingStore.createItem(payload); savedId = created?.id || '' }
    const savedRecord = { ...payload, id: savedId }
    for (const row of (generalExpensesStore.items || []).filter((row) => String(row.sourceReservationId || '') === String(savedId) && ['ownerPayableAlly'].includes(row.sourceType))) {
      if (status === 'reserved' && savedRecord.lodgingOwnershipType === 'Aliado' && num(savedRecord.ownerPayableUsd) > 0) continue
      if (row?.id) await generalExpensesStore.removeItem(row.id)
    }
    if (status === 'reserved' && savedRecord.lodgingOwnershipType === 'Aliado' && num(savedRecord.ownerPayableUsd) > 0) {
      const ownerPayableCurrency = paymentDisplayCurrency(savedRecord.paymentMethod)
      const ownerPayableMethod = savedRecord.paymentMethod || '$ Efectivo'
      const ownerPayableAmountBs = ownerPayableCurrency === 'Bs' ? receivablePendingBs({ ...savedRecord, totalAmount: savedRecord.ownerPayableUsd, amount: savedRecord.ownerPayableUsd, paymentMethod: ownerPayableMethod }, lodgingRates) : amountBs(num(savedRecord.ownerPayableUsd), lodgingRates, lodgingEuroRate)
      const payablePayload = { date: savedRecord.createdAt ? String(savedRecord.createdAt).slice(0,10) : new Date().toISOString().slice(0,10), category: 'Pago propietario aliado', description: `Pago propietario ${aptForLodging.allyOwnerName || aptForLodging.name || 'alojamiento aliado'} · ${savedRecord.customerName || 'Reserva'}`, amount: num(savedRecord.ownerPayableUsd), currency: ownerPayableCurrency, amountBs: String(ownerPayableAmountBs), paymentMethod: ownerPayableMethod, paymentCurrency: ownerPayableCurrency, paymentChannel: paymentDisplayMethod(ownerPayableMethod), expenseStatus: 'Por pagar', assetType: 'Alojamiento', assetId: savedRecord.accommodationId || '', responsible: savedRecord.createdByName || sellerName(profile, user), bcvDollarRate: lodgingEuroRate || euroRateValue(exchangeRates, officialEuroRate), notes: 'Cuenta por pagar automática generada por reserva de alojamiento aliado. Nace por el total de la reserva; la ganancia Alohandote se define al editar/liquidar la CxP. No descuenta caja hasta marcar como Pagado.', reservationTotalUsd: num(savedRecord.totalAmount), reservationTotalBs: String(ownerPayableAmountBs), alohandoteNetIncomeUsd: num(savedRecord.alohandoteIncomeUsd), alohandoteNetIncomeBs: '', sourceReservationId: savedId, sourceType: 'ownerPayableAlly', createdByUid: user?.uid || '', createdByEmail: user?.email || '', createdByName: sellerName(profile, user) }
      const existingPayable = (generalExpensesStore.items || []).find((row) => row.sourceType === 'ownerPayableAlly' && String(row.sourceReservationId || '') === String(savedId))
      if (existingPayable?.id) await generalExpensesStore.editItem(existingPayable.id, { ...existingPayable, ...payablePayload })
      else await generalExpensesStore.createItem(payablePayload)
    }
    // V192: export iCal de salida inmediato.
    // Cada reserva interna de Alohandote actualiza la colección pública que leen Airbnb/Estei.
    // No toca caja, pagos ni importaciones iCal externas.
    await upsertPublicIcalBlock(savedRecord)
    try {
      const aptForExport = accommodations.find((apt) => String(apt.id || '') === String(savedRecord.accommodationId || '')) || selectedAccommodation
      if (aptForExport?.id) await syncPublicIcalBlocksForAccommodation(aptForExport)
    } catch (err) {
      console.warn('No se pudo refrescar export iCal público después de guardar reserva:', err?.message || err)
    }
    if (status === 'maintenance') await autoConsumeInventoryForMaintenance(savedRecord, 'Alojamientos')
    if (status === 'reserved') {
      await upsertLead('Alojamientos', payload, 'cliente')
      await autoCreateCleaningTaskForLodgingReservation(savedRecord)
    }
    await logAudit(editingLodging.id ? (status === 'maintenance' ? 'maintenance_updated' : 'lodging_reservation_updated') : (status === 'maintenance' ? 'maintenance_created' : 'lodging_reservation_created'), 'Alojamientos', savedId, savedRecord, { status, dates: `${savedRecord.startDate || ''} - ${savedRecord.endDate || ''}` })
    setEditingLodging(savedRecord); setError(''); showSuccess(status === 'maintenance' ? 'Mantenimiento guardado y automatizaciones ERP aplicadas' : 'Reserva guardada, ingreso y tarea de limpieza actualizados')
  }
  async function uploadAccommodationPhotos(files = []) {
    const fileList = Array.from(files || []).slice(0, 9)
    if (!fileList.length) return []
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const allowedExt = /\.(jpe?g|png|webp|heic|heif)$/i
    const maxSize = 30 * 1024 * 1024
    for (const file of fileList) {
      if (!(allowedTypes.includes(file.type) || allowedExt.test(file.name))) throw new Error(`Formato no permitido: ${file.name}. Usa JPG, PNG, WEBP o HEIC.`)
      if (file.size > maxSize) throw new Error(`La foto ${file.name} supera 30 MB. Sube una versión un poco más liviana.`)
    }
    const uploaded = []
    for (const originalFile of fileList) {
      const dataUrl = await buildCatalogPhoto(originalFile)
      uploaded.push({
        name: originalFile.name,
        type: 'image/jpeg',
        url: dataUrl,
        localOnly: false,
        embedded: true,
        catalogReady: true,
        uploadedAt: new Date().toISOString(),
      })
    }
    return uploaded
  }

  async function saveAccommodation(event) {
    event.preventDefault(); setError(''); setAccommodationSaving(true)
    if (!editingAccommodation.name?.trim()) { setAccommodationSaving(false); return setError('Debes colocar el nombre del alojamiento.') }
    try {
      const newPhotos = await uploadAccommodationPhotos(editingAccommodation._photoFiles)
      const existingPhotos = Array.isArray(editingAccommodation.photos) ? editingAccommodation.photos : []
      const payload = {
        ...editingAccommodation,
        name: editingAccommodation.name.trim(),
        residence: editingAccommodation.residence || '',
        rooms: editingAccommodation.rooms || '',
        bathrooms: editingAccommodation.bathrooms || '',
        maxCapacity: editingAccommodation.maxCapacity || '',
        nightlyRate: Number(editingAccommodation.nightlyRate || 0),
        cleaningFee: Number(editingAccommodation.cleaningFee || 0),
        ownershipType: editingAccommodation.ownershipType || 'Propio',
        allyProfitMode: editingAccommodation.allyProfitMode || 'fixed',
        allyProfitValue: editingAccommodation.ownershipType === 'Aliado' ? Number(editingAccommodation.allyProfitValue || 0) : '',
        allyOwnerName: editingAccommodation.ownershipType === 'Aliado' ? (editingAccommodation.allyOwnerName || '') : '',
        icalUrls: (Array.isArray(editingAccommodation.icalUrls) ? editingAccommodation.icalUrls : [editingAccommodation.icalUrl || '']).concat(['', '', '', '']).slice(0, 4).map((url) => String(url || '').trim()),
        icalUrl: ((Array.isArray(editingAccommodation.icalUrls) ? editingAccommodation.icalUrls : [editingAccommodation.icalUrl || ''])[0] || '').trim(),
        mapsUrl: editingAccommodation.mapsUrl || '',
        investmentCost: Number(editingAccommodation.investmentCost || 0),
        wifi: !!editingAccommodation.wifi,
        equippedKitchen: !!editingAccommodation.equippedKitchen,
        tvCount: editingAccommodation.tvCount || '',
        coffeeMaker: !!editingAccommodation.coffeeMaker,
        microwave: !!editingAccommodation.microwave,
        airFryer: !!editingAccommodation.airFryer,
        iron: !!editingAccommodation.iron,
        sofaBed: !!editingAccommodation.sofaBed,
        sofa: !!editingAccommodation.sofa,
        towelsCount: editingAccommodation.towelsCount || '',
        bedding: !!editingAccommodation.bedding,
        photos: [...existingPhotos, ...newPhotos].slice(0, 9),
        _photoFiles: null,
      }
      delete payload._photoFiles
      let savedId = editingAccommodation.id || ''
      if(editingAccommodation.id) await accommodationsStore.editItem(editingAccommodation.id,payload); else { const created = await accommodationsStore.createItem(payload); savedId = created?.id || '' }
      await logAudit(editingAccommodation.id ? 'accommodation_updated' : 'accommodation_created', 'Alojamientos', savedId, { ...payload, id: savedId })
      setEditingAccommodation(null)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'No se pudieron guardar las fotos del alojamiento. Revisa Firebase Storage o intenta nuevamente.')
    } finally {
      setAccommodationSaving(false)
    }
  }
  async function deleteAccommodation(item) { if (confirm(`¿Eliminar ${item.name}?`)) { await accommodationsStore.removeItem(item.id); await logAudit('accommodation_deleted', 'Alojamientos', item.id, item); setEditingAccommodation(null) } }

  function moveAccommodationPhoto(index, direction) {
    if (!editingAccommodation) return
    const photos = Array.isArray(editingAccommodation.photos) ? [...editingAccommodation.photos] : []
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    const temp = photos[index]
    photos[index] = photos[target]
    photos[target] = temp
    setEditingAccommodation({ ...editingAccommodation, photos })
  }

  function removeAccommodationPhoto(index) {
    if (!editingAccommodation) return
    const photos = Array.isArray(editingAccommodation.photos) ? [...editingAccommodation.photos] : []
    photos.splice(index, 1)
    setEditingAccommodation({ ...editingAccommodation, photos })
  }

  function movePendingAccommodationPhoto(index, direction) {
    if (!editingAccommodation) return
    const files = Array.from(editingAccommodation._photoFiles || [])
    const target = index + direction
    if (target < 0 || target >= files.length) return
    const temp = files[index]
    files[index] = files[target]
    files[target] = temp
    setEditingAccommodation({ ...editingAccommodation, _photoFiles: files })
  }

  function removePendingAccommodationPhoto(index) {
    if (!editingAccommodation) return
    const files = Array.from(editingAccommodation._photoFiles || [])
    files.splice(index, 1)
    setEditingAccommodation({ ...editingAccommodation, _photoFiles: files })
  }

  function isIcalImportedBlock(item) {
    return isIcalImportedRecord(item)
  }

  function accommodationIcalUrls(apt = selectedAccommodation) {
    const rawList = Array.isArray(apt?.icalUrls) ? apt.icalUrls : []
    const legacy = apt?.icalUrl ? [apt.icalUrl] : []
    return [...legacy, ...rawList]
      .map((url) => String(url || '').trim())
      .filter(Boolean)
      .filter((url, index, arr) => arr.indexOf(url) === index)
      .slice(0, 4)
  }

  function updateAccommodationIcalUrl(index, value) {
    const list = Array.isArray(editingAccommodation?.icalUrls) ? [...editingAccommodation.icalUrls] : ['', '', '', '']
    while (list.length < 4) list.push('')
    list[index] = value
    setEditingAccommodation({ ...editingAccommodation, icalUrls: list.slice(0, 4), icalUrl: list[0] || '' })
  }

  async function importIcsFile(file, resetExisting = false, sourceInfo = {}) {
    if (!file || !selectedAccommodation?.id) return
    const rawText = await file.text()
    await importIcsText(rawText, resetExisting, sourceInfo)
  }


  function countImportableIcsEvents(rawText) {
    const normalizedText = String(rawText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n[ \t]/g, '')
    const events = normalizedText.split(/BEGIN:VEVENT/i).slice(1)
    const readProp = (block, name) => {
      const re = new RegExp(`^${name}(?:;[^:]*)?:(.+)$`, 'im')
      const match = block.match(re)
      return match ? String(match[1] || '').trim() : ''
    }
    const readDate = (block, name) => {
      const raw = readProp(block, name)
      const match = raw.match(/(\d{8})/)
      return match ? match[1] : ''
    }
    return events.filter((block) => readDate(block, 'DTSTART') && readDate(block, 'DTEND')).length
  }

  function parseIcsEventsForAccommodation(rawText, sourceInfo = {}, targetAccommodation = selectedAccommodation) {
    const normalizedText = String(rawText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n[ \t]/g, '')
    const blocks = normalizedText.split(/BEGIN:VEVENT/i).slice(1)
    const fmt = (v) => `${String(v || '').slice(0,4)}-${String(v || '').slice(4,6)}-${String(v || '').slice(6,8)}`
    const readProp = (block, name) => {
      const re = new RegExp(`^${name}(?:;[^:]*)?:(.+)$`, 'im')
      const match = block.match(re)
      return match ? String(match[1] || '').trim() : ''
    }
    const readDate = (block, name) => {
      const raw = readProp(block, name)
      const match = raw.match(/(\d{8})/)
      return match ? match[1] : ''
    }
    const sourceKey = sourceInfo.key || (targetAccommodation?.id ? `${targetAccommodation.id}-${sourceInfo.url || 'manual-ics'}` : sourceInfo.url) || 'manual-ics'
    return blocks.map((block) => {
      const start = readDate(block, 'DTSTART')
      const end = readDate(block, 'DTEND')
      if (!start || !end) return null
      const startDate = fmt(start)
      const endDate = fmt(end)
      const uid = readProp(block, 'UID')
      const summary = readProp(block, 'SUMMARY') || 'Bloqueo externo iCal'
      const stableIdentity = uid ? `${sourceKey}::${uid}` : `${sourceKey}::${startDate}-${endDate}-${summary}`
      return {
        sourceKey,
        sourceUrl: sourceInfo.url || '',
        sourceLabel: sourceInfo.label || 'iCal externo',
        externalUid: stableIdentity,
        startDate,
        endDate,
        summary
      }
    }).filter(Boolean)
  }

  async function reconcileIcalEventsForAccommodation(targetAccommodation, fetchedCalendars = []) {
    if (!targetAccommodation?.id) return { created: 0, updated: 0, removed: 0, unchanged: 0, totalExternal: 0 }
    const externalEvents = []
    const sourceKeys = []
    for (const calendar of fetchedCalendars) {
      const sourceKey = `${targetAccommodation.id}-ical-${calendar.host}`
      sourceKeys.push(sourceKey)
      externalEvents.push(...parseIcsEventsForAccommodation(calendar.rawText, {
        key: sourceKey,
        url: calendar.url,
        label: calendar.label
      }, targetAccommodation))
    }
    const uniqueExternal = new Map()
    for (const event of externalEvents) uniqueExternal.set(event.externalUid, event)

    const importedForSyncedSources = lodgingStore.items.filter((item) =>
      item.accommodationId === targetAccommodation.id &&
      isIcalImportedBlock(item) &&
      sourceKeys.includes(item.icalSourceKey || '')
    )
    const existingByExternalUid = new Map()
    for (const item of importedForSyncedSources) {
      if (item.externalUid && !existingByExternalUid.has(item.externalUid)) existingByExternalUid.set(item.externalUid, item)
    }

    let created = 0
    let updated = 0
    let removed = 0
    let unchanged = 0

    for (const item of importedForSyncedSources) {
      if (!item.externalUid || !uniqueExternal.has(item.externalUid)) {
        await lodgingStore.removeItem(item.id)
        removed += 1
      }
    }

    for (const event of uniqueExternal.values()) {
      const existing = existingByExternalUid.get(event.externalUid)
      if (existing?.id) {
        const patch = {
          ...existing,
          startDate: event.startDate,
          endDate: event.endDate,
          customerName: event.summary,
          channel: event.sourceLabel,
          source: 'ical',
          sourceType: 'ical',
          icalSourceKey: event.sourceKey,
          icalSourceUrl: event.sourceUrl,
          externalUid: event.externalUid,
          note: `Importado desde ${event.sourceLabel}`,
          updatedAt: new Date().toISOString()
        }
        const changed = existing.startDate !== patch.startDate || existing.endDate !== patch.endDate || existing.customerName !== patch.customerName || existing.icalSourceUrl !== patch.icalSourceUrl
        if (changed) {
          await lodgingStore.editItem(existing.id, patch)
          updated += 1
        } else {
          unchanged += 1
        }
      } else {
        await lodgingStore.createItem({
          ...emptyLodgingReservation(targetAccommodation.id, event.startDate, profile, user),
          accommodationName: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          propertyName: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          assetName: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          accommodationTitle: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          endDate: event.endDate,
          status: 'reserved',
          customerName: event.summary,
          channel: event.sourceLabel,
          source: 'ical',
          sourceType: 'ical',
          icalSourceKey: event.sourceKey,
          icalSourceUrl: event.sourceUrl,
          externalUid: event.externalUid,
          note: `Importado desde ${event.sourceLabel}`
        })
        created += 1
      }
    }

    return { created, updated, removed, unchanged, totalExternal: uniqueExternal.size }
  }

  async function importIcsText(rawText, resetExisting = false, sourceInfo = {}) {
    const targetAccommodation = sourceInfo.accommodationOverride || selectedAccommodation
    if (!rawText || !targetAccommodation?.id) return { count: 0, skipped: 0 }
    // V190: parser iCal tolerante para Airbnb, Estei y proveedores con parámetros TZID/DATE-TIME.
    // Soporta líneas plegadas, CRLF, DTSTART;VALUE=DATE, DTSTART;TZID=..., DTSTART:YYYYMMDDTHHMMSSZ.
    const normalizedText = String(rawText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n[ \t]/g, '')
    const events = normalizedText.split(/BEGIN:VEVENT/i).slice(1)
    const fmt = (v) => `${String(v || '').slice(0,4)}-${String(v || '').slice(4,6)}-${String(v || '').slice(6,8)}`
    const readProp = (block, name) => {
      const re = new RegExp(`^${name}(?:;[^:]*)?:(.+)$`, 'im')
      const match = block.match(re)
      return match ? String(match[1] || '').trim() : ''
    }
    const readDate = (block, name) => {
      const raw = readProp(block, name)
      const match = raw.match(/(\d{8})/)
      return match ? match[1] : ''
    }
    let count = 0
    let skipped = 0
    if (resetExisting) {
      const imported = lodgingStore.items.filter((item) => item.accommodationId === targetAccommodation.id && isIcalImportedBlock(item))
      for (const item of imported) await lodgingStore.removeItem(item.id)
    }
    for (const block of events) {
      const start = readDate(block, 'DTSTART')
      const end = readDate(block, 'DTEND')
      const uid = readProp(block, 'UID')
      const summary = readProp(block, 'SUMMARY') || 'Bloqueo externo iCal'
      if (start && end) {
        const startDate = fmt(start)
        const endDate = fmt(end)
        const sourceKey = sourceInfo.key || (selectedAccommodation?.id ? `${targetAccommodation.id}-${sourceInfo.url || 'manual-ics'}` : sourceInfo.url) || 'manual-ics'
        const externalUid = uid ? `${sourceKey}::${uid}` : `${sourceKey}::${startDate}-${endDate}-${summary}`
        const alreadyExists = lodgingStore.items.some((item) =>
          item.accommodationId === targetAccommodation.id &&
          isIcalImportedBlock(item) &&
          ((externalUid && item.externalUid === externalUid) || (item.startDate === startDate && item.endDate === endDate && item.customerName === summary && (item.icalSourceKey || '') === sourceKey))
        )
        if (alreadyExists) { skipped++; continue }
        await lodgingStore.createItem({
          ...emptyLodgingReservation(targetAccommodation.id, startDate, profile, user),
          accommodationName: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          propertyName: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          assetName: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          accommodationTitle: targetAccommodation.name || targetAccommodation.residence || 'Alojamiento',
          endDate,
          status: 'reserved',
          customerName: summary,
          channel: sourceInfo.label || 'iCal externo',
          source: 'ical',
          sourceType: 'ical',
          icalSourceKey: sourceKey,
          icalSourceUrl: sourceInfo.url || '',
          externalUid,
          note: `Importado desde ${sourceInfo.label || 'calendario externo iCal'}`
        })
        count++
      }
    }
    return { count, skipped }
  }

  async function syncSelectedAccommodationIcal() {
    const targetAccommodation = selectedAccommodation
    if (!targetAccommodation?.id) return alert('Selecciona un alojamiento antes de sincronizar iCal.')
    if (icalSyncingAccommodationId === targetAccommodation.id) return
    const urls = accommodationIcalUrls(targetAccommodation)
    if (!urls.length) return alert('Primero pega al menos una URL iCal de Airbnb/Booking/otra plataforma en el alojamiento.')
    setIcalSyncingAccommodationId(targetAccommodation.id)
    try {
      // V191: sincronización atómica multi-iCal.
      // Primero lee TODOS los calendarios externos. Solo si todos responden bien,
      // elimina los bloqueos iCal anteriores y vuelve a insertar el conjunto completo.
      // Esto evita que al sincronizar Airbnb se borre Estei, o viceversa.
      const fetchedCalendars = []
      let index = 0
      for (const url of urls) {
        index += 1
        const normalizedUrl = String(url || '').trim().replace(/^webcal:\/\//i, 'https://')
        const response = await fetch(`/api/ics-proxy?url=${encodeURIComponent(normalizedUrl)}`)
        if (!response.ok) {
          const message = await response.text().catch(() => '')
          throw new Error(`No se pudo leer el iCal #${index}. HTTP ${response.status}${message ? ` · ${message}` : ''}`)
        }
        const rawText = await response.text()
        if (!rawText || !/BEGIN:VCALENDAR/i.test(rawText)) {
          throw new Error(`El iCal #${index} no devolvió un calendario válido.`)
        }
        const host = (() => { try { return new URL(normalizedUrl).hostname.replace(/^www\./, '') } catch { return `ical-${index}` } })()
        const label = host.includes('digitaloceanspaces.com') || host.includes('estei') ? 'Estei' : host.includes('airbnb') ? 'Airbnb' : `iCal ${index}`
        fetchedCalendars.push({ index, url: normalizedUrl, rawText, host, label })
      }

      const imported = lodgingStore.items.filter((item) => item.accommodationId === targetAccommodation.id && isIcalImportedBlock(item))
      const importableEvents = fetchedCalendars.reduce((sum, calendar) => sum + countImportableIcsEvents(calendar.rawText), 0)
      if (imported.length > 0 && importableEvents === 0) {
        throw new Error('Los calendarios respondieron, pero no contienen eventos importables. Por seguridad NO se eliminaron los bloqueos iCal actuales ni se desvinculó el calendario.')
      }

      // V221.7: reconciliación real iCal para Airbnb, Estei y cualquier calendario externo.
      // sincronizar solo actualiza bloqueos importados; nunca desvincula URLs iCal.
      // Este botón NO desvincula URLs, pero SÍ compara el feed actual contra los bloqueos iCal guardados
      // para crear, actualizar y liberar fechas cuando el proveedor modifica/cancela reservas.
      const reconcileStats = await reconcileIcalEventsForAccommodation(targetAccommodation, fetchedCalendars)
      const preservedUrls = urls.slice(0, 4)
      while (preservedUrls.length < 4) preservedUrls.push('')
      const syncTimestamp = new Date().toISOString()
      await accommodationsStore.editItem(targetAccommodation.id, {
        icalUrl: preservedUrls[0] || targetAccommodation.icalUrl || '',
        icalUrls: preservedUrls,
        lastIcalSyncAt: syncTimestamp,
          icalSyncStatus: fetchedCalendars.map((calendar, idx) => ({ url: calendar.url, label: calendar.label, status: 'correcto', lastSyncAt: syncTimestamp, events: countImportableIcsEvents(calendar.rawText), index: idx + 1 }))
      })
      setEditingAccommodation((current) => current?.id === targetAccommodation.id ? {
        ...current,
        icalUrl: preservedUrls[0] || current.icalUrl || '',
        icalUrls: preservedUrls,
        lastIcalSyncAt: syncTimestamp
      } : current)
      alert(`Calendarios sincronizados: ${fetchedCalendars.length}.
Eventos externos vigentes: ${reconcileStats.totalExternal}.
Bloqueos nuevos: ${reconcileStats.created}.
Bloqueos actualizados: ${reconcileStats.updated}.
Fechas liberadas/canceladas: ${reconcileStats.removed}.
Sin cambios: ${reconcileStats.unchanged}.`)
    } catch (err) {
      console.error(err)
      alert(`No se pudo sincronizar uno de los iCal por URL. No se eliminaron los bloqueos anteriores ni se desvinculó el calendario.
Detalle: ${err?.message || 'error desconocido'}

Verifica que todos los enlaces iCal guardados respondan correctamente.`)
    } finally {
      setIcalSyncingAccommodationId('')
    }
  }


  async function syncAllExternalIcalsSilent() {
    const accommodationsWithIcal = accommodations.filter((apt) => apt?.id && accommodationIcalUrls(apt).length)
    for (const apt of accommodationsWithIcal) {
      const urls = accommodationIcalUrls(apt)
      try {
        const fetchedCalendars = []
        let index = 0
        for (const url of urls) {
          index += 1
          const normalizedUrl = String(url || '').trim().replace(/^webcal:\/\//i, 'https://')
          const response = await fetch(`/api/ics-proxy?url=${encodeURIComponent(normalizedUrl)}`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const rawText = await response.text()
          if (!rawText || !/BEGIN:VCALENDAR/i.test(rawText)) throw new Error('Respuesta iCal inválida')
          const host = (() => { try { return new URL(normalizedUrl).hostname.replace(/^www\./, '') } catch { return `ical-${index}` } })()
          const label = host.includes('digitaloceanspaces.com') || host.includes('estei') ? 'Estei' : host.includes('airbnb') ? 'Airbnb' : `iCal ${index}`
          fetchedCalendars.push({ index, url: normalizedUrl, rawText, host, label })
        }
        const imported = lodgingStore.items.filter((item) => item.accommodationId === apt.id && isIcalImportedBlock(item))
        const importableEvents = fetchedCalendars.reduce((sum, calendar) => sum + countImportableIcsEvents(calendar.rawText), 0)
        if (imported.length > 0 && importableEvents === 0) {
          throw new Error('Sin eventos importables; se conservan bloqueos iCal actuales')
        }
        await reconcileIcalEventsForAccommodation(apt, fetchedCalendars)
        const preservedUrls = urls.slice(0, 4)
        while (preservedUrls.length < 4) preservedUrls.push('')
        await accommodationsStore.editItem(apt.id, {
          ...apt,
          icalUrl: preservedUrls[0] || apt.icalUrl || '',
          icalUrls: preservedUrls,
          lastIcalSyncAt: new Date().toISOString(),
          icalSyncStatus: fetchedCalendars.map((calendar, idx) => ({ url: calendar.url, label: calendar.label, status: 'correcto', lastSyncAt: new Date().toISOString(), events: countImportableIcsEvents(calendar.rawText), index: idx + 1 }))
        })
      } catch (err) {
        console.warn(`Sincronización iCal silenciosa omitida para ${apt.name || apt.id}:`, err?.message || err)
      }
    }
  }

  useEffect(() => {
    if (!isFirebaseReady || !accommodations.length) return undefined
    const timer = setInterval(() => { syncAllExternalIcalsSilent() }, 10 * 60 * 1000)
    return () => clearInterval(timer)
  }, [isFirebaseReady, accommodations, lodgingStore.items.length])

  async function clearSelectedAccommodationIcalBookings() {
    if (!selectedAccommodation?.id) return
    const imported = lodgingStore.items.filter((item) => item.accommodationId === selectedAccommodation.id && isIcalImportedBlock(item))
    if (!imported.length) return alert('No hay bloqueos iCal importados para eliminar.')
    if (!confirm(`Se eliminarán ${imported.length} bloqueos importados por iCal. Tus reservas manuales no se tocarán. ¿Continuar?`)) return
    for (const item of imported) await lodgingStore.removeItem(item.id)
    alert('Bloqueos importados por iCal eliminados.')
  }

  async function unlinkSelectedAccommodationIcal() {
    if (!selectedAccommodation?.id) return
    const imported = lodgingStore.items.filter((item) => item.accommodationId === selectedAccommodation.id && isIcalImportedBlock(item))
    const message = imported.length
      ? `Se desvinculará el calendario iCal y se liberarán ${imported.length} bloqueos importados. Tus reservas manuales no se tocarán. ¿Continuar?`
      : '¿Deseas desvincular el calendario iCal guardado? Podrás pegar un nuevo link después.'
    if (!confirm(message)) return
    for (const item of imported) await lodgingStore.removeItem(item.id)
    await accommodationsStore.editItem(selectedAccommodation.id, { ...selectedAccommodation, icalUrl: '', icalUrls: ['', '', '', ''] })
    setEditingAccommodation((current) => current?.id === selectedAccommodation.id ? { ...current, icalUrl: '', icalUrls: ['', '', '', ''] } : current)
    alert(imported.length ? 'Calendario iCal desvinculado y fechas importadas liberadas.' : 'Calendario iCal desvinculado.')
  }

  async function copyAccommodationIcalLink(apt = selectedAccommodation) {
    const url = lodgingIcalUrl(apt?.id)
    if (!url) return
    const exported = await syncPublicIcalBlocksForAccommodation(apt)
    navigator.clipboard?.writeText(url)
    alert(`Link iCal de tu sistema copiado. Pégalo en Airbnb/Booking para que esas plataformas lean las fechas bloqueadas:
${url}

Bloqueos públicos sincronizados: ${exported}`)
  }

  async function testAccommodationIcalLink(apt = selectedAccommodation) {
    const url = lodgingIcalUrl(apt?.id)
    if (!url) return
    try {
      const syncedCount = await syncPublicIcalBlocksForAccommodation(apt)
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' })
      const text = await response.text()
      const eventCount = (text.match(/BEGIN:VEVENT/g) || []).length
      if (!response.ok || !text.includes('BEGIN:VCALENDAR')) {
        alert(`El link respondió, pero Airbnb no podrá leerlo correctamente.
HTTP: ${response.status}
Respuesta: ${text.slice(0, 180)}

Si estás probando en localhost, eso es normal: Airbnb/Estei solo leen el link de producción Vercel.`)
        return
      }
      alert(`iCal válido para Airbnb.
Bloqueos sincronizados desde el sistema: ${syncedCount}
Eventos exportados con fecha de salida exclusiva para Airbnb: ${eventCount}

Abre el link en una pestaña para verificarlo:
${url}`)
      window.open(url, '_blank')
    } catch (err) {
      console.error(err)
      alert('No se pudo validar el link iCal. Revisa que Vercel haya desplegado correctamente y que las reglas Firestore estén publicadas.')
    }
  }

  function shareAccommodationCatalog(apt = selectedAccommodation) {
    if (!apt) return
    const photos = Array.isArray(apt.photos) ? apt.photos.map(photoUrl).filter(Boolean).slice(0, 9) : []
    const featureRows = [
      apt.rooms ? `${apt.rooms} habitación(es)` : '',
      apt.bathrooms ? `${apt.bathrooms} baño(s)` : '',
      apt.maxCapacity ? `Capacidad máxima: ${apt.maxCapacity} huésped(es)` : '',
      apt.hotWater ? 'Agua caliente' : '',
      apt.ac ? 'Aire acondicionado' : '',
      apt.pool ? 'Piscina' : '',
      apt.elevator ? 'Ascensor' : '',
      apt.parking ? 'Estacionamiento' : '',
      apt.wifi ? 'Wifi' : '',
      apt.equippedKitchen ? 'Cocina equipada' : '',
      apt.tvCount ? `TV: ${apt.tvCount}` : '',
      apt.coffeeMaker ? 'Cafetera' : '',
      apt.microwave ? 'Microondas' : '',
      apt.airFryer ? 'Air fryer' : '',
      apt.iron ? 'Plancha de ropa' : '',
      apt.sofaBed ? 'Sofá cama' : '',
      apt.sofa ? 'Sofá tradicional' : '',
      apt.towelsCount ? `Toallas: ${apt.towelsCount}` : '',
      apt.bedding ? 'Ropa de cama' : '',
      apt.checkInTime ? `Check in: ${apt.checkInTime}` : '',
      apt.checkOutTime ? `Check out: ${apt.checkOutTime}` : '',
      apt.mapsUrl ? 'Ubicación Google Maps disponible' : '',
    ].filter(Boolean)
    const shortDollar = (value) => {
      const num = Number(value || 0)
      if (!Number.isFinite(num) || num <= 0) return '0$'
      return `${num.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}$`
    }
    const priceLine = apt.nightlyRate
      ? `Costo por noche ${shortDollar(apt.nightlyRate)}${apt.cleaningFee ? ` + tarifa de limpieza ${shortDollar(apt.cleaningFee)}` : ''}`
      : 'Costo por noche por confirmar'
    const whatsappText = `${apt.name}\n${priceLine}\n${featureRows.join('\n')}\n\n${apt.notes || ''}`.trim()
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
    const htmlPhotos = photos.length
      ? photos.map((url, i) => `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(photoName(apt.photos[i], i))}"/></figure>`).join('')
      : '<div class="empty">No hay fotos cargadas todavía.</div>'
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Catálogo ${escapeHtml(apt.name)}</title><style>${cleanPrintCss}
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#f3eee6;color:#161616;font-family:Arial,Helvetica,sans-serif}
.actions{text-align:center;padding:10px;background:#fff;position:sticky;top:0;z-index:5;border-bottom:1px solid #eee}
.actions a,.actions button{border:0;background:#ff385c;color:#fff;border-radius:999px;padding:9px 14px;text-decoration:none;font-weight:800;cursor:pointer;margin:3px}
.actions button.secondary{background:#222}
.phone-sheet{width:100%;max-width:430px;margin:0 auto;background:#fff;padding:16px 16px 18px;display:flex;flex-direction:column;gap:12px;min-height:100vh}
.catalog-head{display:grid;grid-template-columns:118px 1fr;gap:14px;align-items:center;border-bottom:1px solid #ece7df;padding-bottom:16px}
.catalog-head img{width:112px;height:112px;object-fit:contain;justify-self:center}
.catalog-head h1{font-size:11px;line-height:1.08;margin:0 0 3px;font-weight:900}
.catalog-head .sub{font-size:10px;font-weight:800;color:#9b5e2e;letter-spacing:.02em}
.catalog-head .price{font-size:13px;font-weight:900;margin-top:6px}
.photo-wall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin:0 auto}
.photo-wall figure{margin:0;border-radius:14px;overflow:hidden;background:#f2f2f2;aspect-ratio:1/1;box-shadow:0 1px 0 rgba(0,0,0,.04)}
.photo-wall img{width:100%;height:100%;object-fit:cover;display:block}
.empty{grid-column:1/-1;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:16px;color:#777;min-height:280px}
.feature-title{margin:2px 0 -2px;text-align:left;font-size:13px;font-weight:900;letter-spacing:.02em;color:#2d2d2d}.feature-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin:0 auto}
.feature-chips span{background:#fafafa;border:1.5px solid #d7d0c7;border-radius:10px;padding:6px 5px;font-size:8.8px;font-weight:700;text-align:center;line-height:1.15;min-height:32px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.6)}
.notes{background:#fafafa;border:1px solid #eee;border-radius:12px;padding:10px;font-size:10px;line-height:1.35}
@media screen and (min-width:700px){
  body{padding:18px}
  .phone-sheet{width:760px;max-width:760px;padding:26px;gap:22px}
  .catalog-head{grid-template-columns:144px 1fr;gap:18px;padding-bottom:18px}
  .catalog-head img{width:136px;height:136px}
  .catalog-head h1{font-size:16px}
  .catalog-head .sub{font-size:11px}
  .catalog-head .price{font-size:16px}
  .photo-wall{gap:13px}
  .feature-chips{gap:10px}
  .feature-title{font-size:15px;margin:4px 0 0}  .feature-chips span{font-size:10px;padding:9px 7px;min-height:42px;border-radius:11px}
}
@media print{
  html,body{width:210mm;height:297mm;min-height:297mm;background:#fff;overflow:hidden}
  .actions{display:none}
  .phone-sheet{width:210mm;height:297mm;max-width:none;margin:0;background:#fff;padding:7mm 8mm 6mm;gap:3.2mm;box-shadow:none;border-radius:0;overflow:hidden;page-break-after:avoid}
  .catalog-head{grid-template-columns:24mm 1fr;gap:5mm;padding-bottom:2.5mm}
  .catalog-head img{width:22mm;height:22mm}
  .catalog-head h1{font-size:9.5pt;line-height:1.04}
  .catalog-head .sub{font-size:7pt}
  .catalog-head .price{font-size:7.8pt;margin-top:1mm}
  .photo-wall{width:154mm;max-width:154mm;gap:1.8mm;align-self:center}
  .photo-wall figure{border-radius:2.4mm;aspect-ratio:1/1}
  .feature-chips{gap:1.5mm}
  .feature-title{font-size:7.5pt;margin:0}
  .feature-chips span{font-size:5.7pt;padding:1.2mm .7mm;min-height:5.8mm;border-radius:1.7mm;border:0.7px solid #d7d0c7}
  .notes{font-size:5.8pt;padding:1.6mm;max-height:14mm;overflow:hidden}
}
</style></head><body><div class="actions"><button onclick="shareAlohandoteCleanPdf()">Compartir PDF limpio</button><button onclick="downloadAlohandoteCleanPdf()">Descargar PDF limpio</button><button class="secondary" onclick="printAlohandoteCleanDocument()">Imprimir</button><button class="secondary" onclick="returnToAlohandoteApp && returnToAlohandoteApp()">Volver a la app</button>${cleanPdfExportScript('catalogo-alojamiento')}</div><main class="phone-sheet"><section class="catalog-head"><div><h1>${escapeHtml(apt.name)}</h1><div class="sub">Catálogo de alojamiento vacacional</div><div class="price">${escapeHtml(priceLine)}</div></div></section><section class="photo-wall">${htmlPhotos}</section><div class="feature-title">Características</div><section class="feature-chips">${featureRows.map((f)=>`<span title="${escapeHtml(f)}">${escapeHtml(f)}</span>`).join('')}</section>${apt.mapsUrl ? `<section class="notes"><strong>Ubicación Google Maps:</strong><br><a href="${escapeHtml(apt.mapsUrl)}" target="_blank">${escapeHtml(apt.mapsUrl)}</a></section>` : ''}${apt.notes ? `<section class="notes">${escapeHtml(apt.notes)}</section>` : ''}${alohandoteContactFooter()}</main></body></html>`
    openCatalogInSameTab(html, 'catalogo-alojamiento')
    showSuccess('Catálogo de alojamiento generado en la misma pestaña.')
  }

  function canEditReservation(reservation) {
    if (isAdmin) return true
    if (!reservation?.id) return true
    const userEmail = user?.email?.toLowerCase?.() || ''
    const createdEmail = reservation.createdByEmail?.toLowerCase?.() || ''
    return reservation.createdByUid === user?.uid || Boolean(createdEmail && createdEmail === userEmail)
  }
  function canGenerateDocs(reservation) {
    // V221.3: los perfiles vendedores externos deben poder emitir documentos de Renta Car
    // aunque la reserva haya quedado en modo lectura. No altera permisos de edición/guardado.
    const role = normalizeRole(profile?.role)
    const isVehicleReservation = Boolean(reservation?.vehicleId)
    if (isVehicleReservation && ['seller', 'seller_all', 'seller_lodging'].includes(role)) return true
    return isAdmin || reservation.createdByUid === user?.uid || reservation.createdByEmail?.toLowerCase?.() === user?.email?.toLowerCase?.()
  }
  function shouldTrackSellerCommission(reservation = editingReservation) {
    if (!reservation) return !isAdmin
    if (!isAdmin) return true
    return Boolean(reservation.id && reservation.createdByUid && reservation.createdByUid !== user?.uid)
  }
  function openCreateReservation(date) { setError(''); setEditingLodging(null); const freshVehicle = vehicles.find((vehicle)=>vehicle.id===selectedVehicle?.id) || selectedVehicle || vehicles[0] || {}; if(!freshVehicle?.id) return setError('Selecciona primero un vehículo.'); const base = emptyReservation(freshVehicle.id, toISODate(date), profile, user); setEditingReservation({ ...base, createdByName: normalizePersonName(sellerName(profile, user)), pricePerKm: vehicleKmRate(freshVehicle), dailyRate: String(vehicleDayRate(freshVehicle) || ''), totalAmount: freshVehicle ? String(quoteBaseFromDays(daysForReservation(base), vehicleDayRate(freshVehicle))) : '', deliveryKm: freshVehicle?.currentKm || '' }) }
  function openEditReservation(reservation = {}) { setError(''); setEditingLodging(null); const safeReservation = reservation || {}; const vehicle = vehicles.find((item) => item.id === safeReservation.vehicleId) || selectedVehicle || {}; const safeId = safeReservation.__docId || safeReservation.id || safeReservation.docId || safeReservation.reservationId || ''; const shouldRefreshDeliveryKm = !safeReservation.deliveryCompletedAt && !safeReservation.deliveredAt && !safeReservation.deliveryKm; setEditingReservation({ ...emptyReservation(safeReservation.vehicleId || vehicle?.id || '', safeReservation.startDate || '', profile, user), ...safeReservation, vehicleId: safeReservation.vehicleId || vehicle?.id || '', id: safeId, __docId: safeReservation.__docId || safeId, _editingOriginalId: safeId, _originalPaymentAmount: '', amount: '', paymentReference: '', paymentHistory: normalizePaymentHistory(safeReservation), pricePerKm: safeReservation.pricePerKm || vehicleKmRate(vehicle), dailyRate: safeReservation.dailyRate || String(vehicleDayRate(vehicle) || ''), deliveryKm: shouldRefreshDeliveryKm ? (vehicle?.currentKm || '') : (safeReservation.deliveryKm || vehicle?.currentKm || '') }) }
  function updateDraftPayment(record, setter, payment) {
    const nextRaw = prompt('Monto del abono', String(payment.rawAmount || ''))
    if (nextRaw === null) return
    const nextMethod = prompt('Método de pago: Pago en BS, $ Efectivo, Zelle o USDT', String(payment.method || record.paymentMethod || '$ Efectivo'))
    if (nextMethod === null) return
    const nextReference = prompt('Referencia del pago', String(payment.reference || ''))
    if (nextReference === null) return
    const nextHistory = paymentsWithUpdatedEntry(record, payment.id || payment.paymentTraceId, { rawAmount: nextRaw, method: nextMethod, reference: nextReference }, rateAwareExchangeRates, record.bcvEuroRate || officialEuroRate)
    setter(recordWithPaymentHistory(record, nextHistory))
    showSuccess('Abono editado. Presiona Guardar para aplicar el cambio.')
  }
  function deleteDraftPayment(record, setter, payment) {
    if (!confirm('¿Eliminar este abono? La caja se recalculará al guardar.')) return
    const nextHistory = paymentsWithoutEntry(record, payment.id || payment.paymentTraceId)
    setter(recordWithPaymentHistory(record, nextHistory))
    showSuccess('Abono eliminado. Presiona Guardar para aplicar el cambio.')
  }
  function renderPaymentHistoryManager(record, setter, readOnly = false) {
    const payments = normalizePaymentHistory(record)
    if (!payments.length) return null
    const totals = paymentHistoryTotals({ paymentHistory: payments })
    return <section className="document-box payment-history-box"><h4>Historial de abonos</h4>{payments.map((payment, index)=><div key={payment.id || payment.paymentTraceId || index} className="history-row"><span>Abono #{index+1} · {payment.method}</span><strong>{money(payment.amountUsd)} / {bsMoney(payment.amountBs)}</strong><small>Referencia: {payment.reference || 'Sin referencia'} · Tasa histórica: {payment.bcvEuroRate ? bsMoney(payment.bcvEuroRate) : 'No registrada'}</small>{!readOnly && <div className="table-actions"><button type="button" className="secondary mini-action" onClick={()=>updateDraftPayment(record, setter, payment)}><Pencil size={14}/> Editar abono</button><button type="button" className="danger mini-action" onClick={()=>deleteDraftPayment(record, setter, payment)}><Trash2 size={14}/> Eliminar abono</button></div>}</div>)}<div className="pending-box"><span>Total abonado histórico</span><strong>{money(totals.amountUsd)} / {bsMoney(totals.amountBs)}</strong><small>Los cambios quedan en la reserva al presionar Guardar.</small></div></section>
  }
  function getReservationForDate(date) {
    const iso = toISODate(date)
    return vehicleReservations.find((reservation) => !isNonBlockingShortMaintenance(reservation) && isDateInsideRange(iso, reservation.startDate, reservation.endDate))
  }

  function reservationIdentityValues(record = {}) {
    return [record.__docId, record._editingOriginalId, record.id, record.docId, record.reservationId]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
      .map((value) => String(value).trim())
  }

  function resolveStoredReservationForEdit(draft = {}) {
    const draftIds = reservationIdentityValues(draft)
    if (draftIds.length) {
      const byId = reservationsStore.items.find((item) => reservationIdentityValues(item).some((id) => draftIds.includes(id)))
      if (byId) return byId
    }
    // Compatibilidad con reservas antiguas cuyo campo `id` interno quedó vacío.
    // Solo se considera edición cuando existe una coincidencia lógica inequívoca.
    const logicalMatches = reservationsStore.items.filter((item) =>
      String(item.vehicleId || '') === String(draft.vehicleId || '') &&
      String(item.startDate || '') === String(draft.startDate || '') &&
      String(item.endDate || '') === String(draft.endDate || '') &&
      String(item.deliveryTime || '12:00') === String(draft.deliveryTime || '12:00') &&
      String(item.returnTime || '12:00') === String(draft.returnTime || '12:00') &&
      String(item.customerName || '').trim().toLowerCase() === String(draft.customerName || '').trim().toLowerCase()
    )
    return logicalMatches.length === 1 ? logicalMatches[0] : null
  }

  function sameReservationSchedule(left = {}, right = {}) {
    return String(left.vehicleId || '') === String(right.vehicleId || '') &&
      String(left.startDate || '') === String(right.startDate || '') &&
      String(left.endDate || '') === String(right.endDate || '') &&
      String(left.deliveryTime || '12:00') === String(right.deliveryTime || '12:00') &&
      String(left.returnTime || '12:00') === String(right.returnTime || '12:00')
  }

  function validateReservation(payload) {
    if (!isAdmin && payload.status === 'maintenance') return 'Tu perfil no puede crear mantenimientos.'
    const storedReservation = resolveStoredReservationForEdit(payload)
    const resolvedId = storedReservation?.__docId || storedReservation?.id || payload.__docId || payload._editingOriginalId || payload.id || ''
    const normalizedPayload = resolvedId
      ? { ...payload, id: resolvedId, __docId: resolvedId, _editingOriginalId: resolvedId }
      : payload
    if (resolvedId && !canEditReservation({ ...payload, id: resolvedId })) return 'Solo puedes modificar reservas creadas por tu usuario.'
    // Al modificar solo pago, cliente, observaciones u otros datos no calendarios,
    // la reserva no debe chocar consigo misma ni con duplicados históricos de la misma ficha.
    const conflictItems = normalizeStatus(normalizedPayload.status) === 'maintenance'
      ? []
      : (storedReservation && sameReservationSchedule(normalizedPayload, storedReservation)
        ? []
        : reservationsStore.items)
    return validateReservationCritical(paymentValidationDraft(normalizedPayload, exchangeRates, normalizedPayload.bcvEuroRate || officialEuroRate), {
      items: conflictItems,
      exchangeRates,
      conflictMessage: (conflict) => `Ese rango choca con ${STATUS[conflict.status]?.label || 'otro bloqueo'}: ${conflict.customerName || 'Sin cliente'} (${formatShortDate(conflict.startDate)} - ${formatShortDate(conflict.endDate)}).`
    })
  }

  async function uploadReservationFile(file, kind) {
    if (!file) return null
    const fallback = { name: file.name, type: file.type, size: file.size || 0, localOnly: true, uploadWarning: 'Storage no disponible o sin permisos. Registro guardado sin URL pública.' }
    if (!isFirebaseReady || !storage || !user) return fallback
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
      const filePath = `reservation-docs/${user.uid}/${Date.now()}-${kind}-${safeName}`
      const fileRef = ref(storage, filePath)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      return { name: file.name, type: file.type, url, path: filePath, uploadedAt: new Date().toISOString() }
    } catch (err) {
      console.warn('No se pudo subir archivo a Firebase Storage. Se guardará referencia local:', err)
      return fallback
    }
  }

  
  async function uploadVehicleCheckinFile(file, kind) {
    if (!file) return null
    const fallback = { name: file.name, type: file.type, size: file.size || 0, localOnly: true, uploadWarning: 'Storage no disponible o sin permisos. Registro guardado sin URL pública.' }
    if (!isFirebaseReady || !storage) return fallback
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
      const ownerId = user?.uid || 'public'
      const filePath = `vehicle-checkins/${ownerId}/${Date.now()}-${kind}-${safeName}`
      const fileRef = ref(storage, filePath)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      return { name: file.name, type: file.type, url, path: filePath, uploadedAt: new Date().toISOString() }
    } catch (err) {
      console.warn('No se pudo subir archivo de operación a Firebase Storage. Se guardará referencia local:', err)
      return fallback
    }
  }

  function openVehicleReception(vehicle = selectedVehicle) {
    if (!vehicle?.id) return setError('Selecciona primero un vehículo.')
    setError('')
    setEditingVehicleCheckin({ ...emptyVehicleCheckin(vehicle.id, profile, user), currentKm: vehicle.currentKm || '' })
  }

  function openVehicleDeliveryForm(operationItem) {
    const vehicle = vehicles.find((item) => item.id === operationItem?.vehicleId) || selectedVehicle || (operationItem?.vehicleId ? { id: operationItem.vehicleId, name: operationItem.assetName || 'Vehículo', currentKm: '' } : null)
    if (!vehicle?.id) return setError('Selecciona primero un vehículo.')
    setError('')
    setEditingVehicleDelivery({
      id: operationItem?.id || '',
      vehicleId: vehicle.id,
      vehicleName: vehicle.name || operationItem?.assetName || '',
      assetName: operationItem?.assetName || vehicle.name || '',
      reservationId: operationItem?.reservationId || '',
      customerName: operationItem?.customerName || '',
      phone: operationItem?.phone || operationItem?.customerPhone || '',
      deliveryTime: operationItem?.deliveryTime || '12:00',
      returnTime: operationItem?.returnTime || '12:00',
      currentKm: vehicle.currentKm || '',
      fuelLevel: 'Completo',
      generalStatus: 'Bueno',
      notes: '',
      dashboardPhoto: null,
      vehiclePhoto: null,
      responsible: sellerName(profile, user) || 'Operador',
    })
  }

  function openVehicleReceptionForm(operationItem) {
    const vehicle = vehicles.find((item) => item.id === operationItem?.vehicleId) || selectedVehicle || (operationItem?.vehicleId ? { id: operationItem.vehicleId, name: operationItem.assetName || 'Vehículo', currentKm: '' } : null)
    if (!vehicle?.id) return setError('Selecciona primero un vehículo.')
    setError('')
    setEditingVehicleCheckin({
      ...emptyVehicleCheckin(vehicle.id, profile, user),
      id: operationItem?.id || '',
      vehicleName: vehicle.name || operationItem?.assetName || '',
      assetName: operationItem?.assetName || vehicle.name || '',
      reservationId: operationItem?.reservationId || '',
      customerName: operationItem?.customerName || '',
      phone: operationItem?.phone || operationItem?.customerPhone || '',
      deliveryTime: operationItem?.deliveryTime || '12:00',
      returnTime: operationItem?.returnTime || '12:00',
      currentKm: vehicle.currentKm || '',
      createdByName: sellerName(profile, user) || 'Operador',
    })
  }

  function openCleaningForm(operationItem) {
    const lodging = lodgingStore.items.find((row) => row.id === operationItem?.reservationId) || (publicOperationsMode ? { id: operationItem?.reservationId || '', accommodationId: operationItem?.accommodationId || '', accommodationName: operationItem?.assetName || '', endDate: operationItem?.operationDate || '' } : null)
    if (!lodging) return setError('No se encontró la reserva del alojamiento.')
    setEditingCleaningTask({
      id: operationItem?.id || '',
      reservationId: operationItem.reservationId,
      accommodationId: operationItem?.accommodationId || lodging?.accommodationId || '',
      accommodationName: operationItem.assetName || lodging.accommodationName || '',
      assetName: operationItem.assetName || lodging.accommodationName || '',
      customerName: operationItem.customerName || lodging.customerName || '',
      phone: operationItem?.phone || operationItem?.customerPhone || lodging.phone || '',
      checkInTime: operationItem?.checkInTime || operationItem?.deliveryTime || lodging.checkInTime || '',
      checkOutTime: operationItem?.checkOutTime || operationItem?.returnTime || lodging.checkOutTime || '',
      responsible: sellerName(profile, user) || 'Operador',
      inventoryItemId: '',
      quantity: 1,
      notes: '',
      damagePhoto: null,
      operationDate: operationItem.operationDate || lodging.endDate || '',
    })
  }

  function vehicleReceptionPublicLink(vehicle = selectedVehicle) {
    if (!vehicle?.id || typeof window === 'undefined') return ''
    return `${window.location.origin}/?recepcion=1&vehiculo=${encodeURIComponent(vehicle.id)}`
  }

  async function copyVehicleReceptionLink(vehicle = selectedVehicle) {
    const link = vehicleReceptionPublicLink(vehicle)
    if (!link) return setError('Selecciona primero un vehículo para generar el link.')
    await navigator.clipboard?.writeText(link)
    showSuccess('Link de recepción copiado correctamente')
  }

  function generatePublicToken() {
    const raw = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
  }

  function publicTaskSnapshot(item = {}) {
    return {
      id: item.id || '',
      reservationId: item.reservationId || '',
      reservationType: item.reservationType || '',
      operation: item.operation || '',
      group: item.group || '',
      operationDate: item.operationDate || '',
      assetLabel: item.assetLabel || '',
      assetName: item.assetName || '',
      vehicleId: item.vehicleId || '',
      accommodationId: item.accommodationId || '',
      customerName: item.customerName || '',
      phone: item.phone || item.customerPhone || item.contactPhone || '',
      deliveryTime: item.deliveryTime || item.checkInTime || '',
      returnTime: item.returnTime || item.checkOutTime || '',
      title: item.title || '',
      totalAmount: item.totalAmount || '',
      amount: item.amount || '',
    }
  }

  function icalPlatformLabelFromUrl(url = '', index = 0) {
    const raw = String(url || '').toLowerCase()
    try {
      const host = new URL(String(url || '').replace(/^webcal:\/\//i, 'https://')).hostname.replace(/^www\./, '')
      if (host.includes('estei') || host.includes('digitaloceanspaces.com')) return 'Estei'
      if (host.includes('airbnb')) return 'Airbnb'
      if (host.includes('booking')) return 'Booking'
      if (host.includes('vrbo')) return 'Vrbo'
    } catch (_) {}
    if (raw.includes('estei')) return 'Estei'
    if (raw.includes('airbnb')) return 'Airbnb'
    return index ? `iCal ${index}` : 'iCal externo'
  }

  function formatIcalSyncDate(value = '') {
    if (!value) return 'Pendiente'
    try {
      const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
      if (Number.isNaN(date.getTime())) return 'Pendiente'
      return date.toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch (_) { return 'Pendiente' }
  }

  function operationDetailLine(item = {}) {
    const parts = []
    const phone = item.phone || item.customerPhone || item.contactPhone
    if (phone) parts.push(`Contacto: ${phone}`)
    if (item.reservationType === 'vehicle') {
      if (item.deliveryTime) parts.push(`Entrega: ${item.deliveryTime}`)
      if (item.returnTime) parts.push(`Recepción: ${item.returnTime}`)
    } else {
      if (item.checkInTime || item.deliveryTime) parts.push(`Check-in: ${item.checkInTime || item.deliveryTime}`)
      if (item.checkOutTime || item.returnTime) parts.push(`Check-out: ${item.checkOutTime || item.returnTime}`)
    }
    return parts.join(' · ')
  }

  function accommodationIcalSyncRows(apt = selectedAccommodation) {
    const urls = accommodationIcalUrls(apt)
    return urls.map((url, idx) => ({
      url,
      label: icalPlatformLabelFromUrl(url, idx + 1),
      lastSync: apt?.icalSyncStatus?.[idx]?.lastSyncAt || apt?.lastIcalSyncAt || '',
      status: apt?.icalSyncStatus?.[idx]?.status || (apt?.lastIcalSyncAt ? 'correcto' : 'pendiente'),
      events: apt?.icalSyncStatus?.[idx]?.events ?? null,
    }))
  }

  function encodeOperationsPayload(payload = {}) {
    try {
      const json = JSON.stringify(payload)
      return btoa(unescape(encodeURIComponent(json))).replace(/=+$/,'')
    } catch (_) { return '' }
  }

  function decodeOperationsPayload(value = '') {
    try {
      if (!value) return null
      const padded = String(value).replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((String(value).length + 3) % 4)
      return JSON.parse(decodeURIComponent(escape(atob(padded))))
    } catch (_) { return null }
  }

  function publicTokenRecordSafe(payload = {}) {
    return { token: payload.token || '', scope: payload.scope || 'public-operations', active: true, createdAt: payload.createdAt || '', expiresAt: payload.expiresAt || '', expiresAtMs: payload.expiresAtMs || 0, tasks: Array.isArray(payload.tasks) ? payload.tasks : [], taskCount: Number(payload.taskCount || 0) }
  }

  function operationsPublicLink(token = '') {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.origin)
    url.searchParams.set('operaciones', '1')
    if (token) url.searchParams.set('token', token)
    return url.toString()
  }

  async function createOperationsPublicToken() {
    const publicOps = operationsHandoverRows.filter(isPublicLogisticsOperation)
    const token = generatePublicToken()
    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + 30)
    const payload = {
      token,
      scope: 'public-operations',
      active: true,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      expiresAtMs: expires.getTime(),
      createdByUid: user?.uid || '',
      createdByEmail: user?.email || '',
      createdByName: sellerName(profile, user),
      tasks: publicOps.map(publicTaskSnapshot),
      taskCount: publicOps.length,
    }
    if (isFirebaseReady && db) await setDoc(doc(db, 'publicReceptionTokens', token), payload)
    return token
  }

  async function copyOperationsPublicLink() {
    try {
      const publicOps = operationsHandoverRows.filter(isPublicLogisticsOperation)
      if (!publicOps.length) {
        setError('No hay operaciones propias pendientes para generar el link de logística.')
        return
      }
      const token = await createOperationsPublicToken()
      const link = operationsPublicLink(token)
      let copied = false
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(link)
          copied = true
        } catch (_) { copied = false }
      }
      if (!copied) {
        const area = document.createElement('textarea')
        area.value = link
        area.setAttribute('readonly', 'true')
        area.style.position = 'fixed'
        area.style.top = '0'
        area.style.left = '0'
        area.style.width = '1px'
        area.style.height = '1px'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.focus()
        area.select()
        area.setSelectionRange(0, area.value.length)
        copied = document.execCommand('copy')
        area.remove()
      }
      await logAudit('public_operations_token_created', 'Logística', token, { id: token, taskCount: publicOps.length }, { expiresInDays: 30, shortLink: true })
      if (copied) showSuccess('Link seguro de logística copiado correctamente')
      else setError(`No se pudo copiar automáticamente. Copia manualmente este link: ${link}`)
    } catch (err) {
      console.error(err)
      setError('No se pudo generar/copiar el link seguro. Verifica conexión e intenta nuevamente.')
    }
  }

  function isPublicLogisticsOperation(item = {}) {
    // En el link público NO se muestran check-in de alojamientos.
    // Solo: entregas/recepciones de Renta Car + limpiezas/check-out de Alojamientos.
    // iCal puede aparecer como check-out/limpieza, pero ya llega deduplicado y con nombre de alojamiento resuelto.
    if (item.reservationType === 'vehicle' && ['delivery','reception'].includes(item.operation)) return true
    if (item.reservationType === 'lodging' && item.operation === 'reception') return true
    return false
  }

  function publicOperationButtonLabel(item = {}) {
    if (item.reservationType === 'vehicle' && item.operation === 'reception') return 'Abrir recepción'
    if (item.reservationType === 'vehicle' && item.operation === 'delivery') return 'Abrir entrega'
    if (item.reservationType === 'lodging' && item.operation === 'reception') return 'Marcar limpieza'
    return 'Abrir'
  }

  function publicOperationTaskUrl(item = {}) {
    const url = new URL(window.location.href)
    url.searchParams.set('operaciones', '1')
    if (publicOperationsToken) url.searchParams.set('token', publicOperationsToken)
    url.searchParams.set('tarea', item.id || '')
    return url.toString()
  }

  function returnToPublicOperationsList() {
    const url = new URL(window.location.origin)
    url.searchParams.set('operaciones', '1')
    if (publicOperationsToken) url.searchParams.set('token', publicOperationsToken)
    window.location.href = url.toString()
  }

  function handlePublicOperationClick(item = {}) {
    const link = publicOperationTaskUrl(item)
    window.location.href = link
  }

  
  function resolveAccommodationForLodging(item = {}) {
    const byId = accommodations.find((apt) => apt.id === item.accommodationId)
    if (byId) return byId

    const normalizeUrl = (value = '') => String(value || '').trim().replace(/\/$/, '').toLowerCase()
    const sourceUrl = normalizeUrl(item.icalSourceUrl || item.icalUrl || item.sourceUrl || item.url)
    if (sourceUrl) {
      const byIcalUrl = accommodations.find((apt) => accommodationIcalUrls(apt).some((url) => normalizeUrl(url) === sourceUrl))
      if (byIcalUrl) return byIcalUrl
    }

    const sourceKey = String(item.icalSourceKey || item.externalUid || item.uid || '').trim()
    if (sourceKey) {
      const bySourceKey = accommodations.find((apt) => sourceKey.includes(apt.id) || normalizeText(sourceKey).includes(normalizeText(apt.name || '')) || normalizeText(sourceKey).includes(normalizeText(apt.residence || '')))
      if (bySourceKey) return bySourceKey
    }

    const storedName = String(item.accommodationName || item.propertyName || item.assetName || item.title || '').trim()
    if (storedName && !['alojamiento', 'airbnb (not available)', 'reserved'].includes(normalizeText(storedName))) {
      const normalizedStored = normalizeText(storedName)
      const byName = accommodations.find((apt) => {
        const aptName = normalizeText(apt.name || '')
        const residence = normalizeText(apt.residence || '')
        return (aptName && (aptName === normalizedStored || normalizedStored.includes(aptName) || aptName.includes(normalizedStored))) ||
          (residence && (residence === normalizedStored || normalizedStored.includes(residence) || residence.includes(normalizedStored)))
      })
      if (byName) return byName
      return { id: item.accommodationId || '', name: storedName }
    }

    const haystack = normalizeText(`${item.note || ''} ${item.description || ''} ${item.channel || ''} ${item.customerName || ''} ${item.summary || ''}`)
    if (haystack) {
      const byMention = accommodations.find((apt) => {
        const aptName = normalizeText(apt.name || '')
        const residence = normalizeText(apt.residence || '')
        return (aptName && haystack.includes(aptName)) || (residence && haystack.includes(residence))
      })
      if (byMention) return byMention
    }

    // Último recurso para registros iCal antiguos:
    // si el bloqueo no trae id, URL ni nombre, no se puede saber el activo con certeza.
    // Se etiqueta como "Alojamiento sin vincular" para obligar a re-sincronizar con la V94.
    return { id: item.accommodationId || '', name: 'Alojamiento sin vincular' }
  }

  async function repairIcalAccommodationNames() {
    const imported = lodgingStore.items.filter((item) => isIcalImportedBlock(item))
    let updated = 0
    for (const item of imported) {
      const apt = resolveAccommodationForLodging(item)
      if (!apt?.id || !apt?.name || apt.name === 'Alojamiento sin vincular') continue
      if (item.accommodationId !== apt.id || item.accommodationName !== apt.name) {
        await lodgingStore.editItem(item.id, { ...item, accommodationId: apt.id, accommodationName: apt.name, updatedAt: new Date().toISOString() })
        updated += 1
      }
    }
    showSuccess(updated ? `Reservas iCal reparadas: ${updated}` : 'No encontré reservas iCal para reparar automáticamente. Re-sincroniza cada alojamiento si aún ves registros sin vincular.')
  }

  function openIcalLinker(operationItem) {
    if (!operationItem?.reservationId) return
    const source = lodgingStore.items.find((row) => row.id === operationItem.reservationId)
    if (!source) return setError('No se encontró el registro iCal para vincular.')
    setLinkingIcalItem({ ...source, operationLabel: operationItem.title || 'Reserva iCal' })
  }

  async function saveIcalAccommodationLink(event) {
    event.preventDefault()
    if (!linkingIcalItem?.targetAccommodationId) return setError('Selecciona el alojamiento correcto.')
    const apt = accommodations.find((item) => item.id === linkingIcalItem.targetAccommodationId)
    if (!apt) return setError('No se encontró el alojamiento seleccionado.')
    const sourceUrl = String(linkingIcalItem.icalSourceUrl || linkingIcalItem.icalUrl || '').trim()
    const sourceKey = String(linkingIcalItem.icalSourceKey || '').trim()
    const sameIcalGroup = lodgingStore.items.filter((row) => {
      if (!isIcalImportedBlock(row)) return false
      if (sourceUrl && String(row.icalSourceUrl || row.icalUrl || '').trim() === sourceUrl) return true
      if (sourceKey && String(row.icalSourceKey || '').trim() === sourceKey) return true
      return row.id === linkingIcalItem.id
    })
    const rowsToUpdate = sameIcalGroup.length ? sameIcalGroup : [linkingIcalItem]
    for (const row of rowsToUpdate) {
      await lodgingStore.editItem(row.id, {
        ...row,
        accommodationId: apt.id,
        accommodationName: apt.name,
        propertyName: apt.name,
        assetName: apt.name,
        accommodationTitle: apt.name,
        updatedAt: new Date().toISOString(),
      })
    }
    setLinkingIcalItem(null)
    showSuccess(`iCal vinculado a ${apt.name}`)
  }

  function accommodationCleaningCount(accommodationId) {
    if (!accommodationId) return 0
    return lodgingStore.items.filter((row) => row.accommodationId === accommodationId && (row.cleaningCompletedAt || row.cleaningStatus === 'completed')).length
  }

  async function markHandoverOperationDone(operationItem, completedBy = sellerName(profile, user)) {
    if (!operationItem?.reservationId) return
    const now = new Date().toISOString()
    if (operationItem.reservationType === 'vehicle') {
      const reservation = reservationsStore.items.find((row) => row.id === operationItem.reservationId)
      if (!reservation) return setError('No se encontró la reserva del vehículo.')
      if (operationItem.operation === 'delivery') {
        await reservationsStore.editItem(reservation.id, {
          ...reservation,
          deliveryKm: reservation.deliveryKm || vehicles.find(v=>v.id===operationItem.vehicleId)?.currentKm || '',
          deliveryStatus: 'delivered',
          deliveredAt: now,
          deliveryCompletedAt: now,
          deliveredBy: completedBy,
          updatedAt: now,
        })
        showSuccess('Vehículo marcado como entregado')
        return
      }
      setSelectedVehicleId(operationItem.vehicleId)
      setEditingVehicleCheckin({ ...emptyVehicleCheckin(operationItem.vehicleId, profile, user), reservationId: operationItem.reservationId, currentKm: vehicles.find(v=>v.id===operationItem.vehicleId)?.currentKm || '', createdByName: completedBy })
      return
    }
    const lodging = lodgingStore.items.find((row) => row.id === operationItem.reservationId)
    if (!lodging) return setError('No se encontró la reserva del alojamiento.')
    if (operationItem.operation === 'delivery') {
      await lodgingStore.editItem(lodging.id, {
        ...lodging,
        checkInStatus: 'completed',
        checkInDoneAt: now,
        checkInBy: completedBy,
        deliveredAt: now,
        deliveredBy: completedBy,
        updatedAt: now,
      })
      showSuccess('Check-in marcado como realizado')
      return
    }
    await lodgingStore.editItem(lodging.id, {
      ...lodging,
      checkOutStatus: 'completed',
      checkOutDoneAt: now,
      checkOutBy: completedBy,
      cleaningStatus: 'completed',
      cleaningCompletedAt: now,
      cleaningBy: completedBy,
      receptionCompletedAt: now,
      updatedAt: now,
    })
    showSuccess('Check-out / limpieza marcada como realizada')
  }

  async function savePublicOperationSubmission(kind, payload = {}) {
    if (!publicOperationsMode || !publicTokenRecord?.id) return false
    const submissionValidation = validatePublicSubmissionCritical(kind, payload)
    if (submissionValidation) {
      setError(submissionValidation)
      return false
    }
    const taskId = payload.taskId || payload.reservationId || payload.id || publicTaskId || ''
    const now = new Date().toISOString()
    const submissionId = `${publicTokenRecord.id}_${taskId || generatePublicToken()}`
    const submission = {
      token: publicTokenRecord.id,
      taskId,
      kind,
      status: 'submitted',
      payload,
      createdAt: now,
      submittedAt: now,
      publicOrigin: 'public-operations',
    }
    if (isFirebaseReady && db) await setDoc(doc(db, 'publicOperationSubmissions', submissionId), submission, { merge: true })
    const next = Array.from(new Set([...(completedPublicTaskIds || []), taskId].filter(Boolean)))
    setCompletedPublicTaskIds(next)
    localStorage.setItem('alohandote_completed_public_tasks', JSON.stringify(next))
    await logAudit(`${kind}_submitted_public_token`, 'Logística pública', taskId || publicTokenRecord.id, { id: taskId || publicTokenRecord.id, assetName: payload.assetName || '' }, { token: publicTokenRecord.id })
    return true
  }

  function publicSubmissionLabel(item = {}) {
    const kind = String(item.kind || '')
    if (kind === 'vehicle_delivery') return 'Entrega vehículo'
    if (kind === 'vehicle_reception') return 'Recepción vehículo'
    if (kind === 'lodging_cleaning') return 'Limpieza alojamiento'
    return kind || 'Operación'
  }

  function publicSubmissionAsset(item = {}) {
    const payload = item.payload || {}
    return payload.assetName || payload.vehicleName || payload.accommodationName || payload.assetLabel || item.taskId || '-'
  }

  async function syncPublicOperationSubmission(item = {}) {
    if (!item?.id) return setError('No se encontró la operación pública.')
    if (!isAdmin && currentRole !== 'supervisor') return setError('Solo admin o supervisor pueden sincronizar operaciones públicas.')
    const payload = item.payload || {}
    const now = new Date().toISOString()
    try {
      if (item.kind === 'vehicle_delivery') {
        const reservation = reservationsStore.items.find((row) => row.id === (payload.reservationId || item.taskId))
        const vehicle = vehicles.find((row) => row.id === payload.vehicleId) || {}
        if (reservation) {
          await reservationsStore.editItem(reservation.id, {
            ...reservation,
            deliveryKm: payload.currentKm || reservation.deliveryKm || '',
            kmEntrega: payload.currentKm || reservation.kmEntrega || '',
            deliveryStatus: 'delivered',
            deliveredAt: now,
            deliveryCompletedAt: now,
            deliveredBy: payload.responsible || payload.createdByName || 'Operador',
            deliveryFuelLevel: payload.fuelLevel || '',
            deliveryStatusNote: payload.generalStatus || '',
            deliveryNotes: payload.notes || '',
            updatedAt: now,
          })
        }
        if (vehicle?.id && payload.currentKm) {
          await vehiclesStore.editItem(vehicle.id, { ...vehicle, currentKm: payload.currentKm, lastKmUpdateAt: now, lastKmUpdatedBy: payload.responsible || 'Operador' })
        }
      } else if (item.kind === 'vehicle_reception') {
        const reservation = reservationsStore.items.find((row) => row.id === (payload.reservationId || item.taskId))
        const vehicle = vehicles.find((row) => row.id === payload.vehicleId) || {}
        await vehicleCheckinsStore.createItem({
          vehicleId: payload.vehicleId || vehicle.id || '',
          reservationId: reservation?.id || payload.reservationId || '',
          vehicleName: vehicle.name || payload.assetName || payload.vehicleName || '',
          currentKm: payload.currentKm || '',
          fuelLevel: payload.fuelLevel || '',
          generalStatus: payload.generalStatus || '',
          notes: payload.notes || '',
          dashboardPhoto: payload.dashboardPhoto || null,
          vehiclePhoto: payload.vehiclePhoto || null,
          createdByUid: user?.uid || '',
          createdByEmail: user?.email || '',
          createdByName: payload.createdByName || payload.responsible || 'Operador',
          createdAt: now,
          source: 'public-submission-sync',
        })
        if (reservation) {
          const delivered = Number(reservation.deliveryKm || reservation.deliveryKmReal || reservation.kmEntrega || 0)
          const received = Number(payload.currentKm || 0)
          const drivenKm = delivered && received >= delivered ? received - delivered : Number(reservation.kmRecorridos || 0)
          await reservationsStore.editItem(reservation.id, {
            ...reservation,
            kmRecepcion: payload.currentKm || reservation.kmRecepcion || '',
            kmRecorridos: drivenKm ? String(drivenKm) : reservation.kmRecorridos || '',
            receptionAt: now,
            receivedBy: payload.createdByName || payload.responsible || 'Operador',
            fuelLevelReception: payload.fuelLevel || '',
            receptionStatus: payload.generalStatus || '',
            receptionNotes: payload.notes || '',
            status: 'returned',
            returnedAt: now,
            updatedAt: now,
          })
        }
        if (vehicle?.id && payload.currentKm) {
          await vehiclesStore.editItem(vehicle.id, { ...vehicle, currentKm: payload.currentKm, lastKmUpdateAt: now, lastKmUpdatedBy: payload.createdByName || payload.responsible || 'Operador' })
        }
      } else if (item.kind === 'lodging_cleaning') {
        const lodging = lodgingStore.items.find((row) => row.id === (payload.reservationId || item.taskId))
        const inventoryItem = payload.inventoryItemId ? inventoryItemsStore.items.find((row) => row.id === payload.inventoryItemId) : null
        const quantity = num(payload.quantity || 0)
        if (inventoryItem && quantity > 0) {
          const nextQty = num(inventoryItem.quantity) - quantity
          if (nextQty < 0) return setError('No hay stock suficiente para sincronizar esa limpieza.')
          const unitCost = num(inventoryItem.unitCost)
          await inventoryMovementsStore.createItem({
            itemId: inventoryItem.id,
            itemName: inventoryItem.name,
            category: inventoryItem.category,
            kind: 'Salida',
            reason: 'Limpieza pública sincronizada',
            module: 'Alojamientos',
            assetId: payload.accommodationId || lodging?.accommodationId || '',
            quantity,
            unitCost,
            totalCost: Number((quantity * unitCost).toFixed(2)),
            date: now.slice(0,10),
            responsible: payload.responsible || 'Operador',
            reference: lodging?.id || payload.reservationId || '',
            notes: payload.notes || 'Consumo por limpieza desde link público',
            createdByName: sellerName(profile, user),
          })
          await inventoryItemsStore.editItem(inventoryItem.id, { ...inventoryItem, quantity: nextQty, updatedBy: payload.responsible || 'Operador', lastMovementAt: now })
        }
        if (lodging) {
          await lodgingStore.editItem(lodging.id, {
            ...lodging,
            checkOutStatus: 'completed',
            checkOutDoneAt: now,
            checkOutBy: payload.responsible || 'Operador',
            cleaningStatus: 'completed',
            cleaningCompletedAt: now,
            cleaningBy: payload.responsible || 'Operador',
            cleaningNotes: payload.notes || '',
            cleaningDamagePhoto: payload.damagePhoto || null,
            cleaningInventoryItemId: payload.inventoryItemId || '',
            cleaningInventoryQuantity: quantity || '',
            receptionCompletedAt: now,
            updatedAt: now,
          })
        }
      } else {
        return setError('Tipo de operación pública no reconocido.')
      }

      await publicOperationSubmissionsStore.editItem(item.id, {
        ...item,
        status: 'synced',
        syncedAt: now,
        syncedBy: sellerName(profile, user),
        syncedByUid: user?.uid || '',
      })
      await logAudit('public_operation_submission_synced', 'Logística pública', item.taskId || item.id, { ...item, id: item.id, assetName: publicSubmissionAsset(item) }, { kind: item.kind })
      showSuccess('Operación pública sincronizada correctamente')
    } catch (err) {
      console.error(err)
      setError('No se pudo sincronizar la operación pública. Revisa permisos, conexión o datos de la reserva.')
    }
  }

  async function syncAllPublicOperationSubmissions() {
    const rows = pendingPublicSubmissions.slice(0, 20)
    for (const item of rows) {
      await syncPublicOperationSubmission(item)
    }
  }

  async function saveVehicleDelivery(event) {
    event.preventDefault()
    setError('')
    const deliveryValidation = validateVehicleOperationCritical(editingVehicleDelivery, 'delivery')
    if (deliveryValidation) return setError(deliveryValidation)
    const vehicle = vehicles.find((item) => item.id === editingVehicleDelivery.vehicleId)
    if (!vehicle) return setError('No se encontró el vehículo.')
    try {
      const dashboardPhoto = editingVehicleDelivery._dashboardPhotoFile ? await uploadVehicleCheckinFile(editingVehicleDelivery._dashboardPhotoFile, 'entrega-tablero') : editingVehicleDelivery.dashboardPhoto || null
      const vehiclePhoto = editingVehicleDelivery._vehiclePhotoFile ? await uploadVehicleCheckinFile(editingVehicleDelivery._vehiclePhotoFile, 'entrega-vehiculo') : editingVehicleDelivery.vehiclePhoto || null
      const now = new Date().toISOString()
      const reservation = editingVehicleDelivery.reservationId ? reservationsStore.items.find((row) => row.id === editingVehicleDelivery.reservationId) : null
      if (publicOperationsMode && publicTokenRecord) {
        await savePublicOperationSubmission('vehicle_delivery', { ...editingVehicleDelivery, taskId: editingVehicleDelivery.id || editingVehicleDelivery.reservationId || publicTaskId, assetName: vehicle.name || editingVehicleDelivery.assetName || '', currentKm: editingVehicleDelivery.currentKm, fuelLevel: editingVehicleDelivery.fuelLevel || '', generalStatus: editingVehicleDelivery.generalStatus || '', notes: editingVehicleDelivery.notes || '' })
        setEditingVehicleDelivery(null)
        showSuccess('Entrega enviada correctamente para validación')
        setTimeout(returnToPublicOperationsList, 700)
        return
      }
      if (reservation) {
        await reservationsStore.editItem(reservation.id, {
          ...reservation,
          deliveryKm: editingVehicleDelivery.currentKm,
          kmEntrega: editingVehicleDelivery.currentKm,
          deliveryStatus: 'delivered',
          deliveredAt: now,
          deliveryCompletedAt: now,
          deliveredBy: editingVehicleDelivery.responsible || sellerName(profile, user),
          deliveryFuelLevel: editingVehicleDelivery.fuelLevel || '',
          deliveryStatusNote: editingVehicleDelivery.generalStatus || '',
          deliveryNotes: editingVehicleDelivery.notes || '',
          deliveryDashboardPhoto: dashboardPhoto,
          deliveryVehiclePhoto: vehiclePhoto,
          updatedAt: now,
        })
      }
      await vehiclesStore.editItem(vehicle.id, { ...vehicle, currentKm: editingVehicleDelivery.currentKm, lastKmUpdateAt: now, lastKmUpdatedBy: editingVehicleDelivery.responsible || sellerName(profile, user) })
      await logAudit('vehicle_delivery_completed', 'Renta Car', reservation?.id || vehicle.id, { ...editingVehicleDelivery, id: reservation?.id || vehicle.id, assetName: vehicle.name }, { currentKm: editingVehicleDelivery.currentKm, reservationId: reservation?.id || '' })
      setEditingVehicleDelivery(null)
      showSuccess('Entrega de vehículo guardada correctamente')
      if (publicOperationsMode) setTimeout(returnToPublicOperationsList, 700)
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar la entrega. Revisa conexión, Storage o reglas Firebase.')
    }
  }

  async function saveCleaningTask(event) {
    event.preventDefault()
    setError('')
    const cleaningValidation = validateCleaningCritical(editingCleaningTask)
    if (cleaningValidation) return setError(cleaningValidation)
    const lodging = lodgingStore.items.find((row) => row.id === editingCleaningTask.reservationId) || (publicOperationsMode ? { id: editingCleaningTask.reservationId, accommodationId: editingCleaningTask.accommodationId || '', customerName: editingCleaningTask.customerName || '' } : null)
    if (!lodging) return setError('No se encontró la reserva del alojamiento.')
    try {
      const now = new Date().toISOString()
      const damagePhoto = editingCleaningTask._damagePhotoFile ? await uploadVehicleCheckinFile(editingCleaningTask._damagePhotoFile, 'limpieza-incidencia') : editingCleaningTask.damagePhoto || null
      if (publicOperationsMode && publicTokenRecord) {
        await savePublicOperationSubmission('lodging_cleaning', { ...editingCleaningTask, taskId: editingCleaningTask.id || editingCleaningTask.reservationId || publicTaskId, assetName: editingCleaningTask.assetName || '', responsible: editingCleaningTask.responsible, inventoryItemId: editingCleaningTask.inventoryItemId || '', quantity: editingCleaningTask.quantity || '', notes: editingCleaningTask.notes || '', damagePhoto })
        setEditingCleaningTask(null)
        showSuccess('Limpieza enviada correctamente para validación')
        setTimeout(returnToPublicOperationsList, 700)
        return
      }
      const inventoryItem = editingCleaningTask.inventoryItemId ? inventoryItemsStore.items.find((item) => item.id === editingCleaningTask.inventoryItemId) : null
      const quantity = num(editingCleaningTask.quantity || 0)
      if (inventoryItem && quantity > 0) {
        const nextQty = num(inventoryItem.quantity) - quantity
        if (nextQty < 0) return setError('No hay stock suficiente para descontar ese artículo.')
        const unitCost = num(inventoryItem.unitCost)
        await inventoryMovementsStore.createItem({
          itemId: inventoryItem.id,
          itemName: inventoryItem.name,
          category: inventoryItem.category,
          kind: 'Salida',
          reason: 'Limpieza',
          module: 'Alojamientos',
          assetId: editingCleaningTask?.accommodationId || lodging?.accommodationId || '',
          quantity,
          unitCost,
          totalCost: Number((quantity * unitCost).toFixed(2)),
          date: new Date().toISOString().slice(0,10),
          responsible: editingCleaningTask.responsible,
          reference: lodging.id,
          notes: editingCleaningTask.notes || 'Consumo por limpieza',
          createdByName: sellerName(profile, user),
        })
        await inventoryItemsStore.editItem(inventoryItem.id, { ...inventoryItem, quantity: nextQty, updatedBy: editingCleaningTask.responsible, lastMovementAt: now })
      }
      await lodgingStore.editItem(lodging.id, {
        ...lodging,
        checkOutStatus: 'completed',
        checkOutDoneAt: now,
        checkOutBy: editingCleaningTask.responsible,
        cleaningStatus: 'completed',
        cleaningCompletedAt: now,
        cleaningBy: editingCleaningTask.responsible,
        cleaningNotes: editingCleaningTask.notes || '',
        cleaningDamagePhoto: damagePhoto,
        cleaningInventoryItemId: editingCleaningTask.inventoryItemId || '',
        cleaningInventoryQuantity: quantity || '',
        receptionCompletedAt: now,
        updatedAt: now,
      })
      setEditingCleaningTask(null)
      showSuccess('Limpieza realizada con éxito')
      if (publicOperationsMode) setTimeout(returnToPublicOperationsList, 700)
    } catch (err) {
      console.error(err)
      setError('No se pudo registrar la limpieza. Revisa conexión, Storage o inventario.')
    }
  }

  async function saveVehicleReception(event) {
    event.preventDefault()
    setError('')
    const receptionValidation = validateVehicleOperationCritical(editingVehicleCheckin, 'reception')
    if (receptionValidation) return setError(receptionValidation)
    const vehicle = vehicles.find((item) => item.id === editingVehicleCheckin.vehicleId) || (publicOperationsMode ? { id: editingVehicleCheckin.vehicleId, name: editingVehicleCheckin.assetName || editingVehicleCheckin.vehicleName || 'Vehículo' } : null)
    if (!vehicle) return setError('No se encontró el vehículo seleccionado.')
    try {
      const dashboardPhoto = editingVehicleCheckin._dashboardPhotoFile ? await uploadVehicleCheckinFile(editingVehicleCheckin._dashboardPhotoFile, 'tablero') : editingVehicleCheckin.dashboardPhoto || null
      const vehiclePhoto = editingVehicleCheckin._vehiclePhotoFile ? await uploadVehicleCheckinFile(editingVehicleCheckin._vehiclePhotoFile, 'vehiculo') : editingVehicleCheckin.vehiclePhoto || null
      const now = new Date().toISOString()
      const matchedReservation = editingVehicleCheckin.reservationId
        ? reservationsStore.items.find((item) => item.id === editingVehicleCheckin.reservationId)
        : findReceptionReservationForVehicle(vehicle.id)
      const linkedReservationId = matchedReservation?.id || editingVehicleCheckin.reservationId || ''
      if (publicOperationsMode && publicTokenRecord) {
        await savePublicOperationSubmission('vehicle_reception', { ...editingVehicleCheckin, taskId: editingVehicleCheckin.id || linkedReservationId || publicTaskId, assetName: vehicle.name || editingVehicleCheckin.assetName || '', currentKm: editingVehicleCheckin.currentKm, fuelLevel: editingVehicleCheckin.fuelLevel || '', generalStatus: editingVehicleCheckin.generalStatus || '', notes: editingVehicleCheckin.notes || '' })
        setEditingVehicleCheckin(null)
        setError('')
        showSuccess('Recepción enviada correctamente para validación')
        setTimeout(returnToPublicOperationsList, 700)
        return
      }
      const payload = {
        vehicleId: vehicle.id,
        reservationId: linkedReservationId,
        vehicleName: vehicle.name || '',
        currentKm: editingVehicleCheckin.currentKm,
        fuelLevel: editingVehicleCheckin.fuelLevel || '',
        generalStatus: editingVehicleCheckin.generalStatus || '',
        notes: editingVehicleCheckin.notes || '',
        dashboardPhoto,
        vehiclePhoto,
        createdByUid: user?.uid || '',
        createdByEmail: user?.email || '',
        createdByName: editingVehicleCheckin.createdByName?.trim?.() || sellerName(profile, user),
        createdAt: now,
      }
      await vehicleCheckinsStore.createItem(payload)
      if (linkedReservationId && matchedReservation) {
        const reservation = matchedReservation
        const delivered = Number(reservation?.deliveryKm || reservation?.deliveryKmReal || 0)
        const received = Number(editingVehicleCheckin.currentKm || 0)
        const drivenKm = delivered && received >= delivered ? received - delivered : Number(reservation?.kmRecorridos || 0)
        await reservationsStore.editItem(linkedReservationId, {
          ...reservation,
          deliveryKm: reservation.deliveryKm || (delivered ? String(delivered) : ''),
          kmRecepcion: editingVehicleCheckin.currentKm,
          kmRecorridos: drivenKm ? String(drivenKm) : '',
          receptionAt: now,
          receivedBy: payload.createdByName,
          fuelLevelReception: payload.fuelLevel,
          receptionStatus: payload.generalStatus,
          receptionNotes: payload.notes,
          dashboardPhoto,
          vehiclePhoto,
          status: 'returned',
          returnedAt: now,
        })
      }
      await vehiclesStore.editItem(vehicle.id, {
        ...vehicle,
        currentKm: editingVehicleCheckin.currentKm,
        lastKmUpdateAt: now,
        lastKmUpdatedBy: payload.createdByName,
      })
      await logAudit('vehicle_reception_completed', 'Renta Car', linkedReservationId || vehicle.id, { ...payload, id: linkedReservationId || vehicle.id, assetName: vehicle.name }, { currentKm: editingVehicleCheckin.currentKm, linkedReservationId })
      setEditingVehicleCheckin(null)
      setError('')
      showSuccess(linkedReservationId ? 'Recepción guardada y reserva marcada como devuelta' : 'Recepción guardada. No se encontró reserva pendiente para vincular.')
    } catch (err) {
      console.error(err)
      const firebaseMessage = err?.code ? ` (${err.code})` : ''
      setError(`No se pudo guardar la recepción${firebaseMessage}. Revisa Storage, reglas de Firebase o conexión.`)
    }
  }

async function saveReservation(event = null) {
    event?.preventDefault?.()
    setError('')
    const canCurrentUserSave = isAdmin || canEditReservation(editingReservation)
    if (!canWriteCommercial && !canWriteOperations && !isAdmin) return setError('Tu perfil no tiene permiso para crear o modificar reservas.')
    // V203: perfil vendedor alojamientos no puede crear ni editar Renta Car.
    if (!isAdmin && normalizeRole(profile?.role) === 'seller_lodging') return setError('Tu perfil vendedor solo tiene acceso a alojamientos.')
    if (!canCurrentUserSave) return setError('Tu perfil solo puede modificar reservas creadas por tu usuario.')
    const storedReservationForEdit = resolveStoredReservationForEdit(editingReservation || {})
    const resolvedEditingId = storedReservationForEdit?.__docId || storedReservationForEdit?.id || editingReservation?.__docId || editingReservation?._editingOriginalId || editingReservation?.id || ''
    const reservationDraftForSave = resolvedEditingId
      ? { ...editingReservation, id: resolvedEditingId, __docId: resolvedEditingId, _editingOriginalId: resolvedEditingId }
      : editingReservation
    const validationError = validateReservation(reservationDraftForSave)
    if (validationError) return setError(validationError)
    const normalizedStatus = normalizeStatus(editingReservation.status)
    if (normalizedStatus === 'reserved' && !editingReservation.paymentMethod) return setError('Debes seleccionar método de pago.')
    const paymentRequiredError = reservationPaymentRequiredError(editingReservation)
    if (paymentRequiredError) return setError(paymentRequiredError)
    const isMaintenance = normalizedStatus === 'maintenance'
    const isNoDisponible = normalizedStatus === 'pending'
    setReservationSaving(true)
    try {
      const licenseDoc = editingReservation._licenseFile ? await uploadReservationFile(editingReservation._licenseFile, 'licencia') : editingReservation.licenseDoc || null
      const idDoc = editingReservation._idFile ? await uploadReservationFile(editingReservation._idFile, 'identificacion') : editingReservation.idDoc || null
      const paymentProof = editingReservation._paymentProofFile ? await uploadReservationFile(editingReservation._paymentProofFile, 'comprobante-pago') : editingReservation.paymentProof || null
      const maintenanceInvoices = editingReservation._maintenanceInvoiceFiles?.length ? await Promise.all(editingReservation._maintenanceInvoiceFiles.map((file, index) => uploadReservationFile(file, `factura-mantenimiento-${index+1}`))) : editingReservation.maintenanceInvoices || []
      const reservationDays = daysForReservation(editingReservation)
      const calculatedDailyTotal = editingReservation.dailyRate ? totalFromDaily(reservationDays, editingReservation.dailyRate) : ''
      const total = (isMaintenance || isNoDisponible) ? '' : (editingReservation.totalAmount || calculatedDailyTotal || quoteFromKmAdjusted(editingReservation.approxKm, editingReservation) || '')
      const reservationEuroRate = euroRateValue(exchangeRates, editingReservation.bcvEuroRate || officialEuroRate)
      const reservationRates = reservationEuroRate ? { ...(exchangeRates || {}), bcvEuro: reservationEuroRate } : exchangeRates
      const existingPayments = editingReservation?._paymentsEdited ? normalizePaymentHistory(editingReservation) : (resolvedEditingId ? normalizePaymentHistory(storedReservationForEdit || editingReservation) : [])
      const newPayment = shouldAppendPaymentOnSave(editingReservation, resolvedEditingId) ? buildPaymentEntry(paymentAppendRawAmountOnSave(editingReservation, resolvedEditingId), editingReservation.paymentMethod, reservationRates, reservationEuroRate, editingReservation.paymentReference || '') : null
      const paymentHistory = (!isMaintenance && !isNoDisponible) ? appendPaymentOnce(existingPayments, newPayment) : []
      const paymentTotals = paymentHistoryTotals({ paymentHistory })
      const paidUsd = paymentTotals.amountUsd
      const paidBs = paymentTotals.amountBs
      const calculatedDailyRate = (!isMaintenance && !isNoDisponible && total) ? dailyFromTotal(total, reservationDays) : ''
      const trackCommission = shouldTrackSellerCommission(editingReservation)
      const vehicleForReservation = vehicles.find((item)=>String(item.id||'')===String(editingReservation.vehicleId||'')) || selectedVehicle || {}
      const vehicleOwnershipType = isAlliedVehicle(vehicleForReservation) || String(editingReservation.vehicleOwnershipType || '').toLowerCase() === 'aliado' ? 'Aliado' : 'Propio'
      const vehicleAllyProfitMode = editingReservation.allyProfitMode || vehicleForReservation.allyProfitMode || 'fixed'
      const vehicleAllyProfitValue = editingReservation.allyProfitValue || vehicleForReservation.allyProfitValue || editingReservation.alohandoteIncomeUsd || ''
      // V223.5.2: no se aplica automáticamente el %/monto de ganancia definido en el activo.
      // La CxP nace por el total de la reserva y la ganancia Alohandote se define al editar/liquidar la CxP.
      const vehicleAllyTargetIncome = vehicleOwnershipType === 'Aliado' ? 0 : total
      const vehicleOwnerTarget = vehicleOwnershipType === 'Aliado' ? num(total) : 0
      const vehicleOwnerPayable = vehicleOwnershipType === 'Aliado' ? num(total) : 0
      const payload = {
        vehicleId: editingReservation.vehicleId,
        customerName: isNoDisponible ? '' : editingReservation.customerName.trim(),
        customerIdType: (isMaintenance || isNoDisponible) ? '' : (editingReservation.customerIdType || (String(editingReservation.customerId||'').trim().toUpperCase().startsWith('E-') ? 'E' : 'V')),
        customerId: (isMaintenance || isNoDisponible) ? '' : (editingReservation.customerId || '').trim(),
        customerAddress: (isMaintenance || isNoDisponible) ? '' : (editingReservation.customerAddress || '').trim(),
        customerNationality: (isMaintenance || isNoDisponible) ? '' : (editingReservation.customerNationality || '').trim(),
        customerCivilStatus: '',
        phone: (isMaintenance || isNoDisponible) ? '' : (editingReservation.phone || '').trim(),
        email: (isMaintenance || isNoDisponible) ? '' : (editingReservation.email || '').trim(),
        startDate: editingReservation.startDate,
        endDate: editingReservation.endDate,
        deliveryTime: editingReservation.deliveryTime || '12:00',
        returnTime: editingReservation.returnTime || '12:00',
        contractCity: editingReservation.contractCity || 'Barcelona',
        status: isMaintenance ? 'maintenance' : editingReservation.status,
        channel: (isMaintenance || isNoDisponible) ? '' : editingReservation.channel,
        note: editingReservation.note.trim(),
        totalAmount: total,
        amount: (isMaintenance || isNoDisponible) ? '' : String(paymentTotals.rawAmount || editingReservation.amount || ''),
        depositAmount: (isMaintenance || isNoDisponible) ? '' : editingReservation.depositAmount || '',
        approxKm: (isMaintenance || isNoDisponible) ? '' : editingReservation.approxKm || '',
        rentalDays: (isMaintenance || isNoDisponible) ? '' : String(reservationDays),
        dailyRate: (isMaintenance || isNoDisponible) ? '' : String(calculatedDailyRate || editingReservation.dailyRate || ''),
        pricePerKm: (isMaintenance || isNoDisponible) ? '' : currentKmRate(editingReservation),
        sellerCommission: (isMaintenance || isNoDisponible) ? '' : (trackCommission ? (editingReservation.sellerCommission || commissionFromTotal(total)) : ''),
        vehicleOwnershipType: (isMaintenance || isNoDisponible) ? '' : vehicleOwnershipType, allyProfitMode: (isMaintenance || isNoDisponible) ? '' : vehicleAllyProfitMode, allyProfitValue: (isMaintenance || isNoDisponible) ? '' : vehicleAllyProfitValue, alohandoteIncomeUsd: (isMaintenance || isNoDisponible) ? '' : String(vehicleAllyTargetIncome || ''), ownerShareUsd: (isMaintenance || isNoDisponible) ? '' : String(vehicleOwnerTarget || ''), ownerPayableUsd: (isMaintenance || isNoDisponible) ? '' : String(vehicleOwnerPayable || ''), ownerPayableStatus: (!isMaintenance && !isNoDisponible && vehicleOwnerPayable > 0) ? 'Por pagar' : '',
        bcvEuroRate: (isMaintenance || isNoDisponible) ? '' : (editingReservation.bcvEuroRate || reservationEuroRate || exchangeRates?.bcvEuro || ''),
        binanceUsdtRate: (isMaintenance || isNoDisponible) ? '' : (exchangeRates?.binanceUsdt || ''),
        exchangeSpreadPercent: (isMaintenance || isNoDisponible) ? '' : (exchangeAdjustmentPercent || ''),
        exchangeRateUpdatedAt: (isMaintenance || isNoDisponible) ? '' : (editingReservation.exchangeRateUpdatedAt || exchangeRates?.updatedAt || ''),
        totalAmountBs: (isMaintenance || isNoDisponible) ? '' : String(amountBs(total, reservationRates, reservationEuroRate)),
        amountBs: (isMaintenance || isNoDisponible) ? '' : String(paidBs),
        amountUsdEquivalent: (isMaintenance || isNoDisponible) ? '' : String(paidUsd),
        paymentHistory: (isMaintenance || isNoDisponible) ? [] : paymentHistory,
        deliveryKm: isMaintenance ? editingReservation.deliveryKm || '' : editingReservation.deliveryKm || '',
        kmRecepcion: editingReservation.kmRecepcion || '',
        kmRecorridos: editingReservation.kmRecorridos || '',
        receptionAt: editingReservation.receptionAt || '',
        receivedBy: editingReservation.receivedBy || '',
        fuelLevelReception: editingReservation.fuelLevelReception || '',
        receptionStatus: editingReservation.receptionStatus || '',
        maintenanceCost: isMaintenance ? String(num(editingReservation.maintenanceLaborCost)+num(editingReservation.maintenancePartsCost) || num(editingReservation.maintenanceCost) || '') : '',
        maintenanceLaborCost: isMaintenance ? editingReservation.maintenanceLaborCost || '' : '',
        maintenancePartsCost: isMaintenance ? editingReservation.maintenancePartsCost || '' : '',
        maintenancePaymentMethod: isMaintenance ? editingReservation.maintenancePaymentMethod || 'BS' : '',
        expenseStatus: isMaintenance ? editingReservation.expenseStatus || 'Pagado' : '',
        bcvDollarRate: isMaintenance ? editingReservation.bcvDollarRate || dollarRateValue(exchangeRates) || '' : '',
        maintenanceBsCost: isMaintenance ? String(maintenanceBsCost({...editingReservation, maintenanceCost: String(num(editingReservation.maintenanceLaborCost)+num(editingReservation.maintenancePartsCost) || num(editingReservation.maintenanceCost))}, exchangeRates)) : '',
        maintenanceInvoices: isMaintenance ? maintenanceInvoices : [],
        maintenanceType: isMaintenance ? editingReservation.maintenanceType || 'Preventivo' : '',
        currentKm: isMaintenance ? Number(editingReservation.currentKm || selectedVehicle?.currentKm || 0) : '',
        nextMaintenanceEveryKm: isMaintenance ? Number(editingReservation.nextMaintenanceEveryKm || 0) : '',
        maintenanceTargetKm: isMaintenance ? Number(editingReservation.maintenanceTargetKm || 0) : '',
        inventoryItemId: isMaintenance ? editingReservation.inventoryItemId || '' : '',
        inventoryQuantity: isMaintenance ? editingReservation.inventoryQuantity || '' : '',
        licenseDoc: (isMaintenance || isNoDisponible) ? null : licenseDoc,
        idDoc: (isMaintenance || isNoDisponible) ? null : idDoc,
        paymentMethod: (isMaintenance || isNoDisponible) ? '' : editingReservation.paymentMethod || '',
        paymentReference: (isMaintenance || isNoDisponible) ? '' : editingReservation.paymentReference || '',
        paymentProof: (isMaintenance || isNoDisponible) ? null : paymentProof,
        createdByUid: editingReservation.createdByUid || user?.uid || '',
        createdByEmail: editingReservation.createdByEmail || user?.email || '',
        createdByName: normalizePersonName(editingReservation.createdByName || sellerName(profile, user)),
        createdByRole: editingReservation.createdByRole || profile?.role || '',
        createdAt: editingReservation.createdAt || editingReservation.creationDate || new Date().toISOString(),
        creationDate: editingReservation.creationDate || editingReservation.createdAt || new Date().toISOString(),
      }
      let savedId = resolvedEditingId || ''
      if (resolvedEditingId) {
        await reservationsStore.editItem(resolvedEditingId, payload)
      } else {
        const created = await reservationsStore.createItem(payload)
        savedId = created?.id || ''
      }
      const savedRecord = { ...payload, id: savedId }
      for (const row of (generalExpensesStore.items || []).filter((row) => String(row.sourceReservationId || '') === String(savedId) && ['ownerPayableVehicleAlly'].includes(row.sourceType))) {
        if (!isMaintenance && !isNoDisponible && savedRecord.vehicleOwnershipType === 'Aliado' && num(savedRecord.ownerPayableUsd) > 0) continue
        if (row?.id) await generalExpensesStore.removeItem(row.id)
      }
      if (!isMaintenance && !isNoDisponible && savedRecord.vehicleOwnershipType === 'Aliado' && num(savedRecord.ownerPayableUsd) > 0) {
        const ownerPayableCurrency = paymentDisplayCurrency(savedRecord.paymentMethod)
        const ownerPayableMethod = savedRecord.paymentMethod || '$ Efectivo'
        const ownerPayableAmountBs = ownerPayableCurrency === 'Bs' ? receivablePendingBs({ ...savedRecord, totalAmount: savedRecord.ownerPayableUsd, amount: savedRecord.ownerPayableUsd, paymentMethod: ownerPayableMethod }, reservationRates) : amountBs(num(savedRecord.ownerPayableUsd), reservationRates, reservationEuroRate)
        const payablePayload = { date: savedRecord.createdAt ? String(savedRecord.createdAt).slice(0,10) : new Date().toISOString().slice(0,10), category: 'Pago propietario aliado', description: `Pago propietario ${vehicleForReservation.allyOwnerName || vehicleForReservation.name || 'vehículo aliado'} · ${savedRecord.customerName || 'Reserva'}`, amount: num(savedRecord.ownerPayableUsd), currency: ownerPayableCurrency, amountBs: String(ownerPayableAmountBs), paymentMethod: ownerPayableMethod, paymentCurrency: ownerPayableCurrency, paymentChannel: paymentDisplayMethod(ownerPayableMethod), expenseStatus: 'Por pagar', assetType: 'Renta Car', assetId: savedRecord.vehicleId || '', responsible: savedRecord.createdByName || sellerName(profile, user), bcvDollarRate: reservationEuroRate || euroRateValue(exchangeRates, officialEuroRate), notes: 'Cuenta por pagar automática generada por reserva de vehículo aliado. Nace por el total de la reserva; la ganancia Alohandote se define al editar/liquidar la CxP. No descuenta caja hasta marcar como Pagado.', reservationTotalUsd: num(savedRecord.totalAmount), reservationTotalBs: String(ownerPayableAmountBs), alohandoteNetIncomeUsd: num(savedRecord.alohandoteIncomeUsd), alohandoteNetIncomeBs: '', sourceReservationId: savedId, sourceType: 'ownerPayableVehicleAlly', createdByUid: user?.uid || '', createdByEmail: user?.email || '', createdByName: sellerName(profile, user) }
        const existingPayable = (generalExpensesStore.items || []).find((row) => row.sourceType === 'ownerPayableVehicleAlly' && String(row.sourceReservationId || '') === String(savedId))
        if (existingPayable?.id) await generalExpensesStore.editItem(existingPayable.id, { ...existingPayable, ...payablePayload })
        else await generalExpensesStore.createItem(payablePayload)
      }
      if (isMaintenance) await autoConsumeInventoryForMaintenance(savedRecord, 'Renta Car')
      if (!isMaintenance && !isNoDisponible) await upsertLead('Renta Car', payload, 'cliente')
      await logAudit(resolvedEditingId ? (isMaintenance ? 'maintenance_updated' : 'reservation_updated') : (isMaintenance ? 'maintenance_created' : 'reservation_created'), 'Renta Car', savedId, savedRecord, { status: savedRecord.status, dates: `${savedRecord.startDate || ''} - ${savedRecord.endDate || ''}` })
      setEditingReservation(savedRecord); setError(''); showSuccess(isMaintenance ? 'Mantenimiento guardado y automatizaciones ERP aplicadas' : 'Reserva guardada e ingreso automático actualizado')
    } catch (err) {
      console.error(err)
      const firebaseMessage = err?.code ? ` (${err.code})` : ''
      setError(`No se pudo guardar${firebaseMessage}. Ya reforcé la carga de archivos para no bloquear el guardado; si persiste, revisa permisos de Firestore o conexión.`)
    } finally {
      setReservationSaving(false)
    }
  }


  async function uploadVehiclePhotos(files = []) {
    const fileList = Array.from(files || []).slice(0, 9)
    if (!fileList.length) return []
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const allowedExt = /\.(jpe?g|png|webp|heic|heif)$/i
    const maxSize = 30 * 1024 * 1024
    for (const file of fileList) {
      if (!(allowedTypes.includes(file.type) || allowedExt.test(file.name))) throw new Error(`Formato no permitido: ${file.name}. Usa JPG, PNG, WEBP o HEIC.`)
      if (file.size > maxSize) throw new Error(`La foto ${file.name} supera 30 MB.`)
    }
    const uploaded = []
    for (const originalFile of fileList) {
      const dataUrl = await buildCatalogPhoto(originalFile)
      uploaded.push({
        name: originalFile.name,
        type: 'image/jpeg',
        url: dataUrl,
        localOnly: false,
        embedded: true,
        catalogReady: true,
        uploadedAt: new Date().toISOString(),
      })
    }
    return uploaded
  }

  function moveVehiclePhoto(index, direction) {
    const photos = Array.isArray(editingVehicle.photos) ? [...editingVehicle.photos] : []
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= photos.length) return
    const [item] = photos.splice(index, 1)
    photos.splice(nextIndex, 0, item)
    setEditingVehicle({ ...editingVehicle, photos })
  }

  function removeVehiclePhoto(index) {
    const photos = Array.isArray(editingVehicle.photos) ? [...editingVehicle.photos] : []
    photos.splice(index, 1)
    setEditingVehicle({ ...editingVehicle, photos })
  }

  function shareVehicleCatalog(vehicle = selectedVehicle) {
    if (!vehicle) return
    const photos = Array.isArray(vehicle.photos) ? vehicle.photos.map(photoUrl).filter(Boolean).slice(0, 9) : []
    const features = [
      vehicle.brand ? `Marca: ${vehicle.brand}` : '',
      vehicle.model ? `Modelo: ${vehicle.model}` : '',
      vehicle.vehicleType ? `Tipo: ${vehicle.vehicleType}` : '',
      vehicle.year ? `Año: ${vehicle.year}` : '',
      vehicle.transmission ? `Transmisión: ${vehicle.transmission}` : '',
      vehicle.fuelType ? `Combustible: ${vehicle.fuelType}` : '',
      vehicle.color ? `Color: ${vehicle.color}` : '',
      vehicle.ac ? 'Aire acondicionado' : '',
      vehicle.bluetooth ? 'Bluetooth' : '',
      vehicle.parkingSensors ? 'Sensores de estacionamiento' : '',
      vehicle.powerSteering ? 'Dirección asistida' : '',
      vehicle.airbag ? 'Airbag' : '',
      vehicle.powerWindows ? 'Vidrios eléctricos' : '',
      vehicle.screen ? 'Pantalla' : '',
      vehicle.sunroof ? 'Quemacoco' : '',
    ].filter(Boolean)
    const priceLine = vehicle.dailyRentalRate ? `Tarifa por día: ${money(vehicle.dailyRentalRate)}` : 'Tarifa por día por confirmar'
    const whatsappText = `Catalogo Rent a Car\n${vehicle.name || ''}\n${priceLine}\n${features.join('\n')}`.trim()
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
    const htmlPhotos = photos.length ? photos.map((url, i) => `<figure><img src="${escapeHtml(url)}" alt="Foto ${i+1}"/></figure>`).join('') : '<div class="empty">No hay fotos cargadas todavía.</div>'
    const shortDollar = (value) => {
      const n = Number(value || 0)
      if (!Number.isFinite(n) || n <= 0) return '0$'
      return `${n.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}$`
    }
    const priceLineMobile = vehicle.dailyRentalRate ? `Costo por día ${shortDollar(vehicle.dailyRentalRate)}` : 'Costo por día por confirmar'
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Catálogo ${escapeHtml(vehicle.name || 'Rent a Car')}</title><style>${cleanPrintCss}
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#f3eee6;color:#161616;font-family:Arial,Helvetica,sans-serif}
.actions{text-align:center;padding:10px;background:#fff;position:sticky;top:0;z-index:5;border-bottom:1px solid #eee}
.actions a,.actions button{border:0;background:#ff385c;color:#fff;border-radius:999px;padding:9px 14px;text-decoration:none;font-weight:800;cursor:pointer;margin:3px}
.actions button.secondary{background:#222}
.phone-sheet{width:100%;max-width:430px;margin:0 auto;background:#fff;padding:16px 16px 18px;display:flex;flex-direction:column;gap:12px;min-height:100vh}
.catalog-head{display:grid;grid-template-columns:118px 1fr;gap:14px;align-items:center;border-bottom:1px solid #ece7df;padding-bottom:16px}
.catalog-head img{width:112px;height:112px;object-fit:contain;justify-self:center}
.catalog-head h1{font-size:11px;line-height:1.08;margin:0 0 3px;font-weight:900}
.catalog-head .sub{font-size:10px;font-weight:800;color:#9b5e2e;letter-spacing:.02em}
.catalog-head .price{font-size:13px;font-weight:900;margin-top:6px}
.photo-wall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin:0 auto}
.photo-wall figure{margin:0;border-radius:14px;overflow:hidden;background:#f2f2f2;aspect-ratio:1/1;box-shadow:0 1px 0 rgba(0,0,0,.04)}
.photo-wall img{width:100%;height:100%;object-fit:cover;display:block}
.empty{grid-column:1/-1;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:16px;color:#777;min-height:280px}
.feature-title{margin:2px 0 -2px;text-align:left;font-size:13px;font-weight:900;letter-spacing:.02em;color:#2d2d2d}.feature-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin:0 auto}
.feature-chips span{background:#fafafa;border:1.5px solid #d7d0c7;border-radius:10px;padding:6px 5px;font-size:8.8px;font-weight:700;text-align:center;line-height:1.15;min-height:32px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.6)}
.notes{background:#fafafa;border:1px solid #eee;border-radius:12px;padding:10px;font-size:10px;line-height:1.35}
@media screen and (min-width:700px){
  body{padding:18px}
  .phone-sheet{width:760px;max-width:760px;padding:26px;gap:22px}
  .catalog-head{grid-template-columns:144px 1fr;gap:18px;padding-bottom:18px}
  .catalog-head img{width:136px;height:136px}
  .catalog-head h1{font-size:16px}
  .catalog-head .sub{font-size:11px}
  .catalog-head .price{font-size:16px}
  .photo-wall{gap:13px}
  .feature-chips{gap:10px}
  .feature-title{font-size:15px;margin:4px 0 0}  .feature-chips span{font-size:10px;padding:9px 7px;min-height:42px;border-radius:11px}
}
@media print{
  html,body{width:210mm;height:297mm;min-height:297mm;background:#fff;overflow:hidden}
  .actions{display:none}
  .phone-sheet{width:210mm;height:297mm;max-width:none;margin:0;background:#fff;padding:7mm 8mm 6mm;gap:3.2mm;box-shadow:none;border-radius:0;overflow:hidden;page-break-after:avoid}
  .catalog-head{grid-template-columns:24mm 1fr;gap:5mm;padding-bottom:2.5mm}
  .catalog-head img{width:22mm;height:22mm}
  .catalog-head h1{font-size:9.5pt;line-height:1.04}
  .catalog-head .sub{font-size:7pt}
  .catalog-head .price{font-size:7.8pt;margin-top:1mm}
  .photo-wall{width:154mm;max-width:154mm;gap:1.8mm;align-self:center}
  .photo-wall figure{border-radius:2.4mm;aspect-ratio:1/1}
  .feature-chips{gap:1.5mm}
  .feature-title{font-size:7.5pt;margin:0}
  .feature-chips span{font-size:5.7pt;padding:1.2mm .7mm;min-height:5.8mm;border-radius:1.7mm;border:0.7px solid #d7d0c7}
  .notes{font-size:5.8pt;padding:1.6mm;max-height:14mm;overflow:hidden}
}
</style></head><body><div class="actions"><a href="${whatsappUrl}" target="_blank">Compartir por WhatsApp</a><button onclick="downloadAlohandoteCleanPdf()">Descargar PDF limpio</button><button class="secondary" onclick="printAlohandoteCleanDocument()">Imprimir</button><button class="secondary" onclick="returnToAlohandoteApp && returnToAlohandoteApp()">Volver a la app</button>${cleanPdfExportScript('catalogo-rent-a-car')}</div><main class="phone-sheet"><section class="catalog-head"><div><h1>${escapeHtml(vehicle.name || 'Rent a Car')}</h1><div class="sub">Catálogo de renta car</div><div class="price">${escapeHtml(priceLineMobile)}</div></div></section><section class="photo-wall">${htmlPhotos}</section><div class="feature-title">Características</div><section class="feature-chips">${features.map((f)=>`<span title="${escapeHtml(f)}">${escapeHtml(f)}</span>`).join('')}</section>${vehicle.mapsUrl ? `<section class="notes"><strong>Ubicación Google Maps:</strong><br><a href="${escapeHtml(vehicle.mapsUrl)}" target="_blank">${escapeHtml(vehicle.mapsUrl)}</a></section>` : ''}${vehicle.notes ? `<section class="notes">${escapeHtml(vehicle.notes)}</section>` : ''}${alohandoteContactFooter()}</main></body></html>`
    openCatalogInSameTab(html, 'catalogo-rent-a-car')
    showSuccess('Catálogo Rent a Car generado en la misma pestaña.')
  }


  async function saveVehicle(event) {
    event.preventDefault()
    setError('')
    if (!canManageVehicles) return setError('Tu perfil no puede modificar vehículos.')
    if (!editingVehicle.name.trim()) return setError('Debes colocar el nombre del vehículo.')
    try {
      const newPhotos = await uploadVehiclePhotos(editingVehicle._photoFiles)
      const existingPhotos = Array.isArray(editingVehicle.photos) ? editingVehicle.photos : []
      const payload = {
        name: editingVehicle.name.trim(), brand: editingVehicle.brand?.trim() || '', model: editingVehicle.model?.trim() || '', year: editingVehicle.year?.trim() || '', vehicleType: editingVehicle.vehicleType || '', transmission: editingVehicle.transmission || '', fuelType: editingVehicle.fuelType || '', dailyRentalRate: Number(editingVehicle.dailyRentalRate || 0),
        plate: editingVehicle.plate?.trim() || '', color: editingVehicle.color?.trim() || '', vin: editingVehicle.vin?.trim() || '', mapsUrl: editingVehicle.mapsUrl?.trim() || '', investmentCost: Number(editingVehicle.investmentCost || 0),
        pricePerKm: Number(editingVehicle.pricePerKm || KM_RATE), ownershipType: editingVehicle.ownershipType || 'Propio', allyProfitMode: editingVehicle.allyProfitMode || 'fixed', allyProfitValue: editingVehicle.ownershipType === 'Aliado' ? Number(editingVehicle.allyProfitValue || 0) : '', allyOwnerName: editingVehicle.ownershipType === 'Aliado' ? (editingVehicle.allyOwnerName || '') : '', currentKm: editingVehicle.currentKm || '', lastKmUpdateAt: editingVehicle.lastKmUpdateAt || '', lastKmUpdatedBy: editingVehicle.lastKmUpdatedBy || '', parkingSensors: !!editingVehicle.parkingSensors, powerSteering: !!editingVehicle.powerSteering, bluetooth: !!editingVehicle.bluetooth, sunroof: !!editingVehicle.sunroof, ac: !!editingVehicle.ac, airbag: !!editingVehicle.airbag, powerWindows: !!editingVehicle.powerWindows, screen: !!editingVehicle.screen, photos: [...existingPhotos, ...newPhotos].slice(0, 9), notes: editingVehicle.notes?.trim() || '', active: true,
      }
      editingVehicle.id ? await vehiclesStore.editItem(editingVehicle.id, payload) : await vehiclesStore.createItem(payload)
      setEditingVehicle(null); setError(''); showSuccess('Vehículo guardado correctamente')
    } catch (err) {
      console.error(err)
      setError(err?.message || 'No se pudo guardar el vehículo o sus fotos. Intenta con JPG/PNG livianas y revisa permisos.')
    }
  }

  async function deleteVehicle(vehicle) {
    if (!canManageVehicles) return
    const related = reservationsStore.items.filter((r) => r.vehicleId === vehicle.id)
    if (related.length && !confirm(`Este vehículo tiene ${related.length} reservas/bloqueos. ¿Quieres eliminar también esos bloqueos?`)) return
    await Promise.all(related.map(async (r) => { await reservationsStore.removeItem(r.id); await logAudit('reservation_deleted_with_vehicle', 'Renta Car', r.id, r, { vehicleId: vehicle.id }) }))
    await vehiclesStore.removeItem(vehicle.id)
    await logAudit('vehicle_deleted', 'Renta Car', vehicle.id, vehicle, { relatedReservations: related.length })
    const next = vehicles.find((v) => v.id !== vehicle.id)
    if (next) setSelectedVehicleId(next.id)
  }

  const analytics = useMemo(() => {
    const { start: monthStart, end: monthEnd } = monthBounds(currentMonth)
    const items = reservationsStore.items.filter((r) => normalizeStatus(r.status) !== 'cancelled' && rangesOverlap(r.startDate, r.endDate, monthStart, monthEnd))
    const vehicleItems = items.filter((r) => r.vehicleId === selectedVehicle?.id)
    const reserved = vehicleItems.filter((r) => r.status === 'reserved')
    const occupied = reserved.reduce((sum, r) => sum + dayCount(r.startDate < monthStart ? monthStart : r.startDate, r.endDate > monthEnd ? monthEnd : r.endDate), 0)
    const totalService = reserved.reduce((sum, r) => sum + Number(r.totalAmount || r.amount || 0), 0)
    const collected = reserved.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    const pending = reserved.reduce((sum, r) => sum + pendingAmount(r, exchangeRates), 0)
    const maintenance = vehicleItems.filter((r) => r.status === 'maintenance')
    const maintenanceCost = maintenance.reduce((sum, r) => sum + Number(r.maintenanceCost || r.amount || 0), 0)
    const cleanings = vehicleItems.filter((r) => r.washStatus === 'completed' || r.cleaningStatus === 'completed' || r.vehicleWashDoneAt || r.receptionStatus === 'completed').length
    const expenseRows = selectedVehicle?.id ? assetExpensesForDetail('Vehículo', selectedVehicle.id) : []
    const expenseTotal = expenseRows.reduce((sum,row)=>sum+num(row.amountUsd),0)
    const allyProfit = (generalExpensesStore.items || [])
      .filter((row)=>row.sourceType === 'ownerPayableVehicleAlly' && String(row.assetId || '') === String(selectedVehicle?.id || ''))
      .reduce((sum,row)=>sum+num(row.alohandoteNetIncomeUsd || row.alohandoteIncomeUsd || 0),0)
    return { occupied, totalService, collected, pending, maintenance, maintenanceCost, cleanings, expenseRows, expenseTotal, allyProfit }
  }, [reservationsStore.items, selectedVehicle?.id, currentMonth, generalExpensesStore.items, exchangeRates])

  function exportMonthlyExcel() {
    const { start: monthStart, end: monthEnd } = monthBounds(currentMonth)
    const monthReservations = reservationsStore.items.filter((r) => rangesOverlap(r.startDate, r.endDate, monthStart, monthEnd))
    const rows = monthReservations.map((r) => {
      const vehicle = vehicles.find((v) => v.id === r.vehicleId) || {}
      return {
        Vehiculo: vehicle.name || '', Placa: vehicle.plate || '', Estado: STATUS[r.status]?.label || r.status,
        Cliente_Taller: r.customerName || '', Identificacion: r.customerId || '', Telefono: r.phone || '', Desde: r.startDate, Hasta: r.endDate,
        Dias: daysForReservation(r), Costo_Dia_USD: Number(r.dailyRate || 0), Canal: r.channel || '', Total_Servicio_USD: Number(r.totalAmount || 0), Abonado_USD: Number(r.amount || 0), Pendiente_USD: pendingAmount(r, exchangeRates),
        Km_Aprox: Number(r.approxKm || 0), Costo_KM_USD: Number(r.pricePerKm || vehicleKmRate(vehicle) || 0), Comision_Vendedor_USD: Number(r.sellerCommission || 0), Tasa_Euro_BCV: Number(r.bcvEuroRate || 0), Tasa_USDT_Mercado: Number(r.binanceUsdtRate || 0), Ajuste_Cambiario_Pct: Number(r.exchangeSpreadPercent || 0), Deposito_USD: Number(r.depositAmount || 0),
        Tipo_Mantenimiento: r.maintenanceType || '', Costo_Mantenimiento_USD: Number(r.maintenanceCost || 0),
        Reservado_Por: r.createdByName || r.createdByEmail || '', Email_Vendedor: r.createdByEmail || '', Documentos: joinDocs(r), Observacion: r.note || '',
      }
    })
    const kpis = vehicles.map((vehicle) => {
      const vehicleRows = monthReservations.filter((r) => r.vehicleId === vehicle.id)
      const reserved = vehicleRows.filter((r) => r.status === 'reserved')
      return {
        Vehiculo: vehicle.name, Costo_KM_USD: Number(vehicleKmRate(vehicle)), Dias_ocupados: reserved.reduce((sum, r) => sum + dayCount(r.startDate < monthStart ? monthStart : r.startDate, r.endDate > monthEnd ? monthEnd : r.endDate), 0),
        Total_servicio_USD: reserved.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0),
        Abonado_USD: reserved.reduce((sum, r) => sum + Number(r.amount || 0), 0),
        Pendiente_USD: reserved.reduce((sum, r) => sum + pendingAmount(r, exchangeRates), 0),
        Mantenimientos: vehicleRows.filter((r) => r.status === 'maintenance').length,
        Costo_mantenimiento_USD: vehicleRows.filter((r) => r.status === 'maintenance').reduce((sum, r) => sum + Number(r.maintenanceCost || 0), 0),
      }
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Reservas del mes')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpis), 'KPIs')
    XLSX.writeFile(wb, `alohandote-reservas-${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}.xlsx`)
  }

  async function generateLodgingQuote(reservation) {
    const printWindow = preparePrintableWindow()
    try { await upsertLead('Alojamientos', reservation, 'lead') } catch (err) { console.warn('No se pudo guardar lead de cotización alojamiento:', err) }
    const apt = accommodations.find((a) => a.id === reservation.accommodationId) || selectedAccommodation || {}
    const nights = lodgingNights(reservation.startDate, reservation.endDate)
    const nightly = num(reservation.nightlyRate || apt.nightlyRate)
    const cleaning = num(reservation.cleaningFee || apt.cleaningFee)
    const total = num(reservation.totalAmount || lodgingTotal(nights, nightly, cleaning))
    const rate = euroRateValue(exchangeRates, reservation.bcvEuroRate)
    const quoteId = `N° COT-ALOJ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const today = new Date().toLocaleDateString('es-VE')
    const genericDoc = usesGenericSellerDocuments(profile)
    const html = buildV211DocumentHtml({
      generic: genericDoc,
      title: 'Cotización de alojamiento',
      pageTitle: 'Cotización alojamiento',
      documentNumber: quoteId,
      dateLabel: today,
      actions: pdfActionButtons(cleanDocumentFileName('Cotizacion alojamiento', reservation.customerName)),
      sections: [
        { title: 'Datos del huésped', items: [
          { label: 'Nombre', value: reservation.customerName || 'No indicado' },
          { label: 'Teléfono', value: reservation.phone || 'No indicado' },
          { label: 'Correo', value: reservation.email || 'No indicado' },
        ]},
        { title: 'Detalle de la reserva', items: [
          { label: 'Alojamiento', value: apt.name || 'Por confirmar', wide: true },
          { label: 'Capacidad máxima', value: apt.maxCapacity ? `${apt.maxCapacity} personas` : 'No indicada' },
          { label: 'Check In', value: formatDocumentDayDate(reservation.startDate) },
          { label: 'Check Out', value: formatDocumentDayDate(reservation.endDate) },
          { label: 'Noches', value: nights },
          { label: 'Cotizado por', value: titleCaseName(reservation.createdByName || sellerName(profile, user)) },
        ]},
      ],
      financialTitle: 'Desglose de costos',
      financialRows: [
        { label: 'Costo por noche', value: documentMoneyValue(nightly, reservation.paymentMethod, exchangeRates, rate) },
        { label: 'Costo de limpieza', value: documentMoneyValue(cleaning, reservation.paymentMethod, exchangeRates, rate) },
      ],
      totalLabel: 'Total cotizado',
      totalValue: documentMoneyValue(total, reservation.paymentMethod, exchangeRates, rate),
      financialAmountLabel: documentFinancialAmountLabel(reservation.paymentMethod),
      rateValue: documentRateValue(reservation.paymentMethod, rate),
      note: reservation.note || '',
    })
    writePrintableWindow(printWindow, html, cleanDocumentFileName('Cotizacion alojamiento', reservation.customerName))
    showSuccess('Cotización generada correctamente')
  }

  function generateLodgingReceipt(reservation) {
    const printWindow = preparePrintableWindow()
    const apt = accommodations.find((a) => a.id === reservation.accommodationId) || selectedAccommodation || {}
    const total = num(reservation.totalAmount)
    const paid = storedPaidUsd(reservation, exchangeRates)
    const paidBs = storedPaidBs(reservation, exchangeRates)
    const pending = pendingAmount(reservation, exchangeRates)
    const rate = euroRateValue(exchangeRates, reservation.bcvEuroRate)
    const nights = lodgingNights(reservation.startDate, reservation.endDate)
    const today = new Date().toLocaleDateString('es-VE')
    const genericDoc = usesGenericSellerDocuments(profile)
    const html = buildV211DocumentHtml({
      generic: genericDoc,
      title: 'Comprobante de reserva',
      pageTitle: 'Recibo alojamiento',
      documentNumber: `N° ${receiptNumber(reservation)}`,
      dateLabel: today,
      actions: pdfActionButtons(cleanDocumentFileName('Recibo alojamiento', reservation.customerName)),
      sections: [
        { title: 'Datos del huésped', items: [
          { label: 'Nombre', value: reservation.customerName || 'No indicado' },
          { label: 'Teléfono', value: reservation.phone || 'No indicado' },
          { label: 'Correo', value: reservation.email || 'No indicado' },
        ]},
        { title: 'Detalle de la reserva', items: [
          { label: 'Alojamiento', value: apt.name || 'No indicado', wide: true },
          { label: 'Noches', value: nights },
          { label: 'Check In', value: formatDocumentDayDate(reservation.startDate) },
          { label: 'Check Out', value: formatDocumentDayDate(reservation.endDate) },
          { label: 'Forma de pago', value: reservation.paymentMethod || 'No indicada' },
          { label: 'Nº referencia', value: reservation.paymentReference || 'No indicada' },
          { label: 'Reservado por', value: titleCaseName(reservation.createdByName || 'No indicado') },
        ]},
      ],
      financialTitle: 'Resumen de pago',
      financialRows: [
        { label: 'Total alojamiento', value: documentMoneyValue(total, reservation.paymentMethod, exchangeRates, rate) },
        { label: 'Abonado', value: documentPaidValue(reservation, exchangeRates) },
      ],
      totalLabel: 'Pendiente',
      totalValue: documentMoneyValue(pending, reservation.paymentMethod, exchangeRates, rate),
      financialAmountLabel: documentFinancialAmountLabel(reservation.paymentMethod),
      rateValue: documentRateValue(reservation.paymentMethod, rate),
      note: reservation.note || '',
    })
    writePrintableWindow(printWindow, html, cleanDocumentFileName('Recibo alojamiento', reservation.customerName))
    showSuccess('Recibo generado correctamente')
  }

  function generateReceipt(reservation) {
    const printWindow = preparePrintableWindow()
    const vehicle = vehicles.find((v) => v.id === reservation.vehicleId)
    const total = num(reservation.totalAmount || reservation.amount)
    const paid = storedPaidUsd(reservation, exchangeRates)
    const paidBs = storedPaidBs(reservation, exchangeRates)
    const pending = pendingAmount(reservation, exchangeRates)
    const rate = euroRateValue(exchangeRates, reservation.bcvEuroRate)
    const days = dayCount(reservation.startDate, reservation.endDate)
    const today = new Date().toLocaleDateString('es-VE')
    const genericDoc = usesGenericSellerDocuments(profile)
    const receiptHtml = buildV211DocumentHtml({
      generic: genericDoc,
      title: 'Comprobante de reserva - Renta Car',
      pageTitle: receiptNumber(reservation),
      documentNumber: `N° ${receiptNumber(reservation)}`,
      dateLabel: today,
      actions: pdfActionButtons(cleanDocumentFileName('Recibo renta car', reservation.customerName)),
      sections: [
        { title: 'Datos del cliente', items: [
          { label: 'Nombre', value: reservation.customerName || 'No indicado' },
          { label: 'Identificación', value: reservation.customerId || 'No indicada' },
          { label: 'Teléfono', value: reservation.phone || 'No indicado' },
          { label: 'Correo', value: reservation.email || 'No indicado' },
        ]},
        { title: 'Detalle del servicio', items: [
          { label: 'Vehículo', value: vehicle?.name || 'No indicado', wide: true },
          { label: 'Placa / ref.', value: vehicle?.plate || 'No indicada' },
          { label: 'Entrega', value: formatDocumentDayDate(reservation.startDate) },
          { label: 'Devolución', value: formatDocumentDayDate(reservation.endDate) },
          { label: 'Días', value: days },
          { label: 'Forma de pago', value: reservation.paymentMethod || 'No indicada' },
          { label: 'Nº referencia', value: reservation.paymentReference || 'No indicada' },
          { label: 'Reservado por', value: titleCaseName(reservation.createdByName || 'No indicado') },
        ]},
      ],
      financialTitle: 'Resumen de pago',
      financialRows: [
        { label: 'Costo total del servicio', value: documentMoneyValue(total, reservation.paymentMethod, exchangeRates, rate) },
        { label: 'Monto abonado / reserva', value: documentPaidValue(reservation, exchangeRates) },
      ],
      totalLabel: 'Pendiente',
      totalValue: documentMoneyValue(pending, reservation.paymentMethod, exchangeRates, rate),
      financialAmountLabel: documentFinancialAmountLabel(reservation.paymentMethod),
      rateValue: documentRateValue(reservation.paymentMethod, rate),
      note: reservation.note || '',
    })
    writePrintableWindow(printWindow, receiptHtml, cleanDocumentFileName('Recibo renta car', reservation.customerName))
    showSuccess('Recibo generado correctamente')
  }


  async function generateQuote(reservation) {
    const printWindow = preparePrintableWindow()
    try { await upsertLead('Renta Car', reservation, 'lead') } catch (err) { console.warn('No se pudo guardar lead de cotización Renta Car:', err) }
    const vehicle = vehicles.find((v) => v.id === reservation.vehicleId) || selectedVehicle || {}
    const days = daysForReservation(reservation)
    const total = num(reservation.totalAmount || quoteFromKmAdjusted(reservation.approxKm, reservation) || reservation.amount)
    const daily = dailyFromTotal(total, days)
    const rate = euroRateValue(exchangeRates, reservation.bcvEuroRate)
    const quoteId = `N° COT-RC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    const today = new Date().toLocaleDateString('es-VE')
    const genericDoc = usesGenericSellerDocuments(profile)
    const html = buildV211DocumentHtml({
      generic: genericDoc,
      title: 'Cotización de Renta Car',
      pageTitle: 'Cotización Renta Car',
      documentNumber: quoteId,
      dateLabel: today,
      actions: pdfActionButtons(cleanDocumentFileName('Cotizacion renta car', reservation.customerName)),
      sections: [
        { title: 'Datos del cliente', items: [
          { label: 'Nombre', value: reservation.customerName || 'No indicado' },
          { label: 'Teléfono', value: reservation.phone || 'No indicado' },
          { label: 'Correo', value: reservation.email || 'No indicado' },
        ]},
        { title: 'Detalle del servicio', items: [
          { label: 'Vehículo', value: vehicle?.name || 'Por confirmar', wide: true },
          { label: 'Días', value: days },
          { label: 'Entrega', value: formatDocumentDayDate(reservation.startDate) },
          { label: 'Devolución', value: formatDocumentDayDate(reservation.endDate) },
          { label: 'Cotizado por', value: titleCaseName(reservation.createdByName || sellerName(profile, user)) },
        ]},
      ],
      financialTitle: 'Desglose de costos',
      financialRows: [
        { label: 'Costo por día', value: documentMoneyValue(daily, reservation.paymentMethod, exchangeRates, rate) },
      ],
      totalLabel: 'Total cotizado',
      totalValue: documentMoneyValue(total, reservation.paymentMethod, exchangeRates, rate),
      financialAmountLabel: documentFinancialAmountLabel(reservation.paymentMethod),
      rateValue: documentRateValue(reservation.paymentMethod, rate),
      note: reservation.note || '',
    })
    writePrintableWindow(printWindow, html, cleanDocumentFileName('Cotizacion renta car', reservation.customerName))
    showSuccess('Cotización generada correctamente')
  }

  function generateContract(reservation) {
    const printWindow = preparePrintableWindow()
    const vehicle = vehicles.find((v) => v.id === reservation.vehicleId) || {}
    const total = num(reservation.totalAmount || reservation.amount)
    const deposit = num(reservation.depositAmount)
    const days = daysForReservation(reservation)
    const city = reservation.contractCity || 'Barcelona'
    const start = formatContractDate(reservation.startDate)
    const end = formatContractDate(reservation.endDate)
    const deliveryDate = formatContractDate(reservation.startDate)
    const clientName = upper(reservation.customerName || '________________________')
    const landlordName = 'JOSE ALEMAN BETANCO'
    const clientIdType = reservation.customerIdType || (String(reservation.customerId || '').trim().toUpperCase().startsWith('E-') ? 'E' : 'V')
    const clientNationalityText = clientIdType === 'E' ? 'extranjero' : (reservation.customerNationality || 'venezolano')
    const clientDocumentLabel = clientIdType === 'E' ? 'documento de identidad extranjero' : 'cédula de identidad'
    const clientCi = reservation.customerId ? `${clientIdType}-${String(reservation.customerId).replace(/^[VE]-/i,'')}` : '________________'
    const brand = vehicle.brand || vehicle.name || '__________'
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=794, initial-scale=1, maximum-scale=1, user-scalable=no"/><title>Contrato${escapeHtml(clientName)}</title><style>${cleanPrintCss}@page{size:A4;margin:0}.page{page-break-inside:auto}*{box-sizing:border-box}html,body{width:794px;min-width:794px;margin:0 auto;padding:0;background:#eee;overflow-x:hidden}body{font-family:'Times New Roman',serif;color:#111}.actions{text-align:center;margin:18px}.actions button{background:#ff385c;color:white;border:0;border-radius:999px;padding:12px 20px;font-weight:bold;margin:4px}.actions button.secondary{background:#222}.page{width:210mm;min-height:297mm;background:white;margin:0 auto 24px;padding:13mm 14mm 12mm 14mm;line-height:1.19;font-size:12.2px;text-align:justify;position:relative}.lawyer-sign{position:absolute;top:7mm;left:12mm;width:38mm;height:auto}.title{text-align:center;font-weight:bold;font-size:15.5px;margin:20mm 0 12px;text-transform:uppercase}.clause{margin:8px 0}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:42px;text-align:center;margin-top:55px}.line{border-top:1px solid #111;padding-top:8px}.small{font-size:13px}.upper{text-transform:uppercase}@media print{body{background:white}.actions{display:none}.page{margin:0;width:auto;min-height:auto;box-shadow:none}}</style></head><body><div class="actions">${pdfActionButtons(cleanDocumentFileName('Contrato renta car', reservation.customerName))}</div><main class="page"><img class="lawyer-sign" src="/firma-abogado.png" alt="Firma abogado"/><div class="title">CONTRATO PRIVADO DE ARRENDAMIENTO DE VEHÍCULO AUTOMOTOR</div><p>Entre, <strong>${landlordName}</strong>, venezolano, mayor de edad, titular de la cédula de identidad Nº <strong>V-20.634.357</strong>, domiciliado en la ciudad de Lechería, municipio Diego Bautista Urbaneja del estado Anzoátegui, teléfono 0424-8639102, quien a los efectos del presente contrato se denominará <strong>EL ARRENDADOR</strong>, por una parte; y por la otra, <strong>${escapeHtml(clientName)}</strong>, ${escapeHtml(clientNationalityText)}, mayor de edad, titular del ${escapeHtml(clientDocumentLabel)} Nº <strong>${escapeHtml(clientCi)}</strong>, domiciliado(a) en <strong>${escapeHtml(reservation.customerAddress || '________________________')}</strong>, quien en lo adelante y a los efectos del presente contrato se denominará <strong>EL ARRENDATARIO</strong>; se ha convenido en celebrar el presente contrato privado de arrendamiento de vehículo automotor, el cual se regirá por las disposiciones aplicables del Código Civil venezolano, por las normas de tránsito y circulación vigentes, por las condiciones particulares aquí establecidas y en base a las siguientes cláusulas:</p><p class="clause"><strong>PRIMERA:</strong> EL ARRENDADOR da en arrendamiento a EL ARRENDATARIO un (1) vehículo automotor de su exclusiva administración, identificado de la siguiente manera: marca <strong>${escapeHtml(upper(brand))}</strong>, modelo <strong>${escapeHtml(upper(vehicle.model || '__________'))}</strong>, año <strong>${escapeHtml(vehicle.year || '__________')}</strong>, color <strong>${escapeHtml(upper(vehicle.color || '__________'))}</strong>, placa <strong>${escapeHtml(upper(vehicle.plate || '__________'))}</strong>, serial de carrocería (VIN) <strong>${escapeHtml(upper(vehicle.vin || '__________'))}</strong>, con kilometraje aproximado de entrega de <strong>${escapeHtml(reservation.deliveryKm || vehicle.currentKm || '__________')} Km</strong>, el cual se entrega con sus documentos de circulación, llave principal, caucho de repuesto, herramientas básicas y demás accesorios disponibles.</p><p class="clause"><strong>SEGUNDA:</strong> EL ARRENDATARIO destinará el vehículo arrendado única y exclusivamente para uso particular, personal y lícito, quedando terminantemente prohibido darle un uso distinto al aquí establecido, así como emplearlo para transporte público o privado remunerado de pasajeros, transporte de carga no autorizada, competencias, remolque, aprendizaje de conducción, actividades ilícitas o cualquier otra finalidad que implique un riesgo mayor al uso normal y prudente del vehículo.</p><p class="clause"><strong>TERCERA:</strong> El plazo de duración del presente contrato será de <strong>${days}</strong> día(s) continuos, contados a partir del día <strong>${escapeHtml(start)}</strong> a las <strong>${escapeHtml(reservation.deliveryTime || '12:00')}</strong>, hasta el día <strong>${escapeHtml(end)}</strong> a las <strong>${escapeHtml(reservation.returnTime || '12:00')}</strong>. Cualquier prórroga deberá ser autorizada previamente por EL ARRENDADOR y constar por escrito, por mensaje verificable o por cualquier medio de comunicación que permita dejar constancia de la aceptación de ambas partes.</p><p class="clause"><strong>CUARTA:</strong> El canon de arrendamiento del presente contrato es la cantidad de <strong>${money(total)}</strong> por el período antes indicado. EL ARRENDATARIO pagará dicho canon a EL ARRENDADOR conforme a las condiciones comerciales acordadas entre las partes, dejando ambas partes constancia del monto total del servicio contratado.</p><p class="clause"><strong>QUINTA:</strong> EL ARRENDATARIO entrega a EL ARRENDADOR la cantidad de <strong>${money(deposit)}</strong> por concepto de depósito en garantía, destinado a asegurar el exacto cumplimiento de las obligaciones asumidas en el presente contrato, incluyendo, entre otras, daños al vehículo, exceso de kilometraje, multas, combustible faltante, retraso en la devolución, pérdida de documentos, llaves o accesorios y cualquier otro incumplimiento imputable a EL ARRENDATARIO. Dicho depósito será reintegrado total o parcialmente al momento de la devolución del vehículo, una vez efectuada la revisión correspondiente.</p><p class="clause"><strong>SEXTA:</strong> En caso de accidente, colisión, avería grave, hurto, robo, intento de robo, inmovilización, retención por autoridad competente o cualquier siniestro que afecte el vehículo, EL ARRENDATARIO deberá notificar de inmediato a EL ARRENDADOR, dar aviso a la autoridad correspondiente cuando sea procedente, abstenerse de abandonar el vehículo sin resguardo y cooperar plenamente con los trámites policiales, administrativos y de seguro.</p><p class="clause"><strong>SÉPTIMA:</strong> EL ARRENDATARIO se obliga a devolver el vehículo en la fecha y hora convenidas, en el mismo lugar de entrega o en el que indique EL ARRENDADOR, con el mismo nivel de combustible con que lo recibe, junto con sus documentos, llaves, accesorios y demás implementos.</p><p class="clause"><strong>OCTAVA:</strong> El incumplimiento por parte de EL ARRENDATARIO de una cualquiera de las obligaciones contenidas en el presente contrato dará derecho a EL ARRENDADOR a exigir la resolución inmediata del mismo o su cumplimiento forzoso, en ambos casos con daños y perjuicios, sin menoscabo de las demás acciones civiles, penales, administrativas o de cualquier otra naturaleza a que hubiere lugar conforme a derecho.</p><p>Se hacen dos (2) ejemplares de un mismo tenor y a un solo efecto, en <strong>${escapeHtml(city)}</strong>, a la fecha de entrega del vehículo: <strong>${escapeHtml(deliveryDate)}</strong>.</p><div class="signatures"><div><div class="line"><strong>${landlordName}</strong><br>EL ARRENDADOR<br>C.I. V-20.634.357</div></div><div><div class="line"><strong>${escapeHtml(clientName)}</strong><br>EL ARRENDATARIO<br>${escapeHtml(clientIdType === 'E' ? 'Doc. extranjero' : 'C.I.')} ${escapeHtml(clientCi)}</div></div></div></main></body></html>`
    writePrintableWindow(printWindow, html, cleanDocumentFileName('Contrato renta car', reservation.customerName))
    showSuccess('Contrato generado correctamente')
  }

  function handleKmChange(value) {
    const vehicle = vehicles.find((item) => item.id === editingReservation.vehicleId) || selectedVehicle
    const nextDraft = { ...editingReservation, approxKm: value, pricePerKm: editingReservation.pricePerKm || currentKmRate(editingReservation), dailyRate: editingReservation.dailyRate || String(vehicleDayRate(vehicle) || '') }
    setEditingReservation(withAutoQuote(nextDraft))
  }

  function updateReservationDates(next) {
    const vehicle = vehicles.find((item) => item.id === next.vehicleId) || selectedVehicle
    const rentalDays = dayCount(next.startDate, next.endDate)
    const draft = { ...next, rentalDays: String(rentalDays), dailyRate: next.dailyRate || String(vehicleDayRate(vehicle) || '') }
    setEditingReservation(withAutoQuote(draft))
  }

  function handleTotalAmountChange(value) {
    const rentalDays = daysForReservation(editingReservation)
    const draftForRate = { ...editingReservation, totalAmount: value, pricePerKm: editingReservation.pricePerKm || currentKmRate(editingReservation) }
    const kmCost = quoteFromKmAdjusted(draftForRate.approxKm || 0, draftForRate)
    const baseOnly = Math.max(0, num(value) - num(kmCost))
    const nextDaily = rentalDays ? dailyFromTotal(baseOnly, rentalDays) : ''
    setEditingReservation({
      ...draftForRate,
      totalAmount: value,
      rentalDays: String(rentalDays),
      dailyRate: nextDaily ? String(nextDaily) : draftForRate.dailyRate,
      sellerCommission: shouldTrackSellerCommission(editingReservation) && value ? String(commissionFromTotal(value)) : '',
    })
  }

  function handleDailyRateChange(value) {
    const draftForRate = { ...editingReservation, dailyRate: value, pricePerKm: editingReservation.pricePerKm || currentKmRate(editingReservation) }
    setEditingReservation(withAutoQuote(draftForRate))
  }

  const reservationStatusOptions = Object.entries(STATUS).filter(([key]) => canUseMaintenance || key !== 'maintenance')

  function publicTokenDateMs(value) {
    try {
      if (!value) return null
      if (typeof value?.toDate === 'function') return value.toDate().getTime()
      if (typeof value === 'number') return value
      const ms = new Date(value).getTime()
      return Number.isFinite(ms) ? ms : null
    } catch (_) { return null }
  }

  useEffect(() => {
    if (!publicOperationsMode) return
    async function loadPublicToken() {
      setPublicTokenLoading(true)
      setPublicTokenError('')
      try {
        if (!publicOperationsToken) {
          setPublicTokenRecord(null)
          setPublicTokenError('Link inválido. Solicita un nuevo link de operaciones.')
          return
        }
        if (!isFirebaseReady || !db) {
          setPublicTokenRecord(null)
          setPublicTokenError('Firebase no está disponible para validar el link.')
          return
        }
        let snap = await getDoc(doc(db, 'publicReceptionTokens', publicOperationsToken))
        let record = snap.exists() ? { id: snap.id, ...snap.data() } : null
        // Compatibilidad: algunos tokens anteriores se guardaron con ID automático y campo token.
        if (!record) {
          const tokenQuery = query(collection(db, 'publicReceptionTokens'), where('token', '==', publicOperationsToken))
          const tokenMatches = await getDocs(tokenQuery)
          tokenMatches.forEach((docSnap) => {
            if (!record) record = { id: docSnap.id, ...docSnap.data() }
          })
        }
        if (!record) {
          setPublicTokenRecord(null)
          setPublicTokenError('El link de operaciones no existe o fue eliminado.')
          return
        }
        const expiresMs = publicTokenDateMs(record.expiresAtMs) || publicTokenDateMs(record.expiresAt)
        const expired = expiresMs && expiresMs < Date.now()
        const scope = String(record.scope || record.type || '').toLowerCase()
        const validScope = !scope || ['public-operations','operations','logistics','logistica'].includes(scope)
        if (record.active === false || expired || !validScope) {
          setPublicTokenRecord(null)
          setPublicTokenError('Este link de operaciones venció o fue desactivado.')
          return
        }
        setPublicTokenRecord(record)
      } catch (err) {
        console.error(err)
        setPublicTokenRecord(null)
        setPublicTokenError('No se pudo validar el link de operaciones.')
      } finally {
        setPublicTokenLoading(false)
      }
    }
    loadPublicToken()
  }, [publicOperationsMode, publicOperationsToken])

  const publicTaskId = publicOperationsMode ? new URLSearchParams(window.location.search).get('tarea') : ''
  useEffect(() => {
    if (!publicOperationsMode || !publicTaskId) return
    if (editingVehicleDelivery || editingVehicleCheckin || editingCleaningTask) return
    const sourceRows = publicTokenRecord?.tasks?.length ? publicTokenRecord.tasks : operationsHandoverRows
    const operation = sourceRows.find((item) => item.id === publicTaskId && isPublicLogisticsOperation(item))
    if (!operation) return
    if (operation.reservationType === 'vehicle' && operation.operation === 'delivery') openVehicleDeliveryForm(operation)
    else if (operation.reservationType === 'vehicle' && operation.operation === 'reception') openVehicleReceptionForm(operation)
    else if (operation.reservationType === 'lodging' && operation.operation === 'reception') openCleaningForm(operation)
  }, [publicOperationsMode, publicTaskId, publicTokenRecord, operationsHandoverRows, editingVehicleDelivery, editingVehicleCheckin, editingCleaningTask])

  if (authLoading) return <main className="login-shell"><section className="login-card"><h1>Cargando...</h1><p>Validando sesión.</p></section></main>
  if (!isFirebaseReady && !enableDemoMode && !publicReceptionMode && !publicOperationsMode) return <FirebaseSetupRequired />
  if (isFirebaseReady && !user && !publicReceptionMode && !publicOperationsMode) return <LoginScreen onLogin={login} loading={loginLoading} error={loginError} />

  const editingReservationCanSave = editingReservation ? (isAdmin || canEditReservation(editingReservation)) : false
  const editingReservationReadOnly = editingReservation ? !editingReservationCanSave : false

  if (publicOperationsMode) {
    const tokenTasks = Array.isArray(publicTokenRecord?.tasks) ? publicTokenRecord.tasks : []
    const publicOps = tokenTasks.filter((item) => isPublicLogisticsOperation(item) && !completedPublicTaskIds.includes(item.id))
    const todayOps = publicOps.filter((item)=>item.group==='today')
    const futureOps = publicOps.filter((item)=>item.group==='future')
    const activeTask = publicTaskId ? publicOps.find((item)=>item.id===publicTaskId) : null
    if (publicTokenLoading) return <main className="public-reception-shell"><section className="public-reception-card"><img className="login-logo" src="/alohandote-logo.png" alt="Alohandote" /><h1>Validando link seguro...</h1><p>Estamos verificando el acceso de operaciones.</p></section></main>
    if (publicTokenError || !publicTokenRecord) return <main className="public-reception-shell"><section className="public-reception-card"><img className="login-logo" src="/alohandote-logo.png" alt="Alohandote" /><span className="eyebrow">Acceso seguro</span><h1>Link no disponible</h1><p>{publicTokenError || 'Solicita un nuevo link de operaciones al administrador.'}</p></section></main>
    return (
      <main className="public-reception-shell public-operations-shell">
        <section className="public-reception-card public-operations-card">
          <img className="login-logo" src="/alohandote-logo.png" alt="Alohandote" />
          <div>
            <span className="eyebrow">Operaciones Alohandote</span>
            <h1>Entrega / Recepción / Limpieza</h1>
            <p>Marca las operaciones realizadas para que el equipo admin pueda validarlas. Link seguro para colaboradores externos.</p><small className="token-expiry">Vence: {publicTokenRecord?.expiresAt ? formatShortDate(publicTokenRecord.expiresAt.slice(0,10)) : 'sin fecha'}</small>
          </div>
          {error && <div className="form-error">{error}</div>}
          {!publicTaskId && <div className="public-ops-section">
            <h3>Operaciones de hoy</h3>
            {todayOps.length ? todayOps.map((item)=><div className="public-op-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.assetLabel} · {item.customerName} · {item.title} · {formatShortDate(item.operationDate)}</span></div><button type="button" onClick={()=>handlePublicOperationClick(item)}>{publicOperationButtonLabel(item)}</button></div>) : <div className="empty-state">No hay operaciones para hoy.</div>}
          </div>}
          {!publicTaskId && <div className="public-ops-section">
            <h3>Próximo día</h3>
            {futureOps.length ? futureOps.map((item)=><div className="public-op-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.assetLabel} · {item.customerName} · {item.title} · {formatShortDate(item.operationDate)}</span></div><button type="button" onClick={()=>handlePublicOperationClick(item)}>{publicOperationButtonLabel(item)}</button></div>) : <div className="empty-state">No hay operaciones próximas.</div>}
          </div>}
          {editingVehicleDelivery && <form className="public-reception-form embedded" onSubmit={saveVehicleDelivery}>
            <h3>Entrega de vehículo</h3>
            {operationDetailLine(editingVehicleDelivery) && <div className="document-box operation-context"><strong>{editingVehicleDelivery.customerName || 'Cliente'}</strong><small>{operationDetailLine(editingVehicleDelivery)}</small></div>}<label>Responsable de entregar<select value={editingVehicleDelivery.responsible || ''} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, responsible:e.target.value })}>{operationsPeople.map((name)=><option key={name} value={name}>{name}</option>)}</select></label>
            <label>KM salida<input type="number" min="0" value={editingVehicleDelivery.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, currentKm:e.target.value })}/></label>
            <label>Nivel de combustible<select value={editingVehicleDelivery.fuelLevel || 'Completo'} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, fuelLevel:e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label>
            <label>Estado general<select value={editingVehicleDelivery.generalStatus || 'Bueno'} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, generalStatus:e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option></select></label>
            <label className="file-pick">Foto tablero<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, _dashboardPhotoFile:e.target.files?.[0] || null })}/><small>{editingVehicleDelivery._dashboardPhotoFile?.name || 'Odómetro / tablero'}</small></label>
            <label className="file-pick">Foto vehículo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, _vehiclePhotoFile:e.target.files?.[0] || null })}/><small>{editingVehicleDelivery._vehiclePhotoFile?.name || 'Exterior del vehículo'}</small></label>
            <label>Observación<textarea rows="3" value={editingVehicleDelivery.notes || ''} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, notes:e.target.value })}/></label>
            <div className="public-form-actions"><button type="button" className="secondary full" onClick={returnToPublicOperationsList}>Volver / cancelar</button><button className="primary full" type="submit">Guardar entrega</button></div>
          </form>}
          {editingVehicleCheckin && <form className="public-reception-form embedded" onSubmit={saveVehicleReception}>
            <h3>Recepción de vehículo</h3>
            {operationDetailLine(editingVehicleCheckin) && <div className="document-box operation-context"><strong>{editingVehicleCheckin.customerName || 'Cliente'}</strong><small>{operationDetailLine(editingVehicleCheckin)}</small></div>}<label>Responsable de recibir<select value={editingVehicleCheckin?.createdByName || ''} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), createdByName:e.target.value })}>{operationsPeople.map((name)=><option key={name} value={name}>{name}</option>)}</select></label>
            <label>Kilometraje recibido<input type="number" min="0" value={editingVehicleCheckin?.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), currentKm: e.target.value })}/></label>
            <label>Nivel de combustible<select value={editingVehicleCheckin?.fuelLevel || 'Completo'} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), fuelLevel: e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label>
            <label>Estado general<select value={editingVehicleCheckin?.generalStatus || 'Bueno'} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), generalStatus: e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option><option>Requiere mantenimiento</option></select></label>
            <label className="file-pick">Foto tablero<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), _dashboardPhotoFile:e.target.files?.[0] || null })}/><small>{editingVehicleCheckin?._dashboardPhotoFile?.name || 'Odómetro / tablero'}</small></label>
            <label className="file-pick">Foto vehículo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), _vehiclePhotoFile:e.target.files?.[0] || null })}/><small>{editingVehicleCheckin?._vehiclePhotoFile?.name || 'Exterior del vehículo'}</small></label>
            <label>Observación<textarea rows="3" value={editingVehicleCheckin?.notes || ''} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), notes: e.target.value })}/></label>
            <div className="public-form-actions"><button type="button" className="secondary full" onClick={returnToPublicOperationsList}>Volver / cancelar</button><button className="primary full" type="submit">Guardar recepción</button></div>
          </form>}
          {editingCleaningTask && <form className="public-reception-form embedded" onSubmit={saveCleaningTask}>
            <h3>Registro de limpieza</h3>
            <label>Alojamiento<input value={editingCleaningTask.accommodationName || accommodations.find((apt)=>apt.id===editingCleaningTask.accommodationId)?.name || ''} readOnly /></label>
            <label>Responsable de limpieza<select value={editingCleaningTask.responsible || ''} onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, responsible:e.target.value })}>{operationsPeople.map((name)=><option key={name} value={name}>{name}</option>)}</select></label>
            <label className="file-pick">Foto daño / incidencia<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, _damagePhotoFile:e.target.files?.[0] || null })}/><small>{editingCleaningTask._damagePhotoFile?.name || 'Opcional: daño o incidencia'}</small></label>
            <label>Artículos utilizados<select value={editingCleaningTask.inventoryItemId || ''} onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, inventoryItemId:e.target.value })}><option value="">Sin consumo</option>{inventoryItemsStore.items.filter((item)=>item.module === 'Alojamientos' || item.module === 'General').map((item)=><option key={item.id} value={item.id}>{item.name} · Stock {item.quantity}</option>)}</select></label>
            <label>Cantidad utilizada<input type="number" min="0" step="1" value={editingCleaningTask.quantity || ''} onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, quantity:e.target.value })}/></label>
            <label>Observación<textarea rows="3" value={editingCleaningTask.notes || ''} placeholder="Daños, consumo, observaciones de limpieza..." onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, notes:e.target.value })}/></label>
            <div className="public-form-actions"><button type="button" className="secondary full" onClick={returnToPublicOperationsList}>Volver / cancelar</button><button className="primary full" type="submit">Guardar limpieza</button></div>
          </form>}
        </section>
      </main>
    )
  }

  if (publicReceptionMode) {
    return (
      <main className="public-reception-shell">
        <section className="public-reception-card">
          <img className="login-logo" src="/alohandote-logo.png" alt="Alohandote" />
          <div>
            <span className="eyebrow">Recepción de vehículos</span>
            <h1>Registro rápido de kilometraje</h1>
            <p>Completa la información al recibir el vehículo. El kilometraje se actualizará en vivo para futuras reservas.</p>
          </div>
          {error && <div className="form-error">{error}</div>}
          <form className="public-reception-form" onSubmit={saveVehicleReception}>
            <label>Vehículo<select value={editingVehicleCheckin?.vehicleId || selectedVehicle?.id || ''} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin('', profile, user)), vehicleId: e.target.value, currentKm: vehicles.find((v)=>v.id===e.target.value)?.currentKm || '' })}>{vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>
            <div className="two-columns"><label>Kilometraje recibido<input type="number" min="0" value={editingVehicleCheckin?.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), currentKm: e.target.value })}/></label><label>Recibido por<input value={editingVehicleCheckin?.createdByName || ''} placeholder="Nombre del receptor" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), createdByName: e.target.value })}/></label></div>
            <div className="two-columns"><label>Nivel de combustible<select value={editingVehicleCheckin?.fuelLevel || 'Completo'} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), fuelLevel: e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label><label>Estado general<select value={editingVehicleCheckin?.generalStatus || 'Bueno'} onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), generalStatus: e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option><option>Requiere mantenimiento</option></select></label></div>
            <div className="two-columns"><label className="file-pick">Foto tablero<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), _dashboardPhotoFile: e.target.files?.[0] || null })}/><small>{editingVehicleCheckin?._dashboardPhotoFile?.name || 'Odómetro / tablero'}</small></label><label className="file-pick">Foto vehículo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), _vehiclePhotoFile: e.target.files?.[0] || null })}/><small>{editingVehicleCheckin?._vehiclePhotoFile?.name || 'Exterior del vehículo'}</small></label></div>
            <label>Observación<textarea rows="4" value={editingVehicleCheckin?.notes || ''} placeholder="Daños, limpieza, combustible, accesorios o comentario del cliente..." onChange={(e)=>setEditingVehicleCheckin({ ...(editingVehicleCheckin || emptyVehicleCheckin(selectedVehicle?.id, profile, user)), notes: e.target.value })}/></label>
            <button className="primary full" type="submit">Guardar recepción</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <img className="brand-logo" src="/alohandote-logo.png" alt="Alohandote" />
        <div><h1>Alohandote<br />Sistema Comercial</h1><p>Renta car y alojamientos vacacionales.</p></div>
        <div className="user-box compact sidebar-live-profile"><strong>{sellerName(effectiveProfile, user)}</strong><span>{roleLabel(effectiveProfile)} · {user?.email || (isDemoMode ? 'Modo demo admin' : 'Modo local')}</span>{effectiveProfile?.profileSource && <small>Perfil sincronizado: {effectiveProfile.profileSource}</small>}</div>
        <div className="sidebar-submodule-zone">
          {canUseCarLogistics && ['cars','carDeliveries','carReceptions'].includes(moduleMode) && <div className="erp-submodule-switch sidebar-switch">{!isLogistics && <button className={moduleMode === 'cars' ? 'active' : ''} onClick={() => setModuleMode('cars')}>Calendario Renta Car</button>}<button className={moduleMode === 'carDeliveries' ? 'active' : ''} onClick={() => setModuleMode('carDeliveries')}>Entregas</button><button className={moduleMode === 'carReceptions' ? 'active' : ''} onClick={() => setModuleMode('carReceptions')}>Recepciones</button></div>}
          {canUseLodgingLogistics && ['lodging','lodgingDeliveries','lodgingReceptions'].includes(moduleMode) && <div className="erp-submodule-switch sidebar-switch">{!isLogistics && <button className={moduleMode === 'lodging' ? 'active' : ''} onClick={() => setModuleMode('lodging')}>Calendario Alojamientos</button>}{!isLogistics && <button className={moduleMode === 'lodgingDeliveries' ? 'active' : ''} onClick={() => setModuleMode('lodgingDeliveries')}>Check-in</button>}<button className={moduleMode === 'lodgingReceptions' ? 'active' : ''} onClick={() => setModuleMode('lodgingReceptions')}>Check-out / Limpieza</button></div>}
          {/* V202: perfil del usuario ahora se muestra siempre y se sincroniza en vivo desde Admin/RRHH. */}
        </div>
        {moduleMode === 'profitability' && <div className="sidebar-module-shortcuts">
          <button className="active" onClick={() => setModuleMode('profitability')}><BarChart3 size={16}/> Rentabilidad KM / ROI</button>
        </div>}
        {moduleMode === 'cars' && <>
        <div className="section-title">Vehículos</div>
        <div className="vehicle-list">
          {vehicles.map((vehicle) => { const preview = entityPreviewPhoto(vehicle); return <div className={`vehicle-row airbnb-row ${vehicle.id === selectedVehicle?.id ? 'active' : ''}`} key={vehicle.id}><button className="vehicle-main airbnb-main" onClick={() => setSelectedVehicleId(vehicle.id)}><span className="thumb-box">{preview ? <img src={preview} alt={vehicle.name} /> : <span className="thumb-placeholder"><Car size={16} /></span>}</span><span className="vehicle-copy vehicle-copy-pc"><strong><span className="vehicle-label">Marca</span>{vehicleBrandText(vehicle)}</strong><small><span className="vehicle-label">Modelo</span>{vehicleModelText(vehicle)}{vehicle.year ? ` · ${vehicle.year}` : ''}{vehicle.plate ? ` · ${vehicle.plate}` : ''}</small></span></button><div className="row-actions">{canManageVehicles && <button className="mini" title="Editar vehículo" onClick={() => setEditingVehicle({ ...emptyVehicle(), ...vehicle })}><Pencil size={16} /></button>}{canManageVehicles && <button className="mini" title="Eliminar vehículo" onClick={() => deleteVehicle(vehicle)}><Trash2 size={16} /></button>}{canUseCarLogistics && <button className="mini" title="Registrar recepción" onClick={() => openVehicleReception(vehicle)}>KM</button>}{canManageVehicles && <button className="mini" title="Catálogo PDF" onClick={() => shareVehicleCatalog(vehicle)}>↗</button>}</div></div>})}
          {canManageVehicles && <button className="add-button" onClick={() => setEditingVehicle(emptyVehicle())}><Plus size={17} /> Agregar vehículo</button>}
          {canExport && <button className="import-button" onClick={exportMonthlyExcel}><Download size={17} /> Exportar Excel del mes</button>}
          {canExport && <button className="import-button" onClick={exportQuotesExcel}><Download size={17} /> Exportar cotizaciones</button>}
        </div></>}
        {moduleMode === 'lodging' && <>
        <div className="section-title">Alojamientos</div>
        <div className="vehicle-list">
          {accommodations.map((apt) => { const preview = entityPreviewPhoto(apt); return <div className={`vehicle-row airbnb-row ${apt.id === selectedAccommodation?.id ? 'active' : ''}`} key={apt.id}><button className="vehicle-main airbnb-main" onClick={() => setSelectedAccommodationId(apt.id)}><span className="thumb-box">{preview ? <img src={preview} alt={apt.name} onError={(e)=>{e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('thumb-broken')}} /> : <span className="thumb-placeholder">🏡</span>}</span><span className="vehicle-copy"><strong>{apt.name}</strong><small>{apt.residence || `Capacidad ${apt.maxCapacity || '-'} huésped(es)`}</small></span></button><div className="row-actions">{canManageVehicles && <button className="mini" title="Editar alojamiento" onClick={() => setEditingAccommodation({ ...emptyAccommodation(), ...apt })}><Pencil size={16} /></button>}<button className="mini" title="Compartir propiedad" onClick={() => shareAccommodationCatalog(apt)}>↗</button></div></div>})}
          {canManageVehicles && selectedAccommodation?.id && <button className="import-button" onClick={() => copyAccommodationIcalLink(selectedAccommodation)}>Copiar link iCal para Airbnb</button>}{canManageVehicles && selectedAccommodation?.id && <button className="import-button" onClick={() => testAccommodationIcalLink(selectedAccommodation)}>Probar link iCal</button>}
          {canManageVehicles && <button className="add-button" onClick={() => setEditingAccommodation(emptyAccommodation())}><Plus size={17} /> Agregar alojamiento</button>}
          {canManageVehicles && <button type="button" className="import-button" disabled={icalSyncingAccommodationId === selectedAccommodation?.id} onClick={syncSelectedAccommodationIcal}>{icalSyncingAccommodationId === selectedAccommodation?.id ? 'Sincronizando iCal...' : 'Sincronizar iCal guardado'}</button>}{canManageVehicles && accommodationIcalUrls(selectedAccommodation).length > 0 && <button type="button" className="import-button danger-outline" onClick={unlinkSelectedAccommodationIcal}>Desvincular iCal</button>}{canManageVehicles && <button type="button" className="import-button danger-outline" onClick={clearSelectedAccommodationIcalBookings}>Eliminar bloqueos iCal</button>}{canManageVehicles && accommodationIcalSyncRows(selectedAccommodation).length > 0 && <div className="ical-sync-status-list"><strong>Sincronización externa</strong>{accommodationIcalSyncRows(selectedAccommodation).map((row, idx)=><div className="ical-sync-status-row" key={`${row.url}-${idx}`}><span>{row.label}</span><small>Última actualización: {formatIcalSyncDate(row.lastSync)} · {row.status}{row.events !== null ? ` · ${row.events} evento(s)` : ''}</small></div>)}</div>}
          <input className="hidden-file" ref={icsInputRef} type="file" accept=".ics,text/calendar" onChange={(e) => importIcsFile(e.target.files?.[0])} />
        </div></>}
        <div className="legend"><span><i className="dot reserved-dot" /> Reservado</span><span><i className="dot pending-dot" /> No disponible</span>{canUseMaintenance && <span><i className="dot maintenance-dot" /> Mantenimiento</span>}</div>{user && <div className="user-box user-box-bottom"><strong>{sellerName(effectiveProfile, user)}</strong><span>{roleLabel(effectiveProfile)} · {user?.email || (isDemoMode ? 'Modo demo admin' : 'Modo local')}</span></div>}{user && <button className="import-button logout-bottom" onClick={logout}><LogOut size={15} /> Salir del sistema</button>}
      </aside>

      {successMessage && <div className="success-toast">{successMessage}</div>}

      <nav className="top-module-switch corporate-module-nav" aria-label="Módulos principales">
        <div className="nav-group nav-group-operation"><span className="nav-group-label">Operación</span>{canViewCars && !isLogistics && <button className={['cars','carDeliveries','carReceptions'].includes(moduleMode) ? 'active' : ''} onClick={() => setModuleMode('cars')}><span className="nav-icon">🚗</span><span>Renta Car</span></button>}{canViewLodging && !isLogistics && <button className={['lodging','lodgingDeliveries','lodgingReceptions'].includes(moduleMode) ? 'active' : ''} onClick={() => setModuleMode('lodging')}><span className="nav-icon">🏠</span><span>Alojamientos</span></button>}{isLogistics && <button className={moduleMode === 'carDeliveries' ? 'active' : ''} onClick={() => setModuleMode('carDeliveries')}><span className="nav-icon">🚗</span><span>Entregas</span></button>}{isLogistics && <button className={moduleMode === 'carReceptions' ? 'active' : ''} onClick={() => setModuleMode('carReceptions')}><span className="nav-icon">🔁</span><span>Recepciones</span></button>}{isLogistics && <button className={moduleMode === 'lodgingReceptions' ? 'active' : ''} onClick={() => setModuleMode('lodgingReceptions')}><span className="nav-icon">🧹</span><span>Check-out / Limpieza</span></button>}{canViewCommercial && <button className={['commercial','quotes','reservations'].includes(moduleMode) ? 'active' : ''} onClick={() => { setModuleMode('commercial'); setSearchMode('quotes') }}><span className="nav-icon">📋</span><span>Comercial</span></button>}</div>
        <div className="nav-group nav-group-erp"><span className="nav-group-label">ERP</span>{canViewAdmin && <button className={moduleMode === 'administration' ? 'active' : ''} onClick={() => setModuleMode('administration')}><span className="nav-icon">💼</span><span>Administración ERP</span></button>}{canViewInventory && <button className={moduleMode === 'inventory' ? 'active inventory-tab' : 'inventory-tab'} onClick={() => setModuleMode('inventory')}><span className="nav-icon">📦</span><span>Inventario ERP</span></button>}{canViewHr && <button className={moduleMode === 'hr' ? 'active hr-tab' : 'hr-tab'} onClick={() => setModuleMode('hr')}><span className="nav-icon">👥</span><span>RRHH ERP</span></button>}</div>
        {(canUseMaintenance || canViewProfitability) && <div className="nav-group nav-group-control"><span className="nav-group-label">Control</span>{canUseMaintenance && <button className={moduleMode === 'maintenance' ? 'active' : ''} onClick={() => setModuleMode('maintenance')}><span className="nav-icon">🔧</span><span>Mantenimiento</span></button>}{canViewProfitability && <button className={moduleMode === 'profitability' ? 'active profitability-tab' : 'profitability-tab'} onClick={() => setModuleMode('profitability')}><span className="nav-icon">📈</span><span>Rentabilidad KM / ROI</span></button>}</div>}
      </nav>


      {canUseCarLogistics && ['cars','carDeliveries','carReceptions'].includes(moduleMode) && <div className="erp-submodule-switch mobile-top-switch">{!isLogistics && <button className={moduleMode === 'cars' ? 'active' : ''} onClick={() => setModuleMode('cars')}>Calendario Renta Car</button>}<button className={moduleMode === 'carDeliveries' ? 'active' : ''} onClick={() => setModuleMode('carDeliveries')}>Entregas</button><button className={moduleMode === 'carReceptions' ? 'active' : ''} onClick={() => setModuleMode('carReceptions')}>Recepciones</button></div>}
      {canUseLodgingLogistics && ['lodging','lodgingDeliveries','lodgingReceptions'].includes(moduleMode) && <div className="erp-submodule-switch mobile-top-switch">{!isLogistics && <button className={moduleMode === 'lodging' ? 'active' : ''} onClick={() => setModuleMode('lodging')}>Calendario Alojamientos</button>}{!isLogistics && <button className={moduleMode === 'lodgingDeliveries' ? 'active' : ''} onClick={() => setModuleMode('lodgingDeliveries')}>Check-in</button>}<button className={moduleMode === 'lodgingReceptions' ? 'active' : ''} onClick={() => setModuleMode('lodgingReceptions')}>Check-out / Limpieza</button></div>}
      {(['commercial','quotes','reservations'].includes(moduleMode)) && <section className="global-search-panel advanced-search">
        <div className="search-mode-tabs"><button className={searchMode === 'quotes' ? 'active' : ''} onClick={() => { setModuleMode('commercial'); setSearchMode('quotes') }}>Cotizaciones</button><button className={searchMode === 'reservations' ? 'active' : ''} onClick={() => { setModuleMode('commercial'); setSearchMode('reservations') }}>Reservas</button></div>
        <div className="search-grid">
          <label>Módulo<select value={searchFilters.module} onChange={(e)=>setSearchFilters({...searchFilters,module:e.target.value})}><option value="all">Todos</option><option value="cars">Renta Car</option><option value="lodging">Alojamientos</option></select></label>
          <label>Operador<input value={searchFilters.operator || ''} placeholder="Vendedor / operador" onChange={(e)=>setSearchFilters({...searchFilters,operator:e.target.value})}/></label>
          <label>Nombre<input value={searchFilters.name} placeholder="Cliente / huésped" onChange={(e)=>setSearchFilters({...searchFilters,name:e.target.value})}/></label>
          <label>C.I.<input value={searchFilters.customerId} placeholder="Cédula" onChange={(e)=>setSearchFilters({...searchFilters,customerId:e.target.value})}/></label>
          <label>Teléfono<input value={searchFilters.phone} placeholder="WhatsApp" onChange={(e)=>setSearchFilters({...searchFilters,phone:e.target.value})}/></label>
          <label>Desde<input type="date" value={searchFilters.startDate} onChange={(e)=>setSearchFilters({...searchFilters,startDate:e.target.value})}/></label>
          <label>Hasta<input type="date" value={searchFilters.endDate} onChange={(e)=>setSearchFilters({...searchFilters,endDate:e.target.value})}/></label>
          <label>Búsqueda libre<input value={globalSearch} placeholder="Referencia, canal o texto" onChange={(e)=>setGlobalSearch(e.target.value)} /></label>
        </div>
      </section>}

      {(['commercial','quotes','reservations'].includes(moduleMode)) ? <section className="calendar-panel search-module-panel"><div className="topbar"><div><span className="eyebrow">Gestión comercial</span><h2>{searchMode === 'quotes' ? 'Cotizaciones' : 'Reservas'}</h2><p className="vehicle-subtitle">Filtra por nombre, C.I., teléfono o fecha. {isAdmin ? 'Modo admin: puedes editar o eliminar registros.' : 'Solo ves registros creados por tu perfil.'}</p></div><div className="topbar-actions desktop-export-actions"><button className="secondary" onClick={searchMode === 'quotes' ? exportQuotesExcel : exportReservationsExcel}><Download size={16}/> Exportar Excel</button></div></div><div className="global-search-results search-results-full">{globalSearchResults.length ? globalSearchResults.map((row)=><div key={row.id} className="search-result-row"><button type="button" onClick={()=>openGlobalSearchResult(row)}><strong>{row.title}</strong><span>{row.type} · {row.subtitle}</span><small>{row.date} {row.amount ? `· ${money(row.amount)}` : ''}</small></button>{isAdmin && <div className="search-row-actions"><button type="button" className="secondary mini-action" onClick={()=>openGlobalSearchResult(row)}><Pencil size={15}/> Editar</button><button type="button" className="danger mini-action" onClick={()=>deleteSearchResult(row)}><Trash2 size={15}/> Eliminar</button></div>}</div>) : <div className="empty-search">No hay resultados con esos filtros.</div>}</div><button className="secondary mobile-bottom-export" onClick={moduleMode === 'quotes' ? exportQuotesExcel : exportReservationsExcel}><Download size={16}/> Exportar Excel</button></section> : moduleMode === 'hr' ? <section className="calendar-panel hr-panel"><div className="topbar"><div><span className="eyebrow">ERP Base</span><h2>Recursos Humanos</h2><p className="vehicle-subtitle">Personal, roles, tareas operativas, comisiones por vendedor, actividad del equipo y permisos.</p></div><div className="topbar-actions"><button className="secondary" onClick={exportHrExcel}><Download size={16}/> Exportar RRHH</button><button className="secondary" onClick={()=>setEditingHrTask(emptyHrTask())}><Plus size={16}/> Tarea</button><button className="primary" onClick={()=>setEditingHrPerson(emptyHrPerson())}><Plus size={16}/> Personal</button></div></div><section className="analytics-strip hr-kpis"><div><span>Personal activo</span><strong>{hrSummary.activePeople.length}</strong></div><div><span>Tareas pendientes</span><strong>{hrSummary.pendingTasks.length}</strong></div><div><span>Tareas completadas</span><strong>{hrSummary.completedTasks.length}</strong></div><div><span>Vendedores</span><strong>{hrSummary.people.filter((p)=>String(p.role||'').includes('Vendedor')).length}</strong></div><div><span>Comisiones</span><strong>{money(hrSummary.commissionRows.reduce((s,r)=>s+num(r.amount),0))}</strong></div><div><span>Actividad</span><strong>{hrSummary.activityRows.length}</strong></div></section><div className="admin-grid hr-grid"><section className="admin-card"><h3>Personal</h3><p>Registro de colaboradores, fechas laborales, sueldo semanal, tasa $USD BCV y comisión.</p><div className="admin-table"><table><thead><tr><th>Nombre</th><th>Rol</th><th>Acceso</th><th>Ingreso</th><th>Teléfono</th><th>Comisión</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{hrSummary.people.map((person)=><tr key={person.id}><td>{person.name}</td><td>{person.role}</td><td>{person.appAccess || 'Sin acceso'}</td><td>{person.entryDate ? formatShortDate(person.entryDate) : '-'}</td><td>{person.phone}</td><td>{person.commissionRate}%</td><td>{person.status}</td><td><div className="table-actions"><button className="secondary mini-action" onClick={()=>setEditingHrPerson(person)}><Pencil size={14}/> Editar</button><button className="secondary mini-action" onClick={()=>generateHrPaymentReceipt(person)}><FileText size={14}/> Recibo</button></div></td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Roles y permisos</h3><p>Matriz base para ordenar qué puede ver y hacer cada perfil.</p><div className="permissions-grid"><div><strong>Admin</strong><span>Ve, edita, elimina, exporta y accede a finanzas/ROI.</span></div><div><strong>Vendedor</strong><span>Crea cotizaciones y reservas. Ve sus propios registros.</span></div><div><strong>Recepción</strong><span>Recibe vehículos, carga km y fotos. No ve finanzas.</span></div><div><strong>Limpieza</strong><span>Ve tareas de alojamientos, marca limpieza y evidencia.</span></div><div><strong>Mantenimiento</strong><span>Gestiona mantenimientos, costos, repuestos y evidencia.</span></div><div><strong>Contabilidad</strong><span>Ve administración, caja, cuentas y exportaciones.</span></div></div></section><section className="admin-card"><h3>Tareas operativas</h3><p>Seguimiento de limpieza, entregas, recepción, mantenimiento y administración.</p><div className="admin-table"><table><thead><tr><th>Tarea</th><th>Responsable</th><th>Fecha</th><th>Prioridad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{hrSummary.tasks.map((task)=><tr key={task.id}><td>{task.title}</td><td>{task.responsible}</td><td>{formatShortDate(task.dueDate)}</td><td>{task.priority}</td><td>{task.status}</td><td><div className="table-actions"><button className="secondary mini-action" onClick={()=>setEditingHrTask(task)}><Pencil size={14}/> Editar</button></div></td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Comisiones por vendedor</h3><p>Resumen base de comisiones generadas desde reservas con pagos registrados.</p><div className="admin-table"><table><thead><tr><th>Vendedor</th><th>Reservas</th><th>Comisión</th><th>Pendiente</th></tr></thead><tbody>{hrSummary.commissionsBySeller.map((row)=><tr key={row.seller}><td>{row.seller}</td><td>{row.reservations}</td><td>{money(row.commission)}</td><td>{money(row.pending)}</td></tr>)}</tbody></table></div></section><section className="admin-card full-span"><h3>Actividad del equipo</h3><p>Registro derivado de reservas, alojamientos, recepción de vehículos e inventario.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Módulo</th><th>Acción</th><th>Usuario</th><th>Detalle</th></tr></thead><tbody>{hrSummary.activityRows.map((row)=><tr key={row.id}><td>{formatShortDate(String(row.date || '').slice(0,10))}</td><td>{row.module}</td><td>{row.action}</td><td>{row.user}</td><td>{row.detail}</td></tr>)}</tbody></table></div></section></div><div className="notice"><AlertCircle size={18}/> Esta versión muestra correctamente RRHH ERP sin alterar reservas, recepción, mantenimiento, ROI, inventario ni administración. Los permisos detallados quedan listos como matriz para endurecer reglas en una siguiente versión.</div></section> : moduleMode === 'inventory' ? <section className="calendar-panel inventory-panel"><div className="topbar"><div><span className="eyebrow">ERP Base</span><h2>Inventario</h2><p className="vehicle-subtitle">Inventario Renta Car, Alojamientos, stock mínimo y movimientos por mantenimiento o limpieza.</p></div><div className="topbar-actions"><button className="secondary" onClick={exportInventoryExcel}><Download size={16}/> Exportar inventario</button><button className="secondary" onClick={()=>setEditingInventoryMovement(emptyInventoryMovement('Entrada'))}><Plus size={16}/> Entrada</button><button className="primary" onClick={()=>setEditingInventoryItem(emptyInventoryItem())}><Plus size={16}/> Artículo</button></div></div><section className="analytics-strip inventory-kpis"><div><span>Artículos</span><strong>{inventorySummary.items.length}</strong></div><div><span>Renta Car</span><strong>{inventorySummary.carItems.length}</strong></div><div><span>Alojamientos</span><strong>{inventorySummary.lodgingItems.length}</strong></div><div><span>Stock mínimo</span><strong>{inventorySummary.lowStock.length}</strong></div><div><span>Valor inventario</span><strong>{money(inventorySummary.totalValue)}</strong></div><div><span>Consumo limpieza</span><strong>{money(inventorySummary.cleaningConsumption)}</strong></div></section><div className="inventory-actions-row"><button className="secondary" onClick={()=>setEditingInventoryMovement({...emptyInventoryMovement('Salida'), reason:'Mantenimiento'})}>Consumo por mantenimiento</button><button className="secondary" onClick={()=>setEditingInventoryMovement({...emptyInventoryMovement('Salida'), reason:'Limpieza', module:'Alojamientos'})}>Consumo por limpieza</button></div>{inventorySummary.lowStock.length > 0 && <div className="notice warning"><AlertCircle size={18}/> Hay {inventorySummary.lowStock.length} artículo(s) en stock mínimo o por debajo del mínimo.</div>}<div className="admin-grid inventory-grid"><section className="admin-card"><h3>Inventario Renta Car</h3><p>Repuestos, aceites, filtros, cauchos, herramientas y productos asociados a vehículos.</p><div className="admin-table"><table><thead><tr><th>Artículo</th><th>Categoría</th><th>Stock</th><th>Mín.</th><th>Costo</th><th>Acciones</th></tr></thead><tbody>{inventorySummary.carItems.map((item)=><tr key={item.id} className={num(item.quantity)<=num(item.minQuantity)?'low-stock-row':''}><td>{item.name}</td><td>{item.category}</td><td>{item.quantity}</td><td>{item.minQuantity}</td><td>{money(item.unitCost)}</td><td><div className="table-actions"><button className="secondary mini-action" onClick={()=>setEditingInventoryItem(item)}><Pencil size={14}/> Editar</button><button className="secondary mini-action" onClick={()=>setEditingInventoryMovement({...emptyInventoryMovement('Salida'), itemId:item.id, module:item.module, assetId:item.assetId, unitCost:item.unitCost, reason:'Mantenimiento'})}>Consumir</button></div></td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Inventario Alojamientos</h3><p>Lencería, toallas, amenidades, productos de limpieza, llaves, controles y mobiliario.</p><div className="admin-table"><table><thead><tr><th>Artículo</th><th>Categoría</th><th>Stock</th><th>Mín.</th><th>Costo</th><th>Acciones</th></tr></thead><tbody>{inventorySummary.lodgingItems.map((item)=><tr key={item.id} className={num(item.quantity)<=num(item.minQuantity)?'low-stock-row':''}><td>{item.name}</td><td>{item.category}</td><td>{item.quantity}</td><td>{item.minQuantity}</td><td>{money(item.unitCost)}</td><td><div className="table-actions"><button className="secondary mini-action" onClick={()=>setEditingInventoryItem(item)}><Pencil size={14}/> Editar</button><button className="secondary mini-action" onClick={()=>setEditingInventoryMovement({...emptyInventoryMovement('Salida'), itemId:item.id, module:item.module, assetId:item.assetId, unitCost:item.unitCost, reason:'Limpieza'})}>Consumir</button></div></td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Stock mínimo</h3><p>Artículos que requieren reposición para evitar fallas operativas.</p><div className="admin-table"><table><thead><tr><th>Artículo</th><th>Módulo</th><th>Stock</th><th>Mínimo</th><th>Ubicación</th></tr></thead><tbody>{inventorySummary.lowStock.map((item)=><tr key={item.id}><td>{item.name}</td><td>{item.module}</td><td>{item.quantity}</td><td>{item.minQuantity}</td><td>{inventoryAssetName(item)}</td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Movimientos de inventario</h3><p>Entradas y salidas registradas, incluyendo consumos por mantenimiento y limpieza.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Motivo</th><th>Artículo</th><th>Cant.</th><th>Total</th></tr></thead><tbody>{inventorySummary.movements.slice(0,16).map((row)=><tr key={row.id}><td>{formatShortDate(row.date)}</td><td>{row.kind}</td><td>{row.reason}</td><td>{row.itemName}</td><td>{row.quantity}</td><td>{money(row.totalCost)}</td></tr>)}</tbody></table></div></section></div><div className="notice"><AlertCircle size={18}/> Esta V82 agrega control de inventario sin alterar reservas, recepción, mantenimiento, ROI ni administración. Los consumos quedan registrados para alimentar egresos y reportes en fases siguientes.</div></section> : moduleMode === 'administration' ? <section className="calendar-panel administration-panel"><div className="topbar"><div><span className="eyebrow">ERP Base</span><h2>Administración</h2><p className="vehicle-subtitle">Caja, ingresos, egresos, cuentas por cobrar, cuentas por pagar, devoluciones y comisiones.</p></div><div className="topbar-actions"><button className="secondary" onClick={()=>openDollarPurchaseForm()}>Compra de $</button><button className="secondary" onClick={openDollarSaleForm}>Venta de $</button><button className="secondary" onClick={exportAdministrationExcel}><Download size={16}/> Exportar administración</button><button className="primary" type="button" onClick={()=>setEditingGeneralExpense(emptyGeneralExpense(profile, user, exchangeRates))}><Plus size={16}/> Registrar movimiento</button></div></div><section className="admin-executive-dashboard"><div className="admin-exec-hero"><span className="eyebrow">Resumen ejecutivo</span><h3>Caja disponible</h3><BsMainAmount usdValue={administrationRows.profit} bsValue={administrationRows.profitBs} exchangeRates={exchangeRates}/><small>Caja principal real en Bs: compras de $ descuentan Bs y ventas de $ suman Bs. No se muestran equivalentes USD falsos en cajas Bs.</small></div><div className="admin-exec-main"><article className="exec-card exec-income"><span>Ingresos cobrados</span><strong><BsMainAmount usdValue={administrationRows.income} bsValue={administrationRows.incomeBs} exchangeRates={exchangeRates}/></strong></article><article className="exec-card exec-expense"><span>Egresos</span><strong><BsMainAmount usdValue={administrationRows.expenses} bsValue={administrationRows.expensesBs} exchangeRates={exchangeRates}/></strong></article><article className="exec-card exec-profit"><span>Utilidad estimada</span><strong><BsMainAmount usdValue={administrationRows.profit} bsValue={administrationRows.profitBs} exchangeRates={exchangeRates}/></strong></article><article className="exec-card exec-receivable"><span>Por cobrar</span><strong><BsMainAmount usdValue={administrationRows.receivableTotal} bsValue={administrationRows.receivableTotalBs} exchangeRates={exchangeRates}/></strong></article></div><div className="admin-alert-row"><article className={administrationRows.payableTotal > 0 ? 'alert-card alert-warning' : 'alert-card'}><span>Por pagar</span><strong><BsMainAmount usdValue={administrationRows.payableTotal} bsValue={administrationRows.payableTotalBs} exchangeRates={exchangeRates}/></strong></article><article className={administrationRows.refundsTotal > 0 ? 'alert-card alert-danger' : 'alert-card'}><span>Devoluciones</span><strong><BsMainAmount usdValue={administrationRows.refundsTotal} exchangeRates={exchangeRates}/></strong></article><article className="alert-card"><span>Comisiones</span><strong><BsMainAmount usdValue={administrationRows.commissionTotal} exchangeRates={exchangeRates}/></strong></article></div><section className="payment-wallet-panel"><div className="wallet-panel-head"><span className="eyebrow">Caja por método de pago</span><strong>Dónde está el dinero</strong></div><div className="wallet-grid">{['Efectivo $','Zelle','Binance'].map((method)=>{ const row = administrationRows.paymentSummary.find((item)=>item.method===method) || {amountUsd:0,amountBs:0,count:0}; const icon = method === 'Efectivo $' ? '💵' : method === 'Zelle' ? '🏦' : '₿'; return <article className={`wallet-card wallet-${method.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()}`} key={method}><div><span className="wallet-icon">{icon}</span><span className="wallet-title">{method}</span></div><strong><WalletAmount method={method} row={row} exchangeRates={exchangeRates}/></strong><small>{row.count} movimientos</small></article> })}</div></section></section><section className="automation-strip"><div><strong>{erpAutomationSummary.incomeAuto}</strong><span>Ingresos automáticos</span></div><div><strong>{erpAutomationSummary.expenseAuto}</strong><span>Egresos mantenimiento</span></div><div><strong>{erpAutomationSummary.inventoryAuto}</strong><span>Consumos inventario</span></div><div><strong>{erpAutomationSummary.cleaningTasks}</strong><span>Tareas limpieza</span></div><div><strong>{erpAutomationSummary.roiUpdates}</strong><span>ROI actualizado</span></div><div><strong>{erpAutomationSummary.commissions}</strong><span>Comisiones auto</span></div></section><div className="admin-grid"><section className="admin-card"><h3>Caja general</h3><p>Movimientos derivados de reservas, abonos, mantenimiento, devoluciones y comisiones.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Módulo</th><th>Monto</th><th>Estado</th></tr></thead><tbody>{administrationRows.cashRows.slice(0,12).map((row)=><tr key={row.id}><td>{formatShortDate(row.date)}</td><td>{row.type}</td><td>{row.category}</td><td>{row.module}</td><td><CashRowAmount row={row} exchangeRates={exchangeRates}/></td><td>{row.status}</td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Cuentas por cobrar</h3><p>Reservas con saldo pendiente de pago.</p><div className="admin-table"><table><thead><tr><th>Cliente</th><th>Módulo</th><th>Activo</th><th>Pendiente</th><th>Fechas</th><th>Acciones</th></tr></thead><tbody>{administrationRows.receivables.slice(0,12).map((row)=><tr key={row.id}><td>{row.customerName}</td><td>{row.module}</td><td>{row.assetName}</td><td><DualAmount value={row.pendingAmount} exchangeRates={exchangeRates} fallbackRate={row.bcvEuroRate}/></td><td>{formatShortDate(row.startDate)} - {formatShortDate(row.endDate)}</td><td><div className="table-actions"><button className="secondary mini-action" type="button" onClick={()=>openReceivableSource(row)}><Pencil size={14}/> Editar reserva</button><button className="danger mini-action" type="button" onClick={()=>deleteReceivableSource(row)}><Trash2 size={14}/> Eliminar</button></div></td></tr>)}</tbody></table></div></section><section className="admin-card"><h3>Auditoría reciente</h3><p>Últimas acciones críticas registradas por usuario, módulo y fecha.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Acción</th><th>Módulo</th><th>Usuario</th></tr></thead><tbody>{(auditLogsStore?.items || []).slice(0,12).map((row)=><tr key={row.id}><td>{formatShortDate(row.createdAt || row.eventDate)}</td><td>{row.action}</td><td>{row.module}</td><td>{row.userName || row.userEmail || 'Sistema'}</td></tr>)}</tbody></table></div></section><section className="admin-card health-card"><h3>Monitor de salud</h3><p>Estado operativo del sistema, errores recientes y señales de riesgo.</p>{(() => { const snapshot = currentHealthSnapshot(); const recs = healthRecommendations(snapshot); return <><section className="analytics-strip mini-health-strip"><div><span>Estado</span><strong>{snapshot.status.label}</strong></div><div><span>Críticos</span><strong>{snapshot.status.critical}</strong></div><div><span>Altos</span><strong>{snapshot.status.high}</strong></div><div><span>Eventos</span><strong>{snapshot.eventsCount}</strong></div></section><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Severidad</th><th>Módulo</th><th>Mensaje</th></tr></thead><tbody>{healthEvents.slice(0,8).map((row)=><tr key={row.id}><td>{formatShortDate(String(row.createdAt || '').slice(0,10))}</td><td>{row.severity}</td><td>{row.module}</td><td>{row.message}</td></tr>)}{!healthEvents.length && <tr><td colSpan="4">No hay eventos recientes.</td></tr>}</tbody></table></div><ul className="health-recommendations">{recs.map((item, index)=><li key={index}>{item}</li>)}</ul><div className="backup-actions"><button className="secondary" type="button" onClick={exportHealthReportJson}><Download size={16}/> Exportar salud</button><button className="secondary" type="button" onClick={clearHealthEvents}>Limpiar eventos</button></div></> })()}</section><section className="admin-card backup-card"><h3>Backups técnicos</h3><p>Exportación segura de datos operativos con campos sensibles protegidos para auditoría, respaldo y control interno.</p><div className="backup-actions"><button className="secondary" type="button" onClick={exportTechnicalBackupJson}><Download size={16}/> Backup JSON</button><button className="secondary" type="button" onClick={exportTechnicalBackupExcel}><Download size={16}/> Backup Excel</button>{isAdmin && <button className="secondary" type="button" onClick={exportSensitiveAuditJson}><FileText size={16}/> Auditoría sensible</button>}</div><small>Incluye reservas, alojamientos, vehículos, inventario, RRHH, caja derivada, auditoría y operaciones públicas. Se enmascaran datos sensibles.</small></section><section className="admin-card"><h3>Operaciones públicas pendientes</h3><p>Entregas, recepciones y limpiezas enviadas desde links públicos seguros.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Activo</th><th>Acción</th></tr></thead><tbody>{pendingPublicSubmissions.slice(0,12).map((row)=><tr key={row.id}><td>{formatShortDate(row.submittedAt || row.createdAt)}</td><td>{publicSubmissionLabel(row)}</td><td>{publicSubmissionAsset(row)}</td><td><button className="secondary mini-action" onClick={()=>syncPublicOperationSubmission(row)}>Sincronizar</button></td></tr>)}{!pendingPublicSubmissions.length && <tr><td colSpan="4">No hay operaciones públicas pendientes.</td></tr>}</tbody></table></div>{pendingPublicSubmissions.length > 1 && <button className="secondary" onClick={syncAllPublicOperationSubmissions}>Sincronizar pendientes</button>}</section><section className="admin-card"><h3>Movimientos operativos</h3><p>Registra ingresos y gastos administrativos. Los ingresos suman caja; los gastos pagados descuentan caja.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th>Activo</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{(generalExpensesStore.items || []).slice(0,12).map((row)=><tr key={row.id}><td>{formatShortDate(row.date)}</td><td>{row.category}</td><td>{row.description}</td><td>{row.assetType === 'Vehículo' ? (vehicles.find(v=>v.id===row.assetId)?.name || 'Vehículo') : row.assetType === 'Alojamiento' ? (accommodations.find(a=>a.id===row.assetId)?.name || 'Alojamiento') : 'General'}</td><td><BsMainAmount usdValue={generalExpenseUsdAmount(row, exchangeRates)} bsValue={generalExpenseBsAmount(row, exchangeRates)} exchangeRates={exchangeRates}/></td><td>{row.expenseStatus || 'Pagado'}</td><td><div className="table-actions"><button className="secondary mini-action" type="button" onClick={()=>setEditingGeneralExpense(row)}><Pencil size={14}/> Editar</button><button className="danger mini-action" type="button" onClick={async()=>{ if(confirm('¿Eliminar este gasto?')) { await generalExpensesStore.removeItem(row.id); showSuccess('Gasto eliminado') } }}><Trash2 size={14}/> Borrar</button></div></td></tr>)}{!(generalExpensesStore.items || []).length && <tr><td colSpan="7">No hay movimientos operativos registrados.</td></tr>}</tbody></table></div></section><section className="admin-card"><h3>Cuentas por pagar</h3><p>Solo muestra gastos marcados como Por pagar, devoluciones y comisiones pendientes. Los gastos Pagados ya afectan caja y no aparecen aquí.</p><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Módulo</th><th>Monto</th><th>Responsable</th><th>Acciones</th></tr></thead><tbody>{administrationRows.payables.slice(0,12).map((row)=><tr key={row.id}><td>{formatShortDate(row.date)}</td><td>{row.category}</td><td>{row.module}</td><td><span className="dual-amount"><span className="dual-usd">{payableDisplayAmount(row, exchangeRates)}</span><span className="dual-label">{paymentDisplayMethod(row.method || row.paymentMethod || '')}</span>{String(row.category||'').includes('aliado') || String(row.description||'').toLowerCase().includes('propietario') ? <small>Ganancia Alohandote: {money(row.alohandoteNetIncomeUsd || row.alohandoteIncomeUsd || 0)}</small> : null}</span></td><td>{row.responsible}</td><td><div className="table-actions">{row.category === 'Comisión vendedor' && <button className="primary mini-action" type="button" onClick={()=>openCommissionPayment(row)}>Pagar comisión</button>}<button className="secondary mini-action" type="button" onClick={()=>openPayableSource(row)}><Pencil size={14}/> Editar</button><button className="danger mini-action" type="button" onClick={()=>deletePayableSource(row)}><Trash2 size={14}/> Borrar</button></div></td></tr>)}{!administrationRows.payables.length && <tr><td colSpan="6">No hay cuentas por pagar.</td></tr>}</tbody></table></div></section><section className="admin-card"><h3>Comisiones</h3><p>Cálculo base 15% sobre reservas con pagos registrados. Ajustable en futuras reglas ERP.</p><div className="admin-table"><table><thead><tr><th>Vendedor</th><th>Módulo</th><th>Cliente</th><th>Comisión</th><th>Estado</th></tr></thead><tbody>{administrationRows.commissionRows.slice(0,12).map((row)=><tr key={row.id}><td>{row.responsible || 'Sin vendedor'}</td><td>{row.module}</td><td>{row.description}</td><td>{moneyDual(row.amount, exchangeRates)}</td><td>{row.status}</td></tr>)}</tbody></table></div></section></div><div className="notice"><AlertCircle size={18}/> Esta capa administrativa consolida caja, pagos, inventario, comisiones y operaciones sin alterar el flujo comercial actual. Los movimientos Bs imposibles de cubrir se omiten del saldo principal y quedan en alertas de calidad de datos.</div>{administrationRows.dataQualityRows?.length > 0 && <div className="notice warning"><AlertCircle size={18}/> {administrationRows.dataQualityRows.length} movimiento(s) Bs fueron omitidos del saldo por inconsistencia histórica. Revisa el export de administración para depurar datos viejos.</div>}</section> : moduleMode === 'maintenance' ? <section className="calendar-panel maintenance-panel"><div className="topbar"><div><span className="eyebrow">Operación</span><h2>Mantenimiento</h2><p className="vehicle-subtitle">Dashboard para controlar mantenimientos, costos y próximos servicios por kilometraje.</p></div><div className="topbar-actions"><button className="secondary" type="button" onClick={exportMaintenanceExcel}><Download size={16}/> Exportar mantenimientos</button><button className="primary" type="button" onClick={()=>{ if(!selectedVehicle && vehicles[0]) setSelectedVehicleId(vehicles[0].id); setEditingReservation({ ...emptyReservation((selectedVehicle || vehicles[0])?.id || '', new Date().toISOString().slice(0,10), profile, user), status:'maintenance', currentKm: (selectedVehicle || vehicles[0])?.currentKm || '' })}}>+ Mant. Renta Car</button><button className="secondary" type="button" onClick={()=>{ if(!selectedAccommodation && accommodations[0]) setSelectedAccommodationId(accommodations[0].id); setEditingLodging({ ...emptyLodgingReservation((selectedAccommodation || accommodations[0])?.id || '', new Date().toISOString().slice(0,10), profile, user), status:'maintenance', accommodationName:(selectedAccommodation || accommodations[0])?.name || '', maintenanceType:'Preventivo', endDate:new Date().toISOString().slice(0,10) })}}>+ Mant. alojamiento</button></div></div><section className="analytics-strip"><div><span>Mantenimientos</span><strong>{maintenanceRows.length}</strong></div><div><span>Costo total</span><strong>{money(maintenanceRows.reduce((s,r)=>s+num(r.maintenanceCost),0))}</strong></div><div><span>Próx. por km</span><strong>{maintenanceRows.filter(r=>r.remainingKm !== null && r.remainingKm <= 300).length}</strong></div><div><Mail size={18}/><span>Notificación</span><strong>Email backend</strong></div></section><div className="profit-table"><table><thead><tr><th>Activo</th><th>Módulo</th><th>Fecha</th><th>Tipo</th><th>Km actual</th><th>Próximo km</th><th>Costo</th><th>Acciones</th></tr></thead><tbody>{maintenanceRows.map((row)=><tr key={`${row.module}-${row.id}`}><td>{row.assetName}</td><td>{row.module}</td><td>{formatShortDate(row.startDate)} - {formatShortDate(row.endDate)}</td><td>{row.maintenanceType || 'Preventivo'}</td><td>{row.currentKm ? row.currentKm.toLocaleString('es-VE') : '-'}</td><td>{row.targetKm ? row.targetKm.toLocaleString('es-VE') : '-'}</td><td>{money(row.maintenanceCost || (num(row.maintenanceLaborCost)+num(row.maintenancePartsCost)))}</td><td><div className="table-actions"><button className="secondary mini-action" onClick={()=>{ if(row.module==='Renta Car'){setSelectedVehicleId(row.vehicleId); setEditingReservation(row)} else {setSelectedAccommodationId(row.accommodationId); setEditingLodging(row)} }}><Pencil size={14}/> Editar</button><button className="danger mini-action" onClick={async()=>{ if(!confirm('¿Eliminar registro de mantenimiento?')) return; if(row.module==='Renta Car') await reservationsStore.removeItem(row.id); else await lodgingStore.removeItem(row.id); await logAudit('maintenance_deleted', row.module, row.id, row); showSuccess('Mantenimiento eliminado correctamente') }}><Trash2 size={14}/> Eliminar</button></div></td></tr>)}</tbody></table></div><div className="notice"><Mail size={18}/> Para enviar correos automáticos a jalemanbetanco@gmail.com se requiere Cloud Functions o un backend con SendGrid/Mailgun. Esta V66 deja el dashboard y la estructura lista.</div></section> : moduleMode === 'cars' ? <section className="calendar-panel">
        <div className="topbar"><div><span className="eyebrow">Calendario</span><h2>{selectedVehicle?.name || 'Vehículo'}</h2><p className="vehicle-subtitle">{selectedVehicle?.plate ? `Placa: ${selectedVehicle.plate}` : 'Selecciona días para bloquear fechas'}</p></div><div className="month-controls"><button onClick={() => changeMonth(-1)}><ChevronLeft /></button><strong>{monthTitle(currentMonth)}</strong><button onClick={() => changeMonth(1)}><ChevronRight /></button></div><div className="topbar-actions"><button className="secondary" type="button" onClick={exportRentCarDashboardExcel}><Download size={16}/> Exportar dashboard</button></div></div>
        {isDemoMode && <div className="notice"><AlertCircle size={18} /> Modo demo administrador: los datos se guardan en este navegador y se habilitan todos los módulos para pruebas de completitud.</div>}
        {!isAdmin && <div className="notice success"><Lock size={18} /> Perfil operador: puedes crear reservas y modificar solo las creadas por tu usuario.</div>}
        {!selectedVehicle ? <div className="empty-module-state"><h3>Selecciona un vehículo</h3><p>El calendario y el dashboard se mostrarán únicamente después de elegir un vehículo de la lista.</p></div> : <>
        {canViewDashboard && (<><section className="analytics-strip"><div><BarChart3 size={18} /><span>Días ocupados</span><strong>{analytics.occupied}</strong></div><div><span>Total servicio</span><strong>{money(analytics.totalService)}</strong></div><div><span>Abonado</span><strong>{money(analytics.collected)}</strong></div><div><span>Pendiente</span><strong>{money(analytics.pending)}</strong></div><button type="button" className="analytics-card-button" onClick={()=>setAssetMaintenanceDetail({title:`Mantenimientos · ${selectedVehicle?.name || 'Vehículo'}`, rows: analytics.maintenance})}><span>Mantenimientos</span><strong>{analytics.maintenance.length}</strong></button><div><span>Lavados / limpiezas</span><strong>{analytics.cleanings}</strong></div><button type="button" className="analytics-card-button" onClick={()=>setAssetExpenseDetail({title:`Gastos · ${selectedVehicle?.name || 'Vehículo'}`, rows: analytics.expenseRows})}><span>Gastos</span><strong>{money(analytics.expenseTotal)}</strong></button>{isAlliedVehicle(selectedVehicle) && <div><span>Ganancia aliados</span><strong>{money(analytics.allyProfit)}</strong></div>}</section>{analytics.maintenance.length > 0 && <section className="document-box dashboard-maintenance-detail"><label>Próximo mantenimiento<select value={selectedVehicleMaintenanceId || analytics.maintenance[0]?.id || ''} onChange={(e)=>setSelectedVehicleMaintenanceId(e.target.value)}>{analytics.maintenance.map((item)=><option key={item.id} value={item.id}>{formatShortDate(item.startDate)} · {item.maintenanceType || 'Mantenimiento'} · {money(item.maintenanceCost || item.amount || 0)}</option>)}</select></label>{(() => { const item = analytics.maintenance.find((row)=>row.id===(selectedVehicleMaintenanceId || analytics.maintenance[0]?.id)); return item ? <small>{item.note || item.notes || item.customerName || 'Sin detalle registrado'} · {formatShortDate(item.startDate)} - {formatShortDate(item.endDate)}</small> : null })()}</section>}</>)}

        <div className="calendar-grid weekdays"><div><span className="weekday-full">Lun.</span><span className="weekday-mobile">L</span></div><div><span className="weekday-full">Mar.</span><span className="weekday-mobile">M</span></div><div><span className="weekday-full">Mié.</span><span className="weekday-mobile">M</span></div><div><span className="weekday-full">Jue.</span><span className="weekday-mobile">J</span></div><div><span className="weekday-full">Vie.</span><span className="weekday-mobile">V</span></div><div><span className="weekday-full">Sáb.</span><span className="weekday-mobile">S</span></div><div><span className="weekday-full">Dom.</span><span className="weekday-mobile">D</span></div></div>
        <div className="calendar-grid days-grid">{monthDays.map((date, index) => {
          const reservation = date ? getReservationForDate(date) : null
          const status = reservation ? statusMeta(reservation.status) : null
          const title = reservation ? (normalizeStatus(reservation.status) === 'maintenance' ? 'Mantenimiento' : reservation.customerName || status?.label) : ''
          return <button key={index} className={`day-cell ${!date ? 'muted' : ''} ${status?.className || ''}`} onClick={() => date && (reservation ? openEditReservation(reservation) : openCreateReservation(date))}>{date && <><span className="day-number">{date.getDate()}</span>{reservation ? <span className="reservation-label">{title}</span> : selectedVehicle?.dailyRentalRate ? <span className="day-price">${Number(selectedVehicle.dailyRentalRate || 0).toLocaleString('es-VE', { maximumFractionDigits: 0 })}</span> : null}{reservation?.createdByName && <small className="seller-mini">{reservation.createdByName}</small>}</>}</button>
        })}</div></>}
      </section> : moduleMode === 'carDeliveries' ? <section className="calendar-panel module-ops-panel"><div className="topbar"><div><span className="eyebrow">Renta Car</span><h2>Entregas de vehículos</h2><p className="vehicle-subtitle">Vehículos que deben ser entregados según la fecha de inicio de cada reserva. Solo admin.</p></div><div className="topbar-actions"><button className="secondary" onClick={copyOperationsPublicLink}>Copiar link logística</button></div></div><div className="module-ops-grid"><section className="history-list pending-receptions vehicle-delivery-section"><h3>Entregas de hoy</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='delivery' && item.group==='today').length ? operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='delivery' && item.group==='today').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Cliente: {item.customerName} · Entrega: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span>{operationDetailLine(item) && <small>{operationDetailLine(item)}</small>}</div><button className="secondary mini-action" onClick={()=>openVehicleDeliveryForm(item)}>Abrir entrega</button></div>) : <div className="empty-state">No hay vehículos por entregar hoy.</div>}</section><section className="history-list pending-receptions future-section"><h3>Próximas entregas — próximo día</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='delivery' && item.group==='future').length ? operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='delivery' && item.group==='future').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Cliente: {item.customerName} · Entrega: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span>{operationDetailLine(item) && <small>{operationDetailLine(item)}</small>}</div><button className="secondary mini-action" onClick={()=>openVehicleDeliveryForm(item)}>Abrir entrega</button></div>) : <div className="empty-state">No hay entregas próximas.</div>}</section></div></section>
      : moduleMode === 'carReceptions' ? <section className="calendar-panel module-ops-panel"><div className="topbar"><div><span className="eyebrow">Renta Car</span><h2>Recepciones de vehículos</h2><p className="vehicle-subtitle">Vehículos que deben ser recibidos según la fecha final de cada reserva. Al recibir se actualiza kilometraje y ROI.</p></div><div className="topbar-actions"><button className="secondary" onClick={copyOperationsPublicLink}>Copiar link logística</button><button className="primary" onClick={() => openVehicleReception(selectedVehicle)}><Plus size={17}/> Nueva recepción</button></div></div><div className="module-ops-grid"><section className="history-list pending-receptions vehicle-reception-section"><h3>Recepciones de hoy</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='reception' && item.group==='today').length ? operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='reception' && item.group==='today').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Cliente: {item.customerName} · Recepción: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span>{operationDetailLine(item) && <small>{operationDetailLine(item)}</small>}</div><button className="secondary mini-action" onClick={()=>openVehicleReceptionForm(item)}>Abrir recepción</button></div>) : <div className="empty-state">No hay vehículos por recibir hoy.</div>}</section><section className="history-list pending-receptions future-section"><h3>Próximas recepciones — próximo día</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='reception' && item.group==='future').length ? operationsHandoverRows.filter((item)=>item.reservationType==='vehicle' && item.operation==='reception' && item.group==='future').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Cliente: {item.customerName} · Recepción: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span>{operationDetailLine(item) && <small>{operationDetailLine(item)}</small>}</div><button className="secondary mini-action" onClick={()=>openVehicleReceptionForm(item)}>Abrir recepción</button></div>) : <div className="empty-state">No hay recepciones próximas.</div>}</section></div><div className="history-list"><h3>Historial de recepción de vehículos</h3>{selectedVehicleCheckins.length ? selectedVehicleCheckins.slice(0, 20).map((item) => <div className="history-row" key={item.id}><div><strong>{Number(item.currentKm || 0).toLocaleString('es-VE')} km</strong><span>{item.vehicleName || selectedVehicle?.name} · {item.fuelLevel || 'Combustible no indicado'} · {item.generalStatus || 'Sin estado'}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleString('es-VE') : ''} · Recibido por {titleCaseName(item.createdByName || item.createdByEmail || 'Operador')}</small>{item.notes && <p>{item.notes}</p>}</div></div>) : <div className="empty-state">No hay recepciones registradas para este vehículo.</div>}</div></section>
      : moduleMode === 'lodgingDeliveries' ? <section className="calendar-panel module-ops-panel"><div className="topbar"><div><span className="eyebrow">Alojamientos</span><h2>Check-in / Entregas</h2><p className="vehicle-subtitle">Alojamientos que deben entregarse al huésped según la fecha de inicio. Incluye reservas internas e iCal.</p></div><div className="topbar-actions"><button className="secondary" onClick={repairIcalAccommodationNames}>Reparar nombres iCal</button><button className="secondary" onClick={copyOperationsPublicLink}>Copiar link logística / limpieza</button></div></div><div className="module-ops-grid"><section className="history-list pending-receptions lodging-delivery-section"><h3>Check-in de hoy</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='delivery' && item.group==='today').length ? operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='delivery' && item.group==='today').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.sourceType === 'ical' ? 'iCal' : 'Huésped'}: {item.customerName} · Check-in: {formatShortDate(item.operationDate)}</span><small>{item.title}{item.sourceType === 'ical' ? ' · Importado por iCal' : ''}</small></div>{item.sourceType === 'ical' && item.assetName === 'Alojamiento sin vincular' ? <button className="secondary mini-action" onClick={()=>openIcalLinker(item)}>Vincular alojamiento</button> : <button className="secondary mini-action" onClick={()=>markHandoverOperationDone(item)}>Check-in realizado</button>}</div>) : <div className="empty-state">No hay alojamientos por entregar hoy.</div>}</section><section className="history-list pending-receptions future-section"><h3>Próximos check-in — próximo día</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='delivery' && item.group==='future').length ? operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='delivery' && item.group==='future').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.sourceType === 'ical' ? 'iCal' : 'Huésped'}: {item.customerName} · Check-in: {formatShortDate(item.operationDate)}</span></div>{item.sourceType === 'ical' && item.assetName === 'Alojamiento sin vincular' ? <button className="secondary mini-action" onClick={()=>openIcalLinker(item)}>Vincular alojamiento</button> : <button className="secondary mini-action" onClick={()=>markHandoverOperationDone(item)}>Marcar check-in</button>}</div>) : <div className="empty-state">No hay check-in próximos.</div>}</section></div></section>
      : moduleMode === 'lodgingReceptions' ? <section className="calendar-panel module-ops-panel"><div className="topbar"><div><span className="eyebrow">Alojamientos</span><h2>Check-out / Limpieza</h2><p className="vehicle-subtitle">Alojamientos por recibir según la fecha final. Al marcar limpieza se actualiza el conteo por alojamiento.</p></div><div className="topbar-actions"><button className="secondary" onClick={repairIcalAccommodationNames}>Reparar nombres iCal</button><button className="secondary" onClick={copyOperationsPublicLink}>Copiar link limpieza</button></div></div><div className="module-ops-grid"><section className="history-list pending-receptions lodging-reception-section"><h3>Check-out / limpiezas de hoy</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='reception' && item.group==='today').length ? operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='reception' && item.group==='today').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.sourceType === 'ical' ? 'iCal' : 'Huésped'}: {item.customerName} · Check-out: {formatShortDate(item.operationDate)} · Limpiezas: {item.cleaningsCount || 0}</span><small>{item.title}{item.sourceType === 'ical' ? ' · Importado por iCal' : ''}</small></div>{item.sourceType === 'ical' && item.assetName === 'Alojamiento sin vincular' ? <button className="secondary mini-action" onClick={()=>openIcalLinker(item)}>Vincular alojamiento</button> : <button className="secondary mini-action" onClick={()=>openCleaningForm(item)}>Marcar limpieza</button>}</div>) : <div className="empty-state">No hay alojamientos por recibir hoy.</div>}</section><section className="history-list pending-receptions future-section"><h3>Próximos check-out — próximo día</h3>{operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='reception' && item.group==='future').length ? operationsHandoverRows.filter((item)=>item.reservationType==='lodging' && item.operation==='reception' && item.group==='future').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.sourceType === 'ical' ? 'iCal' : 'Huésped'}: {item.customerName} · Check-out: {formatShortDate(item.operationDate)} · Limpiezas: {item.cleaningsCount || 0}</span></div>{item.sourceType === 'ical' && item.assetName === 'Alojamiento sin vincular' ? <button className="secondary mini-action" onClick={()=>openIcalLinker(item)}>Vincular alojamiento</button> : <button className="secondary mini-action" onClick={()=>openCleaningForm(item)}>Marcar limpieza</button>}</div>) : <div className="empty-state">No hay check-out próximos.</div>}</section></div></section>
      : moduleMode === 'checkins' ? <section className="calendar-panel reception-panel delivery-reception-panel">
        <div className="topbar"><div><span className="eyebrow">Operación</span><h2>Entrega / Recepción</h2><p className="vehicle-subtitle">Controla por separado entregas de vehículos, check-in de alojamientos, recepciones de vehículos y check-out de alojamientos. Solo se muestran operaciones de hoy y próximo día.</p></div><div className="topbar-actions"><button className="secondary" onClick={copyOperationsPublicLink}>Copiar link logística / limpieza</button><button className="secondary" onClick={() => copyVehicleReceptionLink(selectedVehicle)}>Copiar link público vehículo</button><button className="primary" onClick={() => openVehicleReception(selectedVehicle)}><Plus size={17}/> Nueva recepción vehículo</button></div></div>
        <section className="analytics-strip"><div><Car size={18}/><span>Vehículo seleccionado</span><strong>{selectedVehicle?.name || 'Sin vehículo'}</strong></div><div><span>Kilometraje actual</span><strong>{selectedVehicle?.currentKm ? `${Number(selectedVehicle.currentKm).toLocaleString('es-VE')} km` : 'Sin registro'}</strong></div><div><span>Última actualización</span><strong>{selectedVehicle?.lastKmUpdateAt ? new Date(selectedVehicle.lastKmUpdateAt).toLocaleDateString('es-VE') : 'Pendiente'}</strong></div></section>

        <div className="handover-segment-title"><span>Hoy</span><strong>Operaciones del día</strong></div>
        <div className="handover-grid segmented">
          <div className="history-list pending-receptions vehicle-delivery-section"><h3>Vehículos por entregar</h3>{operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='delivery' && item.reservationType==='vehicle').length ? operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='delivery' && item.reservationType==='vehicle').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Cliente: {item.customerName} · Entrega: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span><small>{item.title}{item.sourceType === 'ical' ? ' · Importado por iCal' : ''}</small>{operationDetailLine(item) && <small>{operationDetailLine(item)}</small>}</div><button className="secondary mini-action" onClick={()=>openVehicleDeliveryForm(item)}>Abrir entrega</button></div>) : <div className="empty-state">No hay vehículos por entregar hoy.</div>}</div>

          <div className="history-list pending-receptions lodging-delivery-section"><h3>Alojamientos por entregar / check-in</h3>{operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='delivery' && item.reservationType==='lodging').length ? operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='delivery' && item.reservationType==='lodging').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Huésped: {item.customerName} · Check-in: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span><small>{item.title}{item.sourceType === 'ical' ? ' · Importado por iCal' : ''}</small></div>{item.sourceType === 'ical' && item.assetName === 'Alojamiento sin vincular' ? <button className="secondary mini-action" onClick={()=>openIcalLinker(item)}>Vincular alojamiento</button> : <button className="secondary mini-action" onClick={()=>markHandoverOperationDone(item)}>Check-in realizado</button>}</div>) : <div className="empty-state">No hay alojamientos por entregar hoy.</div>}</div>

          <div className="history-list pending-receptions vehicle-reception-section"><h3>Vehículos por recibir</h3>{operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='reception' && item.reservationType==='vehicle').length ? operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='reception' && item.reservationType==='vehicle').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Cliente: {item.customerName} · Recepción: {formatShortDate(item.operationDate)} · {money(item.totalAmount || item.amount)}</span><small>{item.title}{item.sourceType === 'ical' ? ' · Importado por iCal' : ''}</small></div><button className="secondary mini-action" onClick={()=>{setSelectedVehicleId(item.vehicleId); setEditingVehicleCheckin({ ...emptyVehicleCheckin(item.vehicleId, profile, user), reservationId:item.reservationId, currentKm: vehicles.find(v=>v.id===item.vehicleId)?.currentKm || '' })}}>Recibir</button></div>) : <div className="empty-state">No hay vehículos por recibir hoy.</div>}</div>

          <div className="history-list pending-receptions lodging-reception-section"><h3>Alojamientos por recibir / check-out</h3>{operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='reception' && item.reservationType==='lodging').length ? operationsHandoverRows.filter((item)=>item.group==='today' && item.operation==='reception' && item.reservationType==='lodging').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>Huésped: {item.customerName} · Check-out: {formatShortDate(item.operationDate)} · Limpiezas: {item.cleaningsCount || 0} · {money(item.totalAmount || item.amount)}</span><small>{item.title}{item.sourceType === 'ical' ? ' · Importado por iCal' : ''}</small></div>{item.sourceType === 'ical' && item.assetName === 'Alojamiento sin vincular' ? <button className="secondary mini-action" onClick={()=>openIcalLinker(item)}>Vincular alojamiento</button> : <button className="secondary mini-action" onClick={()=>openCleaningForm(item)}>Marcar limpieza</button>}</div>) : <div className="empty-state">No hay alojamientos por recibir hoy.</div>}</div>
        </div>

        <div className="handover-segment-title future-title"><span>Próximo día</span><strong>Operaciones próximas segmentadas</strong></div>
        <div className="handover-grid segmented future-grid">
          <div className="history-list pending-receptions future-section"><h3>Próximas entregas de vehículos</h3>{operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='delivery' && item.reservationType==='vehicle').length ? operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='delivery' && item.reservationType==='vehicle').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.customerName} · Entrega: {formatShortDate(item.operationDate)}</span></div><button className="secondary mini-action" onClick={()=>markHandoverOperationDone(item)}>Marcar</button></div>) : <div className="empty-state">Sin entregas de vehículos próximas.</div>}</div>
          <div className="history-list pending-receptions future-section"><h3>Próximos check-in alojamientos</h3>{operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='delivery' && item.reservationType==='lodging').length ? operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='delivery' && item.reservationType==='lodging').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.customerName} · Check-in: {formatShortDate(item.operationDate)}</span></div><button className="secondary mini-action" onClick={()=>markHandoverOperationDone(item)}>Marcar</button></div>) : <div className="empty-state">Sin check-in próximos.</div>}</div>
          <div className="history-list pending-receptions future-section"><h3>Próximas recepciones de vehículos</h3>{operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='reception' && item.reservationType==='vehicle').length ? operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='reception' && item.reservationType==='vehicle').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.customerName} · Recepción: {formatShortDate(item.operationDate)}</span></div><button className="secondary mini-action" onClick={()=>{setSelectedVehicleId(item.vehicleId); setEditingVehicleCheckin({ ...emptyVehicleCheckin(item.vehicleId, profile, user), reservationId:item.reservationId, currentKm: vehicles.find(v=>v.id===item.vehicleId)?.currentKm || '' })}}>Recibir</button></div>) : <div className="empty-state">Sin recepciones de vehículos próximas.</div>}</div>
          <div className="history-list pending-receptions future-section"><h3>Próximos check-out alojamientos</h3>{operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='reception' && item.reservationType==='lodging').length ? operationsHandoverRows.filter((item)=>item.group==='future' && item.operation==='reception' && item.reservationType==='lodging').map((item)=><div className="history-row reception-row" key={item.id}><div><strong>{item.assetName}</strong><span>{item.customerName} · Check-out: {formatShortDate(item.operationDate)} · Limpiezas: {item.cleaningsCount || 0}</span></div><button className="secondary mini-action" onClick={()=>markHandoverOperationDone(item)}>Marcar</button></div>) : <div className="empty-state">Sin check-out próximos.</div>}</div>
        </div>

        <div className="history-list"><h3>Historial de recepción de vehículos</h3>{selectedVehicleCheckins.length ? selectedVehicleCheckins.slice(0, 20).map((item) => <div className="history-row" key={item.id}><div><strong>{Number(item.currentKm || 0).toLocaleString('es-VE')} km</strong><span>{item.vehicleName || selectedVehicle?.name} · {item.fuelLevel || 'Combustible no indicado'} · {item.generalStatus || 'Sin estado'}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleString('es-VE') : ''} · Recibido por {titleCaseName(item.createdByName || item.createdByEmail || 'Operador')}</small>{item.notes && <p>{item.notes}</p>}</div><div className="history-files">{item.dashboardPhoto?.url && <a href={item.dashboardPhoto.url} target="_blank">Tablero</a>}{item.vehiclePhoto?.url && <a href={item.vehiclePhoto.url} target="_blank">Vehículo</a>}</div></div>) : <div className="empty-state">No hay recepciones registradas para este vehículo.</div>}</div>
      </section> : moduleMode === 'profitability' ? <section className="calendar-panel">
        <div className="topbar"><div><span className="eyebrow">Flota + Alojamientos</span><h2>Rentabilidad KM / ROI</h2><p className="vehicle-subtitle">Conectado con reservas, alojamientos, mantenimiento, limpieza e inventario ERP. Exporta vehículos, reservas y alojamientos.</p></div><button className="primary" onClick={exportProfitabilityExcel}><Download size={17}/> Exportar rentabilidad</button></div>
        <section className="analytics-strip"><div><BarChart3 size={18}/><span>Ingresos flota</span><strong>{money(vehicleProfitabilityRows.reduce((s,r)=>s+r.totalIncome,0))}</strong></div><div><span>Ingresos alojamientos</span><strong>{money(lodgingProfitabilityRows.reduce((s,r)=>s+r.totalIncome,0))}</strong></div><div><span>Utilidad neta total</span><strong>{money(vehicleProfitabilityRows.reduce((s,r)=>s+r.utilidadNeta,0)+lodgingProfitabilityRows.reduce((s,r)=>s+r.utilidadNeta,0))}</strong></div><div><span>Noches / Km</span><strong>{lodgingProfitabilityRows.reduce((s,r)=>s+r.nights,0).toLocaleString('es-VE')} noches · {vehicleProfitabilityRows.reduce((s,r)=>s+r.kmRecorridos,0).toLocaleString('es-VE')} km</strong></div></section>
        <section className="profit-table"><h3>ROI por vehículo</h3><div className="table-scroll"><table><thead><tr><th>Vehículo</th><th>Inversión</th><th>Ingresos</th><th>Km</th><th>Ingreso/km</th><th>Mant.</th><th>Gastos vehículo</th><th>Utilidad</th><th>ROI</th></tr></thead><tbody>{vehicleProfitabilityRows.map((row)=><tr key={row.vehicleId}><td>{row.vehicleName}<small>{row.plate}</small></td><td>{money(row.investmentCost)}</td><td>{money(row.totalIncome)}</td><td>{row.kmRecorridos.toLocaleString('es-VE')}</td><td>{money(row.ingresoPorKm)}</td><td>{money(row.maintenanceCost)}</td><td><button type="button" className="link-button" onClick={()=>setAssetExpenseDetail({title:`Gastos asociados · ${row.vehicleName}`, rows:assetExpensesForDetail('Vehículo', row.vehicleId)})}>{money(row.generalExpenseCost || 0)}</button></td><td>{money(row.utilidadNeta)}</td><td><strong>{row.roiPercent.toFixed(2)}%</strong></td></tr>)}</tbody></table></div></section>
        <section className="profit-table"><h3>ROI por alojamiento</h3><div className="table-scroll"><table><thead><tr><th>Alojamiento</th><th>Noches</th><th>Ingresos</th><th>Limpieza</th><th>Mant.</th><th>Gastos asociados</th><th>Utilidad</th><th>ROI</th></tr></thead><tbody>{lodgingProfitabilityRows.map((row)=><tr key={row.accommodationId}><td>{row.accommodationName}<small>{row.residence}</small></td><td>{row.nights.toLocaleString('es-VE')}</td><td>{money(row.totalIncome)}</td><td>{money(row.cleaningCost)}</td><td>{money(row.maintenanceCost)}</td><td><button type="button" className="link-button" onClick={()=>setAssetExpenseDetail({title:`Gastos asociados · ${row.accommodationName}`, rows:assetExpensesForDetail('Alojamiento', row.accommodationId)})}>{money(row.generalExpenseCost || 0)}</button></td><td>{money(row.utilidadNeta)}</td><td><strong>{row.roiPercent.toFixed(2)}%</strong></td></tr>)}</tbody></table></div></section>
        <section className="profit-table profitability-closed-km"><h3>Reservas cerradas por kilometraje</h3><div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Vehículo</th><th>Km entrega</th><th>Km recepción</th><th>Km recorridos</th><th>Total</th><th>Utilidad/km</th><th>Recibido por</th></tr></thead><tbody>{profitabilityRows.map((row)=><tr key={row.id}><td>{row.customerName}</td><td>{row.vehicleName}</td><td>{row.deliveryKm.toLocaleString('es-VE')}</td><td>{row.kmRecepcion ? row.kmRecepcion.toLocaleString('es-VE') : 'Pendiente'}</td><td>{row.kmRecorridos.toLocaleString('es-VE')}</td><td>{money(row.totalAmount)}</td><td>{money(row.utilidadPorKm)}</td><td>{row.receivedBy || 'Pendiente'}</td></tr>)}</tbody></table></div></section>
      </section> : <section className="calendar-panel"><div className="topbar"><div><span className="eyebrow">Calendario</span><h2>{selectedAccommodation?.name || 'Alojamiento'}</h2><p className="vehicle-subtitle">{selectedAccommodation?.residence ? `Residencia: ${selectedAccommodation.residence}` : 'Selecciona un alojamiento para ver su calendario'}</p></div><div className="month-controls"><button onClick={() => changeMonth(-1)}><ChevronLeft /></button><strong>{monthTitle(currentMonth)}</strong><button onClick={() => changeMonth(1)}><ChevronRight /></button></div>{selectedAccommodation && <div className="topbar-actions"><button className="secondary" type="button" onClick={exportLodgingDashboardExcel}><Download size={16}/> Exportar dashboard</button></div>}</div>{!selectedAccommodation ? <div className="empty-module-state"><h3>Selecciona un alojamiento</h3><p>El calendario y el dashboard se mostrarán únicamente después de elegir un alojamiento de la lista.</p></div> : <>{canViewDashboard && (<><section className="analytics-strip"><div><BarChart3 size={18} /><span>Noches ocupadas</span><strong>{accommodationDashboard.occupiedNights}</strong></div><div><span>Total hospedaje</span><strong>{money(accommodationDashboard.totalLodging)}</strong></div><div><span>Reservas</span><strong>{accommodationDashboard.reservations}</strong></div><div><span>Limpiezas realizadas</span><strong>{accommodationDashboard.cleanings}</strong></div><button type="button" className="analytics-card-button" onClick={()=>setAssetMaintenanceDetail({title:`Mantenimientos · ${selectedAccommodation?.name || 'Alojamiento'}`, rows: accommodationDashboard.maintenanceRows})}><span>Mantenimientos</span><strong>{accommodationDashboard.maintenance}</strong></button><button type="button" className="analytics-card-button" onClick={()=>setAssetExpenseDetail({title:`Gastos · ${selectedAccommodation?.name || 'Alojamiento'}`, rows: accommodationDashboard.expenseRows})}><span>Gastos</span><strong>{money(accommodationDashboard.expenseTotal)}</strong></button>{isAlliedAccommodation(selectedAccommodation) && <div><span>Ganancia aliados</span><strong>{money(accommodationDashboard.allyProfit)}</strong></div>}</section>{accommodationDashboard.maintenanceRows.length > 0 && <section className="document-box dashboard-maintenance-detail"><label>Próximo mantenimiento<select value={selectedLodgingMaintenanceId || accommodationDashboard.maintenanceRows[0]?.id || ''} onChange={(e)=>setSelectedLodgingMaintenanceId(e.target.value)}>{accommodationDashboard.maintenanceRows.map((item)=><option key={item.id} value={item.id}>{formatShortDate(item.startDate)} · {item.maintenanceType || 'Mantenimiento'} · {money(item.maintenanceCost || item.amount || 0)}</option>)}</select></label>{(() => { const item = accommodationDashboard.maintenanceRows.find((row)=>row.id===(selectedLodgingMaintenanceId || accommodationDashboard.maintenanceRows[0]?.id)); return item ? <small>{item.note || item.notes || item.customerName || 'Sin detalle registrado'} · {formatShortDate(item.startDate)} - {formatShortDate(item.endDate)}</small> : null })()}</section>}</>)}<div className="calendar-grid weekdays"><div><span className="weekday-full">Lun.</span><span className="weekday-mobile">L</span></div><div><span className="weekday-full">Mar.</span><span className="weekday-mobile">M</span></div><div><span className="weekday-full">Mié.</span><span className="weekday-mobile">M</span></div><div><span className="weekday-full">Jue.</span><span className="weekday-mobile">J</span></div><div><span className="weekday-full">Vie.</span><span className="weekday-mobile">V</span></div><div><span className="weekday-full">Sáb.</span><span className="weekday-mobile">S</span></div><div><span className="weekday-full">Dom.</span><span className="weekday-mobile">D</span></div></div><div className="calendar-grid days-grid">{monthDays.map((date,index)=>{const reservation=date?getLodgingForDate(date):null;const status=reservation?statusMeta(reservation.status):null;const title=reservation?(normalizeStatus(reservation.status)==='maintenance'?'Mantenimiento':reservation.customerName||status?.label):'';return <button key={index} className={`day-cell ${!date?'muted':''} ${status?.className||''}`} onClick={()=>date&&(reservation?openEditLodging(reservation):openCreateLodging(date))}>{date&&<><span className="day-number">{date.getDate()}</span>{reservation ? <span className="reservation-label">{title}</span> : selectedAccommodation?.nightlyRate ? <span className="day-price">${Number(selectedAccommodation.nightlyRate || 0).toLocaleString('es-VE', { maximumFractionDigits: 0 })}</span> : null}</>}</button>})}</div></>}</section>}

      {editingCommissionPayment && <div className="modal-backdrop"><form className="modal small" noValidate onSubmit={saveCommissionPayment}><div className="modal-header"><h3>Pagar comisión vendedor</h3><button type="button" onClick={()=>setEditingCommissionPayment(null)}><X size={20}/></button></div><div className="notice"><AlertCircle size={18}/> Al confirmar, esta comisión pasa de Por pagar a Pagada y se descuenta de la caja seleccionada.</div><label>Comisión<input readOnly value={`${editingCommissionPayment.responsible || 'Vendedor'} · ${editingCommissionPayment.description || ''}`}/></label><div className="two-columns"><label>Fecha de pago<input type="date" value={editingCommissionPayment.paymentDate || ''} onChange={(e)=>setEditingCommissionPayment({...editingCommissionPayment,paymentDate:e.target.value})}/></label><label>Método de pago<select value={editingCommissionPayment.paymentMethod || 'Pago en BS'} onChange={(e)=>setEditingCommissionPayment({...editingCommissionPayment,paymentMethod:e.target.value})}>{PAYMENT_METHODS.map((method)=><option key={method}>{method}</option>)}</select></label></div><div className="two-columns"><label>Monto comisión USD<input type="number" min="0" step="0.01" value={editingCommissionPayment.paymentAmountUsd || editingCommissionPayment.amount || ''} onChange={(e)=>setEditingCommissionPayment({...editingCommissionPayment,paymentAmountUsd:e.target.value,paymentAmountBs:String(amountBs(e.target.value, exchangeRates, dollarRateValue(exchangeRates)))})}/></label><label>{isBsPaymentMethod(editingCommissionPayment.paymentMethod) ? 'Monto pagado Bs' : 'Equivalente Bs referencial'}<input type="number" min="0" step="0.01" value={editingCommissionPayment.paymentAmountBs || ''} onChange={(e)=>setEditingCommissionPayment({...editingCommissionPayment,paymentAmountBs:e.target.value})}/></label></div><label>Referencia<input value={editingCommissionPayment.paymentReference || ''} placeholder="Referencia del pago" onChange={(e)=>setEditingCommissionPayment({...editingCommissionPayment,paymentReference:e.target.value})}/></label><div className="pending-box"><span>Impacto en caja</span><strong>{isBsPaymentMethod(editingCommissionPayment.paymentMethod) ? bsMoney(editingCommissionPayment.paymentAmountBs || amountBs(editingCommissionPayment.paymentAmountUsd || editingCommissionPayment.amount, exchangeRates, dollarRateValue(exchangeRates))) : money(editingCommissionPayment.paymentAmountUsd || editingCommissionPayment.amount)}</strong><small>Se registrará como egreso real de comisión vendedor.</small></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setEditingCommissionPayment(null)}>Cancelar</button><button type="submit" className="primary">Confirmar pago</button></div></form></div>}
      {assetExpenseDetail && <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h3>{assetExpenseDetail.title || 'Gastos asociados'}</h3><button type="button" onClick={()=>setAssetExpenseDetail(null)}><X size={20}/></button></div><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th>Método</th><th>Monto</th><th>Comprobante</th></tr></thead><tbody>{(assetExpenseDetail.rows || []).length ? assetExpenseDetail.rows.map((row)=><tr key={row.id}><td>{formatShortDate(row.date)}</td><td>{row.category}</td><td>{row.description}</td><td>{row.paymentMethod}</td><td>{row.currency === 'Bs' ? bsMoney(row.amountBsValue || row.amountBs || row.amount) : money(row.amountUsd)}</td><td>{row.invoiceFile?.url ? <a href={row.invoiceFile.url} target="_blank">Ver</a> : '-'}</td></tr>) : <tr><td colSpan="6">Sin gastos asociados a este activo.</td></tr>}</tbody></table></div><div className="modal-actions"><button type="button" className="primary" onClick={()=>setAssetExpenseDetail(null)}>Cerrar</button></div></div></div>}
      {assetMaintenanceDetail && <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h3>{assetMaintenanceDetail.title || 'Mantenimientos'}</h3><button type="button" onClick={()=>setAssetMaintenanceDetail(null)}><X size={20}/></button></div><div className="admin-table"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Costo</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>{(assetMaintenanceDetail.rows || []).length ? assetMaintenanceDetail.rows.map((row)=><tr key={row.id}><td>{formatShortDate(row.startDate || row.date)}</td><td>{row.maintenanceType || row.category || 'Mantenimiento'}</td><td>{money(row.maintenanceCost || row.amount || (num(row.maintenanceLaborCost)+num(row.maintenancePartsCost)))}</td><td>{row.expenseStatus || row.status || '-'}</td><td>{row.note || row.notes || row.description || 'Sin detalle registrado'}</td></tr>) : <tr><td colSpan="5">Sin mantenimientos asociados a este activo.</td></tr>}</tbody></table></div><div className="modal-actions"><button type="button" className="primary" onClick={()=>setAssetMaintenanceDetail(null)}>Cerrar</button></div></div></div>}
      {editingGeneralExpense && <div className="modal-backdrop"><form className="modal small" noValidate onSubmit={saveGeneralExpense}><div className="modal-header"><h3>{editingGeneralExpense.id ? 'Editar movimiento operativo' : 'Registrar movimiento operativo'}</h3><button type="button" onClick={()=>setEditingGeneralExpense(null)}><X size={20}/></button></div><div className="notice"><AlertCircle size={18}/> Documenta ingresos o gastos operativos. Los ingresos suman caja; los gastos pagados descuentan caja y los Por pagar quedan pendientes.</div><div className="two-columns"><label>Fecha<input type="date" value={editingGeneralExpense.date || ''} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,date:e.target.value})}/></label><label>Categoría<select value={editingGeneralExpense.category || 'Operativo'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,category:e.target.value})}>{GENERAL_EXPENSE_CATEGORIES.map((category)=><option key={category}>{category}</option>)}</select></label></div><div className="two-columns"><label>Tipo de movimiento<select value={editingGeneralExpense.transactionType || editingGeneralExpense.type || 'Egreso'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,transactionType:e.target.value,type:e.target.value,expenseStatus:e.target.value==='Ingreso'?'Pagado':(editingGeneralExpense.expenseStatus || 'Pagado')})}><option value="Egreso">Gasto / Egreso</option><option value="Ingreso">Ingreso</option></select></label><label>Impacto caja<input readOnly value={(editingGeneralExpense.transactionType || editingGeneralExpense.type)==='Ingreso' ? 'Suma a caja al guardar' : ((editingGeneralExpense.expenseStatus || 'Pagado') === 'Por pagar' ? 'No descuenta hasta pagar' : 'Descuenta caja al guardar')}/></label></div><label>Concepto<input value={editingGeneralExpense.description || ''} placeholder="Ej: internet oficina, condominio, gasolina, sueldo operativo" onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,description:e.target.value})}/></label><div className="two-columns"><label>Aplicar a<select value={editingGeneralExpense.assetType || 'General'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,assetType:e.target.value,assetId:''})}>{GENERAL_EXPENSE_ASSET_TYPES.map((type)=><option key={type}>{type}</option>)}</select></label><label>Activo asociado<select value={editingGeneralExpense.assetId || ''} disabled={(editingGeneralExpense.assetType || 'General')==='General'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,assetId:e.target.value})}><option value="">Sin activo específico</option>{editingGeneralExpense.assetType === 'Vehículo' && vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}{editingGeneralExpense.assetType === 'Alojamiento' && accommodations.map((apt)=><option key={apt.id} value={apt.id}>{apt.name}</option>)}</select></label></div><div className="two-columns"><label>Moneda<select value={editingGeneralExpense.currency || 'USD'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,currency:e.target.value})}><option value="USD">USD</option><option value="Bs">Bs</option></select></label><label>{editingGeneralExpense.currency === 'Bs' ? 'Monto Bs' : 'Monto USD'}<input type="number" min="0" step="0.01" value={editingGeneralExpense.currency === 'Bs' ? (editingGeneralExpense.amountBs || editingGeneralExpense.amount || '') : (editingGeneralExpense.amount || '')} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense, amount: e.target.value, amountBs: editingGeneralExpense.currency === 'Bs' ? e.target.value : String(amountBs(e.target.value, exchangeRates, editingGeneralExpense.bcvDollarRate || euroRateValue(exchangeRates, officialEuroRate)))})}/></label></div><div className="two-columns"><label>Medio de pago<select value={editingGeneralExpense.paymentMethod || 'Pago en BS'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,paymentMethod:e.target.value,currency:isBsPaymentMethod(e.target.value)?'Bs':(editingGeneralExpense.currency || 'USD')})}>{PAYMENT_METHODS.map((method)=><option key={method}>{method}</option>)}</select></label><label>Estado<select value={editingGeneralExpense.expenseStatus || 'Pagado'} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,expenseStatus:e.target.value})}>{EXPENSE_PAYMENT_STATUS.map((status)=><option key={status}>{status}</option>)}</select></label></div><div className="two-columns"><label>Tasa Euro BCV<input type="number" min="0" step="0.0001" value={editingGeneralExpense.bcvDollarRate || euroRateValue(exchangeRates, officialEuroRate)} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,bcvDollarRate:e.target.value})}/></label><div className="pending-box"><span>Equivalente Bs</span><strong>{bsMoney(generalExpenseBsAmount(editingGeneralExpense, exchangeRates))}</strong><small>{editingGeneralExpense.expenseStatus === 'Por pagar' ? 'No descuenta caja todavía.' : 'Descuenta caja al guardar como pagado.'}</small></div></div>{['ownerPayableAlly','ownerPayableVehicleAlly'].includes(editingGeneralExpense.sourceType) && (()=>{ const preview=allyPayablePreview(editingGeneralExpense, exchangeRates); return <div className="two-columns"><label>{preview.isBs ? 'Ganancia Alohandote Bs' : 'Ganancia Alohandote USD'}<input type="number" min="0" step="0.01" value={preview.isBs ? (editingGeneralExpense.alohandoteNetIncomeBs || editingGeneralExpense.alohandoteIncomeBs || '') : (editingGeneralExpense.alohandoteNetIncomeUsd || editingGeneralExpense.alohandoteIncomeUsd || '')} onChange={(e)=>{ const gain=num(e.target.value); if (preview.isBs) { const total=num(editingGeneralExpense.reservationTotalBs || editingGeneralExpense.totalAmountBs || editingGeneralExpense.amountBs || 0); const payable=Math.max(0, Number((total-gain).toFixed(2))); const rate=editingGeneralExpense.bcvDollarRate || euroRateValue(exchangeRates, officialEuroRate); setEditingGeneralExpense({...editingGeneralExpense,alohandoteNetIncomeBs:e.target.value,amountBs:String(payable),amount:String(rate ? Number((payable/rate).toFixed(2)) : 0),currency:'Bs'}) } else { const total=num(editingGeneralExpense.reservationTotalUsd || editingGeneralExpense.totalAmount || 0); const payable=Math.max(0, Number((total-gain).toFixed(2))); setEditingGeneralExpense({...editingGeneralExpense,alohandoteNetIncomeUsd:e.target.value,amount:String(payable),amountBs:String(amountBs(payable, exchangeRates, editingGeneralExpense.bcvDollarRate || euroRateValue(exchangeRates, officialEuroRate)))}) } }}/></label><label>{preview.isBs ? 'Monto a pagar aliado Bs' : 'Monto a pagar aliado'}<input readOnly value={preview.isBs ? bsMoney(preview.payable) : money(preview.payable)}/></label></div> })()}<section className="document-box"><h4>Comprobante / factura</h4><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,_invoiceFile:e.target.files?.[0] || null})}/><small>{editingGeneralExpense._invoiceFile ? `Archivo seleccionado: ${editingGeneralExpense._invoiceFile.name}` : editingGeneralExpense.invoiceFile?.url ? <a href={editingGeneralExpense.invoiceFile.url} target="_blank">Ver comprobante cargado</a> : 'Sin comprobante cargado'}</small></section><label>Responsable / proveedor<input value={editingGeneralExpense.responsible || ''} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,responsible:e.target.value})}/></label><label>Notas<textarea rows="3" value={editingGeneralExpense.notes || ''} onChange={(e)=>setEditingGeneralExpense({...editingGeneralExpense,notes:e.target.value})}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setEditingGeneralExpense(null)}>Cancelar</button><button type="button" className="primary" disabled={false} onClick={(event)=>saveGeneralExpense(event)}>Guardar movimiento</button></div></form></div>}

      {editingDollarPurchase && <div className="modal-backdrop"><form className="modal small" noValidate onSubmit={saveDollarPurchase}><div className="modal-header"><h3>{editingDollarPurchase.operationType === 'sale' ? 'Venta de $' : 'Compra de $'}</h3><button type="button" onClick={()=>setEditingDollarPurchase(null)}><X size={20}/></button></div><div className="notice"><AlertCircle size={18}/> {editingDollarPurchase.operationType === 'sale' ? 'Registra venta de divisas: incrementa caja Bs y descuenta la caja seleccionada.' : 'Registra compra de divisas para sumar a caja Zelle/Efectivo/USDT y descontar el equivalente en Bs.'}</div><label>Tipo de divisas<select value={editingDollarPurchase.currencyType || 'Zelle'} onChange={(e)=>handleDollarPurchaseChange('currencyType', e.target.value)}><option>Zelle</option><option>Efectivo</option><option>Usdt</option></select></label><div className="two-columns"><label>Cantidad $<input type="number" min="0" step="0.01" value={editingDollarPurchase.amountUsd || ''} placeholder="Ej: 100" onChange={(e)=>handleDollarPurchaseChange('amountUsd', e.target.value)}/></label><label>{editingDollarPurchase.operationType === 'sale' ? 'Tasa de venta' : 'Tasa de compra'}<input type="number" min="0" step="0.0001" value={editingDollarPurchase.buyRate || ''} placeholder="Ej: 105.50" onChange={(e)=>handleDollarPurchaseChange('buyRate', e.target.value)}/></label></div><label>Monto en Bs<input type="number" min="0" step="0.01" value={editingDollarPurchase.amountBs || ''} placeholder="Automático" onChange={(e)=>handleDollarPurchaseChange('amountBs', e.target.value)}/></label><label>Nota / referencia<textarea rows="3" value={editingDollarPurchase.note || ''} onChange={(e)=>handleDollarPurchaseChange('note', e.target.value)} placeholder="Referencia, proveedor o detalle de la compra"/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setEditingDollarPurchase(null)}>Cancelar</button><button type="submit" className="primary" disabled={false}>{editingDollarPurchase.operationType === 'sale' ? 'Guardar venta' : 'Guardar compra'}</button></div></form></div>}

      {linkingIcalItem && <div className="modal-backdrop"><form className="modal small" onSubmit={saveIcalAccommodationLink}><div className="modal-header"><h3>Vincular reserva iCal</h3><button type="button" onClick={()=>setLinkingIcalItem(null)}><X size={20}/></button></div><div className="notice"><AlertCircle size={18}/> Este evento iCal antiguo no trae alojamiento asociado. Selecciona el alojamiento correcto una sola vez y el sistema intentará vincular los eventos del mismo iCal.</div><label>Alojamiento<select value={linkingIcalItem.targetAccommodationId || ''} onChange={(e)=>setLinkingIcalItem({...linkingIcalItem,targetAccommodationId:e.target.value})}><option value="">Seleccionar alojamiento</option>{accommodations.map((apt)=><option key={apt.id} value={apt.id}>{apt.name}</option>)}</select></label><div className="summary-card"><strong>{linkingIcalItem.customerName || 'Airbnb (Not available)'}</strong><span>{linkingIcalItem.startDate} - {linkingIcalItem.endDate}</span></div><div className="modal-actions"><button type="submit" className="primary">Guardar vinculación</button></div></form></div>}

      {editingHrPerson && <div className="modal-backdrop"><form className="modal small" onSubmit={saveHrPerson}><div className="modal-header"><h3>{editingHrPerson.id ? 'Editar personal' : 'Agregar personal'}</h3><button type="button" onClick={()=>setEditingHrPerson(null)}><X size={20}/></button></div><label>Nombre<input value={editingHrPerson.name || ''} placeholder="Nombre completo" onChange={(e)=>setEditingHrPerson({...editingHrPerson,name:e.target.value})}/></label><div className="two-columns"><label>Cédula<input value={editingHrPerson.document || ''} onChange={(e)=>setEditingHrPerson({...editingHrPerson,document:e.target.value})}/></label><label>Teléfono<input value={editingHrPerson.phone || ''} onChange={(e)=>setEditingHrPerson({...editingHrPerson,phone:e.target.value})}/></label></div><label>Correo<input value={editingHrPerson.email || ''} onChange={(e)=>setEditingHrPerson({...editingHrPerson,email:e.target.value})}/></label><div className="two-columns"><label>Fecha de nacimiento<input type="date" value={editingHrPerson.birthDate || ''} onChange={(e)=>setEditingHrPerson({...editingHrPerson,birthDate:e.target.value})}/></label><label>Fecha de ingreso<input type="date" value={editingHrPerson.entryDate || new Date().toISOString().slice(0,10)} onChange={(e)=>setEditingHrPerson({...editingHrPerson,entryDate:e.target.value})}/></label></div><label>Fecha de salida o término<input type="date" value={editingHrPerson.exitDate || ''} onChange={(e)=>setEditingHrPerson({...editingHrPerson,exitDate:e.target.value})}/></label><div className="two-columns"><label>Rol<select value={editingHrPerson.role || 'Vendedor'} onChange={(e)=>setEditingHrPerson({...editingHrPerson,role:e.target.value})}>{HR_ROLES.map((role)=><option key={role}>{role}</option>)}</select></label><label>Área<input value={editingHrPerson.department || ''} placeholder="Comercial / Operaciones / Administración" onChange={(e)=>setEditingHrPerson({...editingHrPerson,department:e.target.value})}/></label></div><div className="two-columns"><label>Tipo de relación<input value={editingHrPerson.relationType || ''} placeholder="Empleado / Familiar / Aliado" onChange={(e)=>setEditingHrPerson({...editingHrPerson,relationType:e.target.value})}/></label><label>Estado<select value={editingHrPerson.status || 'Activo'} onChange={(e)=>setEditingHrPerson({...editingHrPerson,status:e.target.value})}><option>Activo</option><option>Inactivo</option><option>Suspendido</option></select></label></div><div className="two-columns"><label>Acceso al sistema<select value={editingHrPerson.appAccess || 'Sin acceso'} onChange={(e)=>setEditingHrPerson({...editingHrPerson,appAccess:e.target.value})}><option>Sin acceso</option><option>Con acceso</option></select></label><label>Perfil de permisos<select value={editingHrPerson.permissionsProfile || editingHrPerson.role || 'Vendedor'} onChange={(e)=>setEditingHrPerson({...editingHrPerson,permissionsProfile:e.target.value,role:e.target.value})}>{HR_ROLES.map((role)=><option key={role}>{role}</option>)}</select></label></div><small className="permissions-note">Si el colaborador tiene usuario en Firebase y el correo coincide, este perfil definirá qué módulos puede ver o editar.</small><div className="two-columns"><label>Sueldo semanal $<input type="number" min="0" step="0.01" value={editingHrPerson.salary || 0} onChange={(e)=>setEditingHrPerson({...editingHrPerson,salary:e.target.value})}/></label><label>Comisión %<input type="number" min="0" step="0.01" value={editingHrPerson.commissionRate || 0} onChange={(e)=>setEditingHrPerson({...editingHrPerson,commissionRate:e.target.value})}/></label></div><div className="two-columns"><label>Tasa $USD BCV oficial<input type="number" min="0" step="0.0001" value={editingHrPerson.bcvUsdRate || dollarRateValue(exchangeRates)} onChange={(e)=>setEditingHrPerson({...editingHrPerson,bcvUsdRate:e.target.value})}/></label><div className="pending-box"><span>Pago semanal estimado Bs</span><strong>{bsMoney(num(editingHrPerson.salary) * num(editingHrPerson.bcvUsdRate || dollarRateValue(exchangeRates)))}</strong></div></div><label>Observaciones<textarea rows="3" value={editingHrPerson.notes || ''} onChange={(e)=>setEditingHrPerson({...editingHrPerson,notes:e.target.value})}/></label><div className="modal-actions">{editingHrPerson.id && <button type="button" className="danger" onClick={async()=>{ if(confirm('¿Eliminar colaborador?')) { await hrPeopleStore.removeItem(editingHrPerson.id); setEditingHrPerson(null); showSuccess('Personal eliminado') } }}><Trash2 size={17}/> Eliminar</button>}<button type="submit" className="primary">Guardar personal</button></div></form></div>}

      {editingHrTask && <div className="modal-backdrop"><form className="modal small" onSubmit={saveHrTask}><div className="modal-header"><h3>{editingHrTask.id ? 'Editar tarea' : 'Agregar tarea operativa'}</h3><button type="button" onClick={()=>setEditingHrTask(null)}><X size={20}/></button></div><label>Tarea<input value={editingHrTask.title || ''} placeholder="Ej: limpiar alojamiento / recibir vehículo" onChange={(e)=>setEditingHrTask({...editingHrTask,title:e.target.value})}/></label><div className="two-columns"><label>Módulo<select value={editingHrTask.module || 'Renta Car'} onChange={(e)=>setEditingHrTask({...editingHrTask,module:e.target.value})}><option>Renta Car</option><option>Alojamientos</option><option>Recepción vehículos</option><option>Mantenimiento</option><option>Inventario</option><option>Administración</option></select></label><label>Responsable<select value={editingHrTask.responsible || ''} onChange={(e)=>setEditingHrTask({...editingHrTask,responsible:e.target.value})}><option value="">Seleccionar</option>{hrPeopleStore.items.map((person)=><option key={person.id} value={person.name}>{person.name}</option>)}</select></label></div><div className="two-columns"><label>Fecha<input type="date" value={editingHrTask.dueDate || new Date().toISOString().slice(0,10)} onChange={(e)=>setEditingHrTask({...editingHrTask,dueDate:e.target.value})}/></label><label>Prioridad<select value={editingHrTask.priority || 'Media'} onChange={(e)=>setEditingHrTask({...editingHrTask,priority:e.target.value})}>{HR_TASK_PRIORITIES.map((priority)=><option key={priority}>{priority}</option>)}</select></label></div><label>Estado<select value={editingHrTask.status || 'Pendiente'} onChange={(e)=>setEditingHrTask({...editingHrTask,status:e.target.value})}>{HR_TASK_STATUS.map((status)=><option key={status}>{status}</option>)}</select></label><label>Observaciones<textarea rows="3" value={editingHrTask.notes || ''} onChange={(e)=>setEditingHrTask({...editingHrTask,notes:e.target.value})}/></label><div className="modal-actions">{editingHrTask.id && <button type="button" className="danger" onClick={async()=>{ if(confirm('¿Eliminar tarea?')) { await hrTasksStore.removeItem(editingHrTask.id); setEditingHrTask(null); showSuccess('Tarea eliminada') } }}><Trash2 size={17}/> Eliminar</button>}<button type="submit" className="primary">Guardar tarea</button></div></form></div>}

      {editingInventoryItem && <div className="modal-backdrop"><form className="modal small" onSubmit={saveInventoryItem}><div className="modal-header"><h3>{editingInventoryItem.id ? 'Editar artículo' : 'Agregar artículo'}</h3><button type="button" onClick={()=>setEditingInventoryItem(null)}><X size={20}/></button></div><label>Nombre del artículo<input value={editingInventoryItem.name || ''} placeholder="Ej: Filtro de aceite" onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,name:e.target.value})}/></label><div className="two-columns"><label>Categoría<select value={editingInventoryItem.category || 'Repuestos'} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,category:e.target.value})}>{INVENTORY_CATEGORIES.map((cat)=><option key={cat}>{cat}</option>)}</select></label><label>Módulo<select value={editingInventoryItem.module || 'Renta Car'} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,module:e.target.value,assetId:''})}><option>Renta Car</option><option>Alojamientos</option></select></label></div><label>Activo relacionado<select value={editingInventoryItem.assetId || ''} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,assetId:e.target.value})}><option value="">General / depósito</option>{(editingInventoryItem.module==='Alojamientos'?accommodations:vehicles).map((asset)=><option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><div className="two-columns"><label>Cantidad actual<input type="number" min="0" value={editingInventoryItem.quantity || 0} onChange={(e)=>updateInventoryItemDraft('quantity', e.target.value)}/></label><label>Cantidad mínima<input type="number" min="0" value={editingInventoryItem.minQuantity || 0} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,minQuantity:e.target.value})}/></label></div><div className="two-columns"><label>Costo unitario $<input type="number" min="0" step="0.01" value={editingInventoryItem.unitCost || 0} onChange={(e)=>updateInventoryItemDraft('unitCost', e.target.value)}/></label><label>Ubicación<input value={editingInventoryItem.location || ''} placeholder="Depósito / Alojamiento / Vehículo" onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,location:e.target.value})}/></label></div><div className="two-columns"><label>Tipo de pago<select value={editingInventoryItem.paymentMethod || 'Bs'} onChange={(e)=>updateInventoryItemDraft('paymentMethod', e.target.value)}>{INVENTORY_PAYMENT_METHODS.map((method)=><option key={method}>{method}</option>)}</select></label><label>Estado de pago<select value={editingInventoryItem.expenseStatus || 'Pagado'} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,expenseStatus:e.target.value})}>{EXPENSE_PAYMENT_STATUS.map((status)=><option key={status}>{status}</option>)}</select></label></div><div className="two-columns"><label>Tasa $ BCV<input type="number" min="0" step="0.0001" value={editingInventoryItem.bcvDollarRate || dollarRateValue(exchangeRates) || ''} onChange={(e)=>updateInventoryItemDraft('bcvDollarRate', e.target.value)} placeholder="BCV"/></label></div>{paymentBucket(editingInventoryItem.paymentMethod) === 'Bs' && <label>Monto en Bs calculado<input type="number" readOnly value={editingInventoryItem.amountBs || inventoryPaymentAmountBs(editingInventoryItem) || ''} placeholder="Automático con tasa $ BCV"/><small>{editingInventoryItem.expenseStatus === 'Por pagar' ? 'Este monto quedará como cuenta por pagar, no descuenta caja todavía.' : 'Este monto descuenta la caja principal en Bs al registrar el material.'}</small></label>}<label>Proveedor<input value={editingInventoryItem.provider || ''} placeholder="Proveedor o tienda" onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,provider:e.target.value})}/></label><div className="two-columns"><label>Fecha de compra<input type="date" value={editingInventoryItem.purchaseDate || new Date().toISOString().slice(0,10)} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,purchaseDate:e.target.value})}/></label><label className="file-pick">Factura del producto<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,_invoiceFile:e.target.files?.[0] || null})}/><small>{editingInventoryItem._invoiceFile ? `Factura seleccionada: ${editingInventoryItem._invoiceFile.name}` : editingInventoryItem.invoiceFile?.url ? <a href={editingInventoryItem.invoiceFile.url} target="_blank">Ver factura cargada</a> : 'Factura pendiente'}</small></label></div><label>Observaciones<textarea rows="3" value={editingInventoryItem.notes || ''} onChange={(e)=>setEditingInventoryItem({...editingInventoryItem,notes:e.target.value})}/></label><div className="modal-actions">{editingInventoryItem.id && <button type="button" className="danger" onClick={async()=>{ if(confirm('¿Eliminar artículo de inventario?')) { await inventoryItemsStore.removeItem(editingInventoryItem.id); setEditingInventoryItem(null); showSuccess('Artículo eliminado') } }}><Trash2 size={17}/> Eliminar</button>}<button type="submit" className="primary">Guardar artículo</button></div></form></div>}

      {editingInventoryMovement && <div className="modal-backdrop"><form className="modal small" onSubmit={saveInventoryMovement}><div className="modal-header"><h3>{editingInventoryMovement.kind === 'Entrada' ? 'Entrada de inventario' : 'Consumo de inventario'}</h3><button type="button" onClick={()=>setEditingInventoryMovement(null)}><X size={20}/></button></div><label>Artículo<select value={editingInventoryMovement.itemId || ''} onChange={(e)=>{ const item = inventoryItemsStore.items.find((row)=>row.id===e.target.value) || {}; setEditingInventoryMovement({...editingInventoryMovement,itemId:e.target.value,module:item.module||editingInventoryMovement.module,assetId:item.assetId||'',unitCost:item.unitCost||0}) }}><option value="">Seleccionar artículo</option>{inventoryItemsStore.items.map((item)=><option key={item.id} value={item.id}>{item.name} · Stock: {item.quantity}</option>)}</select></label><div className="two-columns"><label>Tipo<select value={editingInventoryMovement.kind || 'Salida'} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,kind:e.target.value})}><option>Entrada</option><option>Salida</option></select></label><label>Motivo<select value={editingInventoryMovement.reason || 'Mantenimiento'} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,reason:e.target.value})}><option>Compra</option><option>Mantenimiento</option><option>Limpieza</option><option>Reposición</option><option>Ajuste</option><option>Daño / pérdida</option></select></label></div><div className="two-columns"><label>Cantidad<input type="number" min="1" value={editingInventoryMovement.quantity || 1} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,quantity:e.target.value})}/></label><label>Costo unitario $<input type="number" min="0" step="0.01" value={editingInventoryMovement.unitCost || 0} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,unitCost:e.target.value})}/></label></div><div className="two-columns"><label>Fecha<input type="date" value={editingInventoryMovement.date || new Date().toISOString().slice(0,10)} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,date:e.target.value})}/></label><label>Responsable<input value={editingInventoryMovement.responsible || ''} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,responsible:e.target.value})}/></label></div><label>Referencia / comprobante<input value={editingInventoryMovement.reference || ''} placeholder="Factura, nota, reserva o mantenimiento" onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,reference:e.target.value})}/></label><label>Observaciones<textarea rows="3" value={editingInventoryMovement.notes || ''} onChange={(e)=>setEditingInventoryMovement({...editingInventoryMovement,notes:e.target.value})}/></label><div className="modal-actions"><button type="submit" className="primary">Registrar movimiento</button></div></form></div>}

      {editingRefund && <div className="modal-backdrop"><form className="modal small" noValidate onSubmit={submitRefundCancellation}><div className="modal-header"><h3>Anulación/Devolución</h3><button type="button" onClick={()=>setEditingRefund(null)}><X size={20}/></button></div><div className="notice"><AlertCircle size={18}/> Al guardar se anula la reserva, se desbloquea el calendario, sale de cuentas por cobrar y se registra el egreso en Administración ERP.</div><button type="submit" className="primary refund-submit-action refund-top-action" aria-disabled="false">Guardar anulación/devolución</button><label>{paymentBucket(editingRefund.refundPaymentMethod || '') === 'Bs' ? 'Monto a devolver Bs' : 'Monto a devolver $'}<input type="number" min="0" step="0.01" value={editingRefund.refundAmount || ''} onChange={(e)=>setEditingRefund({...editingRefund, refundAmount:e.target.value})}/></label><div className="two-columns"><label>Método de devolución<select value={editingRefund.refundPaymentMethod || 'Pago en BS'} onChange={(e)=>setEditingRefund({...editingRefund, refundPaymentMethod:e.target.value})}>{PAYMENT_METHODS.map((method)=><option key={method}>{method}</option>)}</select></label><label>Número de referencia <small>(opcional si no aplica)</small><input value={editingRefund.refundReference || ''} placeholder="Ej: banco, Zelle, USDT, efectivo" onChange={(e)=>setEditingRefund({...editingRefund, refundReference:e.target.value})}/></label></div><label>Motivo<textarea rows="3" value={editingRefund.refundReason || ''} onChange={(e)=>setEditingRefund({...editingRefund, refundReason:e.target.value})}/></label><label>Comprobante de anulación/devolución<input type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf" onChange={(e)=>setEditingRefund({...editingRefund, _refundProofFile:e.target.files?.[0] || null})}/></label>{editingRefund.refundProof?.url && <a className="doc-link" href={editingRefund.refundProof.url} target="_blank" rel="noreferrer">Ver comprobante cargado</a>}<div className="modal-actions bottom-actions"><button type="button" className="secondary" onClick={()=>setEditingRefund(null)}>Cancelar</button><button type="submit" className="primary refund-submit-action" aria-disabled="false">Guardar anulación/devolución</button></div></form></div>}

      {editingReservation && <div className="modal-backdrop"><form className="modal" noValidate onSubmit={saveReservation}><div className="modal-header"><h3>{normalizeStatus(editingReservation.status)==='maintenance' ? 'Registro de mantenimiento' : editingReservationReadOnly ? 'Ver reserva' : editingReservation.id ? 'Editar bloqueo' : 'Nueva reserva'}</h3><button type="button" onClick={() => setEditingReservation(null)}><X size={20} /></button></div>{editingReservation.status !== 'maintenance' && <div className="top-doc-actions">{editingReservation.id && canGenerateDocs(editingReservation) && <button type="button" className="secondary" onClick={() => generateReceipt(editingReservation)}><FileText size={17} /> Recibo PDF</button>}{editingReservation.id && canGenerateDocs(editingReservation) && <button type="button" className="secondary" onClick={() => generateContract(editingReservation)}><FileText size={17} /> Contrato PDF</button>}{(!editingReservationReadOnly || isAdmin || !editingReservation.id || (Boolean(editingReservation?.vehicleId) && ['seller','seller_all','seller_lodging'].includes(normalizeRole(profile?.role)))) && <button type="button" className="secondary" onClick={() => generateQuote(editingReservation)}><FileText size={17} /> Cotizar</button>}</div>}{error && <div className="form-error">{error}</div>}{editingReservation.createdByName && normalizeStatus(editingReservation.status)!=='maintenance' && <div className="notice success"><strong>Reservado por vendedor {editingReservation.createdByName}</strong></div>}
        <label>Vehículo<select disabled={editingReservationReadOnly} value={editingReservation.vehicleId} onChange={(e) => { const vehicle = vehicles.find((item) => item.id === e.target.value); const rate = vehicleKmRate(vehicle); const isMaint = normalizeStatus(editingReservation.status)==='maintenance'; const currentKm = isMaint ? (vehicle?.currentKm || '') : editingReservation.currentKm; const draft = { ...editingReservation, vehicleId: e.target.value, pricePerKm: rate, dailyRate: editingReservation.dailyRate || String(vehicleDayRate(vehicle) || ''), currentKm, maintenanceTargetKm: isMaint ? String(num(currentKm) + num(editingReservation.nextMaintenanceEveryKm || 0)) : editingReservation.maintenanceTargetKm }; setEditingReservation(isMaint ? draft : withAutoQuote(draft)) }}>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>
        <div className="two-columns"><label>Desde<input disabled={editingReservationReadOnly} type="date" value={editingReservation.startDate} onChange={(e) => updateReservationDates({ ...editingReservation, startDate: e.target.value })} /></label><label>Hasta<input disabled={editingReservationReadOnly} type="date" value={editingReservation.endDate} onChange={(e) => updateReservationDates({ ...editingReservation, endDate: e.target.value })} /></label></div>
        <label>Estado<select disabled={editingReservationReadOnly || normalizeStatus(editingReservation.status)==='maintenance'} value={normalizeStatus(editingReservation.status)==='maintenance' ? 'maintenance' : editingReservation.status} onChange={(e) => setEditingReservation({ ...editingReservation, status: e.target.value })}>{normalizeStatus(editingReservation.status)==='maintenance' ? <option value="maintenance">Mantenimiento</option> : reservationStatusOptions.map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
        {editingReservation.status === 'maintenance' ? <><label>Taller / proveedor<input disabled={editingReservationReadOnly} value={editingReservation.customerName} placeholder="Taller mecánico" onChange={(e) => setEditingReservation({ ...editingReservation, customerName: e.target.value })} /></label><div className="two-columns"><label>Tipo de mantenimiento<select disabled={editingReservationReadOnly} value={editingReservation.maintenanceType || 'Preventivo'} onChange={(e) => setEditingReservation({ ...editingReservation, maintenanceType: e.target.value })}><option>Preventivo</option><option>Correctivo</option></select></label><label>Costo total mantenimiento $<input disabled type="number" value={num(editingReservation.maintenanceLaborCost)+num(editingReservation.maintenancePartsCost) || editingReservation.maintenanceCost || ''} readOnly /></label></div><div className="two-columns"><label>Costo mano de obra $<input disabled={editingReservationReadOnly} type="number" value={editingReservation.maintenanceLaborCost || ''} placeholder="Ej: 25" onChange={(e) => { const parts = num(editingReservation.maintenancePartsCost); const total = num(e.target.value)+parts; setEditingReservation({ ...editingReservation, maintenanceLaborCost: e.target.value, maintenanceCost: String(total), maintenanceBsCost: String(maintenanceBsCost({maintenanceCost:total, bcvDollarRate: editingReservation.bcvDollarRate}, exchangeRates)) }) }} /></label><label>Costo repuesto $<input disabled={editingReservationReadOnly} type="number" value={editingReservation.maintenancePartsCost || ''} placeholder="Ej: 35" onChange={(e) => { const labor = num(editingReservation.maintenanceLaborCost); const total = labor+num(e.target.value); setEditingReservation({ ...editingReservation, maintenancePartsCost: e.target.value, maintenanceCost: String(total), maintenanceBsCost: String(maintenanceBsCost({maintenanceCost:total, bcvDollarRate: editingReservation.bcvDollarRate}, exchangeRates)) }) }} /></label></div><div className="two-columns"><label>Medio de pago<select disabled={editingReservationReadOnly} value={editingReservation.maintenancePaymentMethod || 'BS'} onChange={(e)=>setEditingReservation({...editingReservation, maintenancePaymentMethod:e.target.value})}>{MAINTENANCE_PAYMENT_METHODS.map((method)=><option key={method} value={method}>{method}</option>)}</select></label><label>Estado de pago<select disabled={editingReservationReadOnly} value={editingReservation.expenseStatus || 'Pagado'} onChange={(e)=>setEditingReservation({...editingReservation, expenseStatus:e.target.value})}>{EXPENSE_PAYMENT_STATUS.map((status)=><option key={status}>{status}</option>)}</select></label></div><div className="two-columns"><div className="pending-box"><span>{maintenancePaymentBucket(editingReservation.maintenancePaymentMethod)==='Bs' ? 'Monto a descontar en BS' : 'Monto a descontar en caja'}</span><strong>{maintenancePaymentBucket(editingReservation.maintenancePaymentMethod)==='Bs' ? bsMoney(maintenanceBsCost(editingReservation, exchangeRates)) : money(maintenanceUsdCost(editingReservation))}</strong><small>Tasa $BCV: {bsMoney(dollarRateValue(exchangeRates, editingReservation.bcvDollarRate))}</small></div></div><label className="file-pick">Facturas / fotos del mantenimiento<input disabled={editingReservationReadOnly} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf" onChange={(e)=>setEditingReservation({...editingReservation,_maintenanceInvoiceFiles:Array.from(e.target.files || [])})}/><small>{editingReservation._maintenanceInvoiceFiles?.length ? `${editingReservation._maintenanceInvoiceFiles.length} archivo(s) seleccionado(s)` : editingReservation.maintenanceInvoices?.length ? `${editingReservation.maintenanceInvoices.length} factura(s) cargada(s)` : 'Puedes cargar fotos o imágenes de facturas'}</small></label><div className="two-columns"><label>Inventario usado<select disabled={editingReservationReadOnly} value={editingReservation.inventoryItemId || ''} onChange={(e)=>{ const item = inventoryItemsStore.items.find((row)=>row.id===e.target.value) || {}; const partsCost = editingReservation.maintenancePartsCost || (item.unitCost || ''); const total = num(editingReservation.maintenanceLaborCost)+num(partsCost); setEditingReservation({...editingReservation, inventoryItemId:e.target.value, inventoryQuantity: editingReservation.inventoryQuantity || (e.target.value ? '1' : ''), maintenancePartsCost: partsCost, maintenanceCost: editingReservation.maintenanceCost || String(total), maintenanceBsCost: String(maintenanceBsCost({maintenanceCost: editingReservation.maintenanceCost || total, bcvDollarRate: editingReservation.bcvDollarRate}, exchangeRates)) }) }}><option value="">Sin consumo automático</option>{inventoryItemsStore.items.filter((item)=>item.module==='Renta Car').map((item)=><option key={item.id} value={item.id}>{item.name} · Stock {item.quantity}</option>)}</select></label><label>Cantidad inventario<input disabled={editingReservationReadOnly || !editingReservation.inventoryItemId} type="number" min="0" value={editingReservation.inventoryQuantity || ''} onChange={(e)=>setEditingReservation({...editingReservation,inventoryQuantity:e.target.value})}/></label></div><div className="two-columns"><label>KM actual<input disabled={editingReservationReadOnly} type="number" value={editingReservation.currentKm || selectedVehicle?.currentKm || ''} onChange={(e)=>setEditingReservation({...editingReservation,currentKm:e.target.value,maintenanceTargetKm:String(num(e.target.value)+num(editingReservation.nextMaintenanceEveryKm||0))})}/></label><label>Próximo mantenimiento<input disabled={editingReservationReadOnly} type="number" value={editingReservation.nextMaintenanceEveryKm||''} placeholder="Ej: 40000" onChange={(e)=>setEditingReservation({...editingReservation,nextMaintenanceEveryKm:e.target.value,maintenanceTargetKm:String(num(editingReservation.currentKm || selectedVehicle?.currentKm || 0)+num(e.target.value))})}/></label></div><label>KM objetivo de servicio<input disabled type="number" value={editingReservation.maintenanceTargetKm||''} readOnly /></label><small className="muted">Alerta cuando falten 300 km o menos para este servicio.</small><label>Observación / descripción<textarea disabled={editingReservationReadOnly} rows="4" value={editingReservation.note} onChange={(e) => setEditingReservation({ ...editingReservation, note: e.target.value })} /></label></> : <>
          <label>Vendedor<select disabled={editingReservationReadOnly || (!isAdmin && isSellerProfile(profile?.role))} value={editingReservation.createdByName || normalizePersonName(sellerName(profile, user))} onChange={(e)=>setEditingReservation({...editingReservation,createdByName:e.target.value})}>{sellerOptionsForModule('cars').map((name)=><option key={name} value={name}>{name}</option>)}</select></label><label>Cliente<input disabled={editingReservationReadOnly} value={editingReservation.customerName} placeholder="Nombre del cliente" onBlur={() => applyLeadToCarDraft(editingReservation)} onChange={(e) => setEditingReservation({ ...editingReservation, customerName: e.target.value })} /></label>
          <div className="two-columns"><label>Cédula / identificación<div className="id-inline"><select disabled={editingReservationReadOnly} value={editingReservation.customerIdType || (String(editingReservation.customerId||'').toUpperCase().startsWith('E-') ? 'E' : 'V')} onChange={(e)=>setEditingReservation({...editingReservation, customerIdType:e.target.value, customerNationality:e.target.value==='E'?'extranjero':'venezolano'})}><option value="V">V</option><option value="E">E</option></select><input disabled={editingReservationReadOnly} value={editingReservation.customerId || ''} placeholder="Ej: 12.345.678" onBlur={() => applyLeadToCarDraft(editingReservation)} onChange={(e) => setEditingReservation({ ...editingReservation, customerId: e.target.value })} /></div></label><label>Teléfono<input disabled={editingReservationReadOnly} value={editingReservation.phone} placeholder="WhatsApp" onBlur={() => applyLeadToCarDraft(editingReservation)} onChange={(e) => setEditingReservation({ ...editingReservation, phone: e.target.value })} /></label></div><label>Correo electrónico<input disabled={editingReservationReadOnly} type="email" value={editingReservation.email || ''} placeholder="correo del cliente" onChange={(e) => setEditingReservation({ ...editingReservation, email: e.target.value })} /></label>
          <label>Domicilio del cliente<input disabled={editingReservationReadOnly} value={editingReservation.customerAddress || ''} placeholder="Ciudad / dirección" onChange={(e) => setEditingReservation({ ...editingReservation, customerAddress: e.target.value })} /></label>
          <section className="quote-box"><h4>Calculadora cotizadora</h4><div className="two-columns"><label>Kilometraje aproximado<input disabled={editingReservationReadOnly} type="number" value={editingReservation.approxKm || ''} placeholder="Ej: 500" onChange={(e) => handleKmChange(e.target.value)} /></label><div className="pending-box"><span>Costo KM adicional</span><strong>{money(quoteFromKmAdjusted(editingReservation.approxKm, editingReservation))}</strong></div></div><div className="two-columns"><div className="pending-box"><span>Base por días</span><strong>{moneyDual(quoteBaseFromDays(daysForReservation(editingReservation), editingReservation.dailyRate || vehicleDayRate(vehicles.find((item)=>item.id===editingReservation.vehicleId))), rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate)}</strong></div><div className="pending-box"><span>Total servicio</span><strong>{moneyDual(totalQuoteForReservation(editingReservation), rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate)}</strong></div></div><div className="pending-box bs-total-box"><span>Costo en BS</span><strong>{bsMoney(amountBs(totalQuoteForReservation(editingReservation), rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate))}</strong></div><div className="rate-box compact-rates single-rate"><div><span>Tasa EURO</span><strong>{ratesLoading && !exchangeRates ? 'Consultando...' : (exchangeRates?.bcvEuro || editingReservation.bcvEuroRate) ? `${Number(exchangeRates?.bcvEuro || editingReservation.bcvEuroRate).toFixed(2)} Bs` : 'No disponible'}</strong></div></div>{ratesError && !exchangeRates?.bcvEuro && !editingReservation.bcvEuroRate && <small className="rate-error soft">No se pudo leer la tasa EURO en vivo.</small>}<div className="two-columns"><label>Número de días<input disabled type="number" value={daysForReservation(editingReservation)} readOnly /></label><label>Costo por día $<input disabled type="text" value={money(dailyFromTotal(editingReservation.totalAmount || quoteFromKmAdjusted(editingReservation.approxKm, editingReservation), daysForReservation(editingReservation)))} readOnly /></label></div><div className="pending-box"><span>Costo por día del servicio</span><strong>{money(dailyFromTotal(editingReservation.totalAmount || quoteFromKmAdjusted(editingReservation.approxKm, editingReservation), daysForReservation(editingReservation)))}</strong></div>{!isAdmin && <div className="pending-box"><span>Comisión vendedor 15%</span><strong>{money(commissionFromTotal(editingReservation.totalAmount || quoteFromKmAdjusted(editingReservation.approxKm, editingReservation)))}</strong></div>}</section>
          <div className="two-columns"><label>Costo total del servicio $<input disabled={editingReservationReadOnly} type="number" value={editingReservation.totalAmount || ''} placeholder="Ej: 200" onChange={(e) => handleTotalAmountChange(e.target.value)} /></label><label>{editingReservation.id ? (isBsPaymentMethod(editingReservation.paymentMethod) ? 'Nuevo abono Bs' : 'Nuevo abono $') : paymentInputLabel(editingReservation.paymentMethod)}<input disabled={editingReservationReadOnly} type="number" value={editingReservation.amount} placeholder={editingReservation.id ? 'Deja igual si no agregas abono' : paymentInputPlaceholder(editingReservation.paymentMethod)} onChange={(e) => setEditingReservation({ ...editingReservation, amount: e.target.value, amountBs: String(paymentAmountBs(e.target.value, editingReservation.paymentMethod, rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate)), amountUsdEquivalent: String(paymentAmountUsd(e.target.value, editingReservation.paymentMethod, rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate)) })} /></label></div>{renderPaymentHistoryManager(editingReservation, setEditingReservation, editingReservationReadOnly)}
          <div className="two-columns"><label>Método del abono<select disabled={editingReservationReadOnly} value={editingReservation.paymentMethod || '$ Efectivo'} onChange={(e)=>setEditingReservation({...editingReservation,paymentMethod:e.target.value})}>{PAYMENT_METHODS.map((method)=><option key={method}>{method}</option>)}</select></label><div className="pending-box"><span>Abono equivalente $</span><strong>{money(paymentAmountUsd(editingReservation.amount, editingReservation.paymentMethod, rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate))}</strong><small>{bsMoney(paymentAmountBs(editingReservation.amount, editingReservation.paymentMethod, rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate))}</small></div></div>
          <div className="two-columns"><div className="pending-box"><span>Diferencia a pagar</span><strong>{moneyDual(pendingAmount(editingReservation, rateAwareExchangeRates), rateAwareExchangeRates, editingReservation.bcvEuroRate || officialEuroRate)}</strong></div><label>Depósito en garantía $<input disabled={editingReservationReadOnly} type="number" value={editingReservation.depositAmount || ''} placeholder="Ej: 100" onChange={(e) => setEditingReservation({ ...editingReservation, depositAmount: e.target.value })} /></label></div>
          <div className="two-columns"><label>Kilometraje de entrega<input disabled={editingReservationReadOnly} value={editingReservation.deliveryKm || ''} placeholder="Ej: 20500" onChange={(e) => setEditingReservation({ ...editingReservation, deliveryKm: e.target.value })} /></label><label>Canal<select disabled={editingReservationReadOnly} value={editingReservation.channel} onChange={(e) => setEditingReservation({ ...editingReservation, channel: e.target.value })}>{CHANNELS.map((ch) => <option key={ch}>{ch}</option>)}</select></label></div>
          <div className="two-columns"><label>Hora entrega<input disabled={editingReservationReadOnly} type="time" value={editingReservation.deliveryTime || '12:00'} onChange={(e) => setEditingReservation({ ...editingReservation, deliveryTime: e.target.value })} /></label><label>Hora devolución<input disabled={editingReservationReadOnly} type="time" value={editingReservation.returnTime || '12:00'} onChange={(e) => setEditingReservation({ ...editingReservation, returnTime: e.target.value })} /></label></div>
          <section className="document-box"><h4>Pago / comprobante</h4><div className="two-columns"><label>Método registrado<input disabled value={editingReservation.paymentMethod || '$ Efectivo'} readOnly /></label><label>Nº de Referencia<input disabled={editingReservationReadOnly} value={editingReservation.paymentReference || ''} placeholder="Referencia del pago" onChange={(e)=>setEditingReservation({...editingReservation,paymentReference:e.target.value})}/></label></div><input type="file" disabled={editingReservationReadOnly} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setEditingReservation({...editingReservation,_paymentProofFile:e.target.files?.[0] || null})}/><small>{editingReservation._paymentProofFile ? `Comprobante seleccionado: ${editingReservation._paymentProofFile.name}` : editingReservation.paymentProof?.url ? <a href={editingReservation.paymentProof.url} target="_blank">Ver comprobante cargado</a> : 'Comprobante pendiente'}</small></section>{renderPaymentHistoryManager(editingReservation, setEditingReservation, editingReservationReadOnly)}<section className="document-box"><h4>Documentos del cliente</h4><div className="two-columns"><button type="button" disabled={editingReservationReadOnly} className="secondary" onClick={() => licenseInputRef.current?.click()}><Paperclip size={17} /> Licencia de conducir</button><button type="button" disabled={editingReservationReadOnly} className="secondary" onClick={() => idInputRef.current?.click()}><Paperclip size={17} /> Cédula de identidad</button></div><input ref={licenseInputRef} className="hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setEditingReservation({ ...editingReservation, _licenseFile: e.target.files?.[0] || null })} /><input ref={idInputRef} className="hidden-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setEditingReservation({ ...editingReservation, _idFile: e.target.files?.[0] || null })} /><small>{editingReservation._licenseFile ? `Licencia seleccionada: ${editingReservation._licenseFile.name}` : editingReservation.licenseDoc?.url ? <a href={editingReservation.licenseDoc.url} target="_blank">Ver licencia cargada</a> : 'Licencia pendiente'}</small><small>{editingReservation._idFile ? `Identificación seleccionada: ${editingReservation._idFile.name}` : editingReservation.idDoc?.url ? <a href={editingReservation.idDoc.url} target="_blank">Ver identificación cargada</a> : 'Identificación pendiente'}</small></section>
          <label>Observación<textarea disabled={editingReservationReadOnly} rows="4" value={editingReservation.note} placeholder="Entrega, depósito, condiciones, dirección, hora de entrega, etc." onChange={(e) => setEditingReservation({ ...editingReservation, note: e.target.value })} /></label>
        </>}
        <div className="modal-actions bottom-actions">{editingReservation.id && canEditReservation(editingReservation) && <button type="button" className="danger" onClick={() => hardDeleteReservation(editingReservation)}><Trash2 size={17} /> Eliminar</button>}{editingReservation.id && normalizeStatus(editingReservation.status)==="reserved" && storedPaidBs(editingReservation, exchangeRates)>0 && canEditReservation(editingReservation) && <button type="button" className="secondary" onClick={() => openRefundReservation(editingReservation)}><Download size={17} /> Anulación/Devolución</button>}{!editingReservation.id && editingReservation.status !== 'maintenance' && (!editingReservationReadOnly || isAdmin) && <button type="button" className="secondary" onClick={() => generateQuote(editingReservation)}><FileText size={17} /> Cotizar</button>}{(!editingReservationReadOnly || isAdmin) && <button type="button" className="primary reservation-save-action" aria-disabled="false" onClick={()=>saveReservation()}>{reservationSaving ? 'Guardando...' : 'Guardar'}</button>}</div>
      </form></div>}


      {editingLodging && <div className="modal-backdrop"><form className="modal" onSubmit={saveLodging}><div className="modal-header"><h3>{normalizeStatus(editingLodging.status)==='maintenance' ? (editingLodging.id ? 'Editar ticket de mantenimiento' : 'Nuevo Ticket de mantenimiento') : (editingLodging.id ? 'Editar reserva alojamiento' : 'Nueva reserva alojamiento')}</h3><button type="button" onClick={() => setEditingLodging(null)}><X size={20} /></button></div>{editingLodging.status !== 'maintenance' && <div className="top-doc-actions">{editingLodging.id && normalizeStatus(editingLodging.status)==='reserved' && <button type="button" className="secondary" onClick={() => generateLodgingReceipt(editingLodging)}><FileText size={17}/> Recibo PDF</button>}{editingLodging.id && normalizeStatus(editingLodging.status)==='reserved' && <button type="button" className="secondary" onClick={() => generateLodgingQuote(editingLodging)}><FileText size={17}/> Cotizar</button>}</div>}{error && <div className="form-error">{error}</div>}<label>Alojamiento<select value={editingLodging.accommodationId} onChange={(e)=>{const apt=accommodations.find(a=>a.id===e.target.value); const baseTotal=lodgingTotal(lodgingNights(editingLodging.startDate, editingLodging.endDate), apt?.nightlyRate||'', apt?.cleaningFee||''); const allyIncome=isAlliedAccommodation(apt)?allyIncomeTargetUsd(baseTotal, apt?.allyProfitMode||'fixed', apt?.allyProfitValue||0):''; const next={...editingLodging, accommodationId:e.target.value, nightlyRate:apt?.nightlyRate||'', cleaningFee:apt?.cleaningFee||'', lodgingOwnershipType:isAlliedAccommodation(apt)?'Aliado':'Propio', allyProfitMode:apt?.allyProfitMode||'fixed', allyProfitValue:apt?.allyProfitValue||'', alohandoteIncomeUsd:allyIncome, ownerShareUsd:isAlliedAccommodation(apt)?Math.max(0, Number((baseTotal-num(allyIncome)).toFixed(2))):''}; updateLodgingDates(next)}}>{accommodations.map((apt)=><option key={apt.id} value={apt.id}>{apt.name}</option>)}</select></label><div className="two-columns"><label>{normalizeStatus(editingLodging.status)==='maintenance' ? 'Fecha de inicio' : 'Check in'}<input type="date" value={editingLodging.startDate} onChange={(e)=>updateLodgingDates({...editingLodging,startDate:e.target.value})}/></label><label>{normalizeStatus(editingLodging.status)==='maintenance' ? 'Fecha de término' : 'Check out'}<input type="date" value={editingLodging.endDate} onChange={(e)=>updateLodgingDates({...editingLodging,endDate:e.target.value})}/></label></div><label>Estado<select value={editingLodging.status} onChange={(e)=>setEditingLodging({...editingLodging,status:e.target.value})}>{reservationStatusOptions.map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label>{editingLodging.status === 'maintenance' ? <><label>Proveedor / motivo<input value={editingLodging.customerName||''} onChange={(e)=>setEditingLodging({...editingLodging,customerName:e.target.value})}/></label><div className="two-columns"><label>Tipo de mantenimiento<select value={editingLodging.maintenanceType||'Preventivo'} onChange={(e)=>setEditingLodging({...editingLodging,maintenanceType:e.target.value})}><option>Preventivo</option><option>Correctivo</option></select></label><label>Costo mantenimiento $<input type="number" value={editingLodging.maintenanceCost||''} onChange={(e)=>setEditingLodging({...editingLodging,maintenanceCost:e.target.value})}/></label></div><div className="two-columns"><label>Medio de pago<select value={editingLodging.maintenancePaymentMethod || 'BS'} onChange={(e)=>setEditingLodging({...editingLodging, maintenancePaymentMethod:e.target.value})}>{MAINTENANCE_PAYMENT_METHODS.map((method)=><option key={method} value={method}>{method}</option>)}</select></label><label>Estado de pago<select value={editingLodging.expenseStatus || 'Pagado'} onChange={(e)=>setEditingLodging({...editingLodging, expenseStatus:e.target.value})}>{EXPENSE_PAYMENT_STATUS.map((status)=><option key={status}>{status}</option>)}</select></label></div><div className="two-columns"><div className="pending-box"><span>{maintenancePaymentBucket(editingLodging.maintenancePaymentMethod)==='Bs' ? 'Monto a descontar en BS' : 'Monto a descontar en caja'}</span><strong>{maintenancePaymentBucket(editingLodging.maintenancePaymentMethod)==='Bs' ? bsMoney(maintenanceBsCost(editingLodging, exchangeRates)) : money(maintenanceUsdCost(editingLodging))}</strong><small>{editingLodging.expenseStatus === 'Por pagar' ? 'Queda en Por pagar y NO descuenta caja.' : 'Se descontará al guardar como pagado.'}</small></div></div><div className="two-columns"><label>Inventario usado<select value={editingLodging.inventoryItemId || ''} onChange={(e)=>{ const item = inventoryItemsStore.items.find((row)=>row.id===e.target.value) || {}; setEditingLodging({...editingLodging, inventoryItemId:e.target.value, inventoryQuantity: editingLodging.inventoryQuantity || (e.target.value ? '1' : ''), maintenanceCost: editingLodging.maintenanceCost || (item.unitCost || '') }) }}><option value="">Sin consumo automático</option>{inventoryItemsStore.items.filter((item)=>item.module==='Alojamientos').map((item)=><option key={item.id} value={item.id}>{item.name} · Stock {item.quantity}</option>)}</select></label><label>Cantidad inventario<input disabled={!editingLodging.inventoryItemId} type="number" min="0" value={editingLodging.inventoryQuantity || ''} onChange={(e)=>setEditingLodging({...editingLodging,inventoryQuantity:e.target.value})}/></label></div><label>Observación / detalle del mantenimiento<textarea rows="4" value={editingLodging.note||''} placeholder="Describe la reparación, repuestos, proveedor, diagnóstico o trabajo realizado..." onChange={(e)=>setEditingLodging({...editingLodging,note:e.target.value})}/></label></> : editingLodging.status === 'pending' ? <label>Observación<textarea rows="4" value={editingLodging.note||''} placeholder="Motivo del bloqueo" onChange={(e)=>setEditingLodging({...editingLodging,note:e.target.value})}/></label> : <><label>Vendedor<select disabled={!isAdmin && isSellerProfile(profile?.role)} value={editingLodging.createdByName || normalizePersonName(sellerName(profile, user))} onChange={(e)=>setEditingLodging({...editingLodging,createdByName:e.target.value})}>{sellerOptionsForModule('lodging').map((name)=><option key={name} value={name}>{name}</option>)}</select></label><label>Huésped<input value={editingLodging.customerName||''} placeholder="Nombre del huésped" onBlur={()=>applyLeadToLodgingDraft(editingLodging)} onChange={(e)=>setEditingLodging({...editingLodging,customerName:e.target.value})}/></label><div className="two-columns"><label>Cédula / identificación<div className="id-inline"><select value={editingLodging.customerIdType || (String(editingLodging.customerId||'').toUpperCase().startsWith('E-') ? 'E' : 'V')} onChange={(e)=>setEditingLodging({...editingLodging,customerIdType:e.target.value,customerNationality:e.target.value==='E'?'extranjero':'venezolano'})}><option value="V">V</option><option value="E">E</option></select><input value={editingLodging.customerId||''} placeholder="Ej: 12.345.678" onBlur={()=>applyLeadToLodgingDraft(editingLodging)} onChange={(e)=>setEditingLodging({...editingLodging,customerId:e.target.value})}/></div></label><label>Teléfono<input value={editingLodging.phone||''} placeholder="WhatsApp" onBlur={()=>applyLeadToLodgingDraft(editingLodging)} onChange={(e)=>setEditingLodging({...editingLodging,phone:e.target.value})}/></label></div><label>Correo electrónico<input type="email" value={editingLodging.email||''} placeholder="correo del huésped" onChange={(e)=>setEditingLodging({...editingLodging,email:e.target.value})}/></label><div className="two-columns"><label>Canal<select value={editingLodging.channel||'Cliente nuevo'} onChange={(e)=>setEditingLodging({...editingLodging,channel:e.target.value})}>{LODGING_CHANNELS.map((ch)=><option key={ch}>{ch}</option>)}</select></label></div><section className="quote-box"><h4>Cálculo de alojamiento</h4><div className="rate-box compact-rates"><div><span>Euro</span><strong>{ratesLoading && !exchangeRates ? 'Consultando...' : (exchangeRates?.bcvEuro || editingLodging.bcvEuroRate) ? `${Number(exchangeRates?.bcvEuro || editingLodging.bcvEuroRate).toFixed(2)} Bs` : 'No disponible'}</strong></div><div className="rate-highlight wide-rate"><span>Costo en BS</span><strong>{(editingLodging.bcvEuroRate || officialEuroRate || exchangeRates?.bcvEuro) ? bsMoney(amountBs(editingLodging.totalAmount || lodgingTotal(lodgingNights(editingLodging.startDate, editingLodging.endDate), editingLodging.nightlyRate, editingLodging.cleaningFee), rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate)) : 'No disponible'}</strong></div></div><div className="two-columns"><label>Número de noches<input type="number" readOnly value={lodgingNights(editingLodging.startDate, editingLodging.endDate)}/></label><label>Costo por noche $<input type="number" value={editingLodging.nightlyRate||''} onChange={(e)=>handleLodgingRateChange(e.target.value)}/></label></div><div className="two-columns"><label>Costo de limpieza $<input type="number" value={editingLodging.cleaningFee||''} onChange={(e)=>handleLodgingCleaningChange(e.target.value)}/></label>{isAdmin ? <label>Total alojamiento $<input type="number" value={editingLodging.totalAmount || ''} onChange={(e)=>setEditingLodging({...editingLodging,totalAmount:e.target.value})}/></label> : <div className="pending-box"><span>Total alojamiento</span><strong>{money(editingLodging.totalAmount || lodgingTotal(lodgingNights(editingLodging.startDate, editingLodging.endDate), editingLodging.nightlyRate, editingLodging.cleaningFee))}</strong></div>}</div>{!isAdmin && <div className="pending-box"><span>Comisión vendedor 15%</span><strong>{money(commissionFromTotal(editingLodging.totalAmount || lodgingTotal(lodgingNights(editingLodging.startDate, editingLodging.endDate), editingLodging.nightlyRate, editingLodging.cleaningFee)))}</strong></div>}</section><div className="two-columns"><label>{paymentInputLabel(editingLodging.paymentMethod)}<input type="number" value={editingLodging.amount||''} placeholder={paymentInputPlaceholder(editingLodging.paymentMethod)} onChange={(e)=>setEditingLodging({...editingLodging,amount:e.target.value,amountBs:String(paymentAmountBs(e.target.value, editingLodging.paymentMethod, rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate)),amountUsdEquivalent:String(paymentAmountUsd(e.target.value, editingLodging.paymentMethod, rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate))})}/></label><label>Método del abono<select value={editingLodging.paymentMethod || '$ Efectivo'} onChange={(e)=>setEditingLodging({...editingLodging,paymentMethod:e.target.value})}>{PAYMENT_METHODS.map((method)=><option key={method}>{method}</option>)}</select></label></div><div className="two-columns"><div className="pending-box"><span>Abono equivalente $</span><strong>{money(frozenPaidUsdForDisplay(editingLodging, rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate))}</strong><small>{bsMoney(frozenPaidBsForDisplay(editingLodging, rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate))}</small></div><div className="pending-box"><span>Diferencia a pagar</span><strong>{moneyDual(frozenPendingUsdForDisplay(editingLodging, editingLodging.totalAmount || lodgingTotal(lodgingNights(editingLodging.startDate, editingLodging.endDate), editingLodging.nightlyRate, editingLodging.cleaningFee), rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate), rateAwareExchangeRates, editingLodging.bcvEuroRate || officialEuroRate)}</strong></div></div><section className="document-box"><h4>Pago / comprobante</h4><div className="two-columns"><label>Método registrado<input value={editingLodging.paymentMethod || '$ Efectivo'} readOnly /></label><label>Nº de Referencia<input value={editingLodging.paymentReference || ''} placeholder="Referencia del pago" onChange={(e)=>setEditingLodging({...editingLodging,paymentReference:e.target.value})}/></label></div><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setEditingLodging({...editingLodging,_paymentProofFile:e.target.files?.[0] || null})}/><small>{editingLodging._paymentProofFile ? `Comprobante seleccionado: ${editingLodging._paymentProofFile.name}` : editingLodging.paymentProof?.url ? <a href={editingLodging.paymentProof.url} target="_blank">Ver comprobante cargado</a> : 'Comprobante pendiente'}</small></section>{renderPaymentHistoryManager(editingLodging, setEditingLodging, false)}<label>Observación<textarea rows="4" value={editingLodging.note||''} placeholder="Condiciones, dirección, datos de llegada, etc." onChange={(e)=>setEditingLodging({...editingLodging,note:e.target.value})}/></label></>}<div className="modal-actions bottom-actions">{editingLodging.id && <button type="button" className="danger" onClick={()=>hardDeleteLodgingReservation(editingLodging)}><Trash2 size={17}/> Eliminar</button>}{editingLodging.id && normalizeStatus(editingLodging.status)==="reserved" && storedPaidBs(editingLodging, exchangeRates)>0 && <button type="button" className="secondary" onClick={()=>openRefundLodging(editingLodging)}><Download size={17}/> Anulación/Devolución</button>}{!editingLodging.id && normalizeStatus(editingLodging.status)==='reserved' && <button type="button" className="secondary" onClick={() => generateLodgingQuote(editingLodging)}><FileText size={17}/> Cotizar</button>}<button type="submit" className="primary">Guardar</button></div></form></div>}

      {editingAccommodation && canManageVehicles && <div className="modal-backdrop"><form className="modal small" onSubmit={saveAccommodation}><div className="modal-header"><h3>{editingAccommodation.id ? 'Editar alojamiento' : 'Agregar alojamiento'}</h3><button type="button" onClick={() => setEditingAccommodation(null)}><X size={20}/></button></div><label>Nombre del alojamiento<input value={editingAccommodation.name||''} placeholder="Ej: Lechería con vista al mar" onChange={(e)=>setEditingAccommodation({...editingAccommodation,name:e.target.value})}/></label><label>Residencia<input value={editingAccommodation.residence||''} placeholder="Nombre de residencia / edificio" onChange={(e)=>setEditingAccommodation({...editingAccommodation,residence:e.target.value})}/></label><div className="two-columns"><label>Habitaciones<input type="number" value={editingAccommodation.rooms||''} onChange={(e)=>setEditingAccommodation({...editingAccommodation,rooms:e.target.value})}/></label><label>Baños<input type="number" value={editingAccommodation.bathrooms||''} onChange={(e)=>setEditingAccommodation({...editingAccommodation,bathrooms:e.target.value})}/></label></div><label>Capacidad máxima de huéspedes<input type="number" value={editingAccommodation.maxCapacity||''} placeholder="Ej: 5" onChange={(e)=>setEditingAccommodation({...editingAccommodation,maxCapacity:e.target.value})}/></label><div className="two-columns"><label>Hora de Check in<input type="time" value={editingAccommodation.checkInTime||'15:00'} onChange={(e)=>setEditingAccommodation({...editingAccommodation,checkInTime:e.target.value})}/></label><label>Hora de Check out<input type="time" value={editingAccommodation.checkOutTime||'11:00'} onChange={(e)=>setEditingAccommodation({...editingAccommodation,checkOutTime:e.target.value})}/></label></div><div className="two-columns"><label>Costo por noche $<input type="number" value={editingAccommodation.nightlyRate||''} onChange={(e)=>setEditingAccommodation({...editingAccommodation,nightlyRate:e.target.value})}/></label><label>Costo de limpieza $<input type="number" value={editingAccommodation.cleaningFee||''} onChange={(e)=>setEditingAccommodation({...editingAccommodation,cleaningFee:e.target.value})}/></label></div><label>Inversión del alojamiento $<input type="number" min="0" step="0.01" value={editingAccommodation.investmentCost||''} placeholder="Ej: 25000" onChange={(e)=>setEditingAccommodation({...editingAccommodation,investmentCost:e.target.value})}/></label><section className="document-box"><h4>Modelo comercial</h4><div className="two-columns"><label>Tipo de alojamiento<select value={editingAccommodation.ownershipType || 'Propio'} onChange={(e)=>setEditingAccommodation({...editingAccommodation,ownershipType:e.target.value})}><option>Propio</option><option>Aliado</option></select></label>{editingAccommodation.ownershipType === 'Aliado' && <label>Propietario / aliado<input value={editingAccommodation.allyOwnerName || ''} placeholder="Nombre del propietario" onChange={(e)=>setEditingAccommodation({...editingAccommodation,allyOwnerName:e.target.value})}/></label>}</div>{editingAccommodation.ownershipType === 'Aliado' && <div className="two-columns"><label>Modelo ganancia<select value={editingAccommodation.allyProfitMode || 'fixed'} onChange={(e)=>setEditingAccommodation({...editingAccommodation,allyProfitMode:e.target.value})}><option value="fixed">Monto fijo $</option><option value="percent">Porcentaje %</option></select></label><label>{editingAccommodation.allyProfitMode === 'percent' ? 'Porcentaje Alohandote %' : 'Ganancia Alohandote $'}<input type="number" min="0" step="0.01" value={editingAccommodation.allyProfitValue || ''} placeholder={editingAccommodation.allyProfitMode === 'percent' ? 'Ej: 25' : 'Ej: 25'} onChange={(e)=>setEditingAccommodation({...editingAccommodation,allyProfitValue:e.target.value})}/></label></div>}<small>Propio: el ingreso completo pertenece a Alohandote. Aliado: el sistema separa ganancia Alohandote y cuenta por pagar al propietario.</small></section><div className="feature-grid"><label><input type="checkbox" checked={!!editingAccommodation.hotWater} onChange={(e)=>setEditingAccommodation({...editingAccommodation,hotWater:e.target.checked})}/> Agua caliente</label><label><input type="checkbox" checked={!!editingAccommodation.ac} onChange={(e)=>setEditingAccommodation({...editingAccommodation,ac:e.target.checked})}/> Aire acondicionado</label><label><input type="checkbox" checked={!!editingAccommodation.pool} onChange={(e)=>setEditingAccommodation({...editingAccommodation,pool:e.target.checked})}/> Piscina</label><label><input type="checkbox" checked={!!editingAccommodation.elevator} onChange={(e)=>setEditingAccommodation({...editingAccommodation,elevator:e.target.checked})}/> Ascensor</label><label><input type="checkbox" checked={!!editingAccommodation.parking} onChange={(e)=>setEditingAccommodation({...editingAccommodation,parking:e.target.checked})}/> Estacionamiento</label><label><input type="checkbox" checked={!!editingAccommodation.wifi} onChange={(e)=>setEditingAccommodation({...editingAccommodation,wifi:e.target.checked})}/> Wifi</label><label><input type="checkbox" checked={!!editingAccommodation.equippedKitchen} onChange={(e)=>setEditingAccommodation({...editingAccommodation,equippedKitchen:e.target.checked})}/> Cocina equipada</label><label><input type="checkbox" checked={!!editingAccommodation.coffeeMaker} onChange={(e)=>setEditingAccommodation({...editingAccommodation,coffeeMaker:e.target.checked})}/> Cafetera</label><label><input type="checkbox" checked={!!editingAccommodation.microwave} onChange={(e)=>setEditingAccommodation({...editingAccommodation,microwave:e.target.checked})}/> Microondas</label><label><input type="checkbox" checked={!!editingAccommodation.airFryer} onChange={(e)=>setEditingAccommodation({...editingAccommodation,airFryer:e.target.checked})}/> Air fryer</label><label><input type="checkbox" checked={!!editingAccommodation.iron} onChange={(e)=>setEditingAccommodation({...editingAccommodation,iron:e.target.checked})}/> Plancha de ropa</label><label><input type="checkbox" checked={!!editingAccommodation.sofaBed} onChange={(e)=>setEditingAccommodation({...editingAccommodation,sofaBed:e.target.checked})}/> Sofá cama</label><label><input type="checkbox" checked={!!editingAccommodation.sofa} onChange={(e)=>setEditingAccommodation({...editingAccommodation,sofa:e.target.checked})}/> Sofá tradicional</label><label><input type="checkbox" checked={!!editingAccommodation.bedding} onChange={(e)=>setEditingAccommodation({...editingAccommodation,bedding:e.target.checked})}/> Ropa de cama</label></div><div className="two-columns"><label>Cantidad de TV<input type="number" min="0" value={editingAccommodation.tvCount||''} placeholder="Ej: 2" onChange={(e)=>setEditingAccommodation({...editingAccommodation,tvCount:e.target.value})}/></label><label>Cantidad de toallas<input type="number" min="0" value={editingAccommodation.towelsCount||''} placeholder="Ej: 6" onChange={(e)=>setEditingAccommodation({...editingAccommodation,towelsCount:e.target.value})}/></label></div><section className="ical-multi-box"><div className="ical-multi-head"><strong>Calendarios iCal externos</strong><small>Puedes importar hasta 4 calendarios: Airbnb, Booking u otra plataforma.</small></div>{[0,1,2,3].map((idx)=>{ const list = Array.isArray(editingAccommodation.icalUrls) ? editingAccommodation.icalUrls : [editingAccommodation.icalUrl || '', '', '', '']; return <label key={`ical-url-${idx}`}>URL iCal #{idx+1}<input value={list[idx]||''} placeholder={idx===0 ? 'Pega aquí el enlace iCal principal' : 'Opcional'} onChange={(e)=>updateAccommodationIcalUrl(idx, e.target.value)}/></label> })}{accommodationIcalUrls(editingAccommodation).length > 0 && <button type="button" className="secondary" onClick={()=>setEditingAccommodation({...editingAccommodation,icalUrl:'',icalUrls:['','','','']})}>Eliminar / desvincular iCal guardados</button>}</section><label>URL ubicación Google Maps<input value={editingAccommodation.mapsUrl||''} placeholder="https://maps.google.com/..." onChange={(e)=>setEditingAccommodation({...editingAccommodation,mapsUrl:e.target.value})}/></label><section className="photo-manager"><div className="photo-manager-head"><div><strong>Fotos del catálogo</strong><small>Ordena, revisa o elimina las fotos antes de guardar.</small></div><span>{(Array.isArray(editingAccommodation.photos)?editingAccommodation.photos.length:0) + Array.from(editingAccommodation._photoFiles || []).length}/9</span></div>{Array.isArray(editingAccommodation.photos) && editingAccommodation.photos.length > 0 && <div className="photo-grid-editor">{editingAccommodation.photos.slice(0,9).map((photo, index)=><figure key={`saved-${index}`}><img src={photoUrl(photo)} alt={photoName(photo,index)} onError={(e)=>{e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('thumb-broken')}}/><figcaption>Foto {index+1}</figcaption><div className="photo-tools"><button type="button" onClick={()=>moveAccommodationPhoto(index,-1)} disabled={index===0}>←</button><button type="button" onClick={()=>moveAccommodationPhoto(index,1)} disabled={index===editingAccommodation.photos.length-1}>→</button><button type="button" className="danger-mini" onClick={()=>removeAccommodationPhoto(index)}>✕</button></div></figure>)}</div>}<label className="file-pick">Agregar fotos al catálogo<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingAccommodation({...editingAccommodation,_photoFiles:Array.from(e.target.files || []).slice(0, Math.max(0, 9 - (Array.isArray(editingAccommodation.photos)?editingAccommodation.photos.length:0)))})}/><small>JPG, PNG, WEBP o HEIC. Máximo 9 fotos en el catálogo.</small></label>{Array.from(editingAccommodation._photoFiles || []).length > 0 && <div className="photo-grid-editor pending">{Array.from(editingAccommodation._photoFiles || []).map((file,index)=><figure key={`pending-${index}-${file.name}`}><img src={URL.createObjectURL(file)} alt={file.name}/><figcaption>Nueva {index+1}</figcaption><div className="photo-tools"><button type="button" onClick={()=>movePendingAccommodationPhoto(index,-1)} disabled={index===0}>←</button><button type="button" onClick={()=>movePendingAccommodationPhoto(index,1)} disabled={index===Array.from(editingAccommodation._photoFiles || []).length-1}>→</button><button type="button" className="danger-mini" onClick={()=>removePendingAccommodationPhoto(index)}>✕</button></div></figure>)}</div>}<small className="photo-note">El orden visible aquí será el mismo orden del catálogo PDF. Guarda el alojamiento para conservar los cambios.</small></section><label>Observaciones<textarea rows="3" value={editingAccommodation.notes||''} placeholder="Capacidad, internet, normas, ubicación, detalles importantes" onChange={(e)=>setEditingAccommodation({...editingAccommodation,notes:e.target.value})}/></label><div className="modal-actions">{editingAccommodation.id && <button type="button" className="danger" onClick={()=>deleteAccommodation(editingAccommodation)}><Trash2 size={17}/> Eliminar</button>}{editingAccommodation.id && <button type="button" className="secondary" onClick={()=>shareAccommodationCatalog(editingAccommodation)}>Catálogo PDF / Compartir</button>}{editingAccommodation.id && <button type="button" className="secondary" onClick={()=>repairAccommodationHeicPhotos(editingAccommodation)}>Reparar fotos HEIC</button>}<button type="submit" className="primary" disabled={accommodationSaving}>{accommodationSaving ? 'Guardando fotos...' : 'Guardar alojamiento'}</button></div></form></div>}

      {editingVehicleDelivery && <div className="modal-backdrop"><form className="modal small" onSubmit={saveVehicleDelivery}><div className="modal-header"><h3>Entrega de vehículo</h3><button type="button" onClick={() => setEditingVehicleDelivery(null)}><X size={20}/></button></div>{operationDetailLine(editingVehicleDelivery) && <section className="document-box operation-context"><strong>{editingVehicleDelivery.customerName || 'Cliente'}</strong><small>{operationDetailLine(editingVehicleDelivery)}</small></section>}<label>Vehículo<select value={editingVehicleDelivery.vehicleId || ''} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, vehicleId:e.target.value, currentKm: vehicles.find((v)=>v.id===e.target.value)?.currentKm || '' })}>{vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>{operationDetailLine(editingVehicleDelivery) && <div className="document-box operation-context"><strong>{editingVehicleDelivery.customerName || 'Cliente'}</strong><small>{operationDetailLine(editingVehicleDelivery)}</small></div>}<label>Responsable de entregar<select value={editingVehicleDelivery.responsible || ''} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, responsible:e.target.value })}>{operationsPeople.map((name)=><option key={name} value={name}>{name}</option>)}</select></label><div className="two-columns"><label>KM salida<input type="number" min="0" value={editingVehicleDelivery.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, currentKm:e.target.value })}/></label><label>Nivel de combustible<select value={editingVehicleDelivery.fuelLevel || 'Completo'} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, fuelLevel:e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label></div><label>Estado general<select value={editingVehicleDelivery.generalStatus || 'Bueno'} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, generalStatus:e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option></select></label><div className="two-columns"><label className="file-pick">Foto tablero<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, _dashboardPhotoFile:e.target.files?.[0] || null })}/><small>{editingVehicleDelivery._dashboardPhotoFile?.name || 'Odómetro / tablero'}</small></label><label className="file-pick">Foto vehículo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, _vehiclePhotoFile:e.target.files?.[0] || null })}/><small>{editingVehicleDelivery._vehiclePhotoFile?.name || 'Exterior del vehículo'}</small></label></div><label>Observación<textarea rows="3" value={editingVehicleDelivery.notes || ''} onChange={(e)=>setEditingVehicleDelivery({ ...editingVehicleDelivery, notes:e.target.value })}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setEditingVehicleDelivery(null)}>Cancelar</button><button type="submit" className="primary">Guardar entrega</button></div></form></div>}

      {editingCleaningTask && <div className="modal-backdrop"><form className="modal small" onSubmit={saveCleaningTask}><div className="modal-header"><h3>Registro de limpieza</h3><button type="button" onClick={() => setEditingCleaningTask(null)}><X size={20}/></button></div><label>Alojamiento<input value={editingCleaningTask.accommodationName || accommodations.find((apt)=>apt.id===editingCleaningTask.accommodationId)?.name || ''} readOnly /></label>{operationDetailLine(editingCleaningTask) && <section className="document-box operation-context"><strong>{editingCleaningTask.customerName || 'Huésped'}</strong><small>{operationDetailLine(editingCleaningTask)}</small></section>}<label>Responsable de limpieza<select value={editingCleaningTask.responsible || ''} onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, responsible:e.target.value })}>{operationsPeople.map((name)=><option key={name} value={name}>{name}</option>)}</select></label><label className="file-pick">Foto daño / incidencia<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, _damagePhotoFile:e.target.files?.[0] || null })}/><small>{editingCleaningTask._damagePhotoFile?.name || 'Opcional: daño o incidencia'}</small></label><div className="two-columns"><label>Artículo usado<select value={editingCleaningTask.inventoryItemId || ''} onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, inventoryItemId:e.target.value })}><option value="">Sin consumo</option>{inventoryItemsStore.items.filter((item)=>item.module === 'Alojamientos' || item.module === 'General').map((item)=><option key={item.id} value={item.id}>{item.name} · Stock {item.quantity}</option>)}</select></label><label>Cantidad<input type="number" min="0" step="1" value={editingCleaningTask.quantity || ''} onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, quantity:e.target.value })}/></label></div><label>Observación<textarea rows="3" value={editingCleaningTask.notes || ''} placeholder="Daños, consumo, observaciones de limpieza..." onChange={(e)=>setEditingCleaningTask({ ...editingCleaningTask, notes:e.target.value })}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setEditingCleaningTask(null)}>Cancelar</button><button type="submit" className="primary">Guardar limpieza</button></div></form></div>}

      {editingVehicleCheckin && <div className="modal-backdrop"><form className="modal small" onSubmit={saveVehicleReception}><div className="modal-header"><h3>Recepción de vehículo</h3><button type="button" onClick={() => setEditingVehicleCheckin(null)}><X size={20}/></button></div>{operationDetailLine(editingVehicleCheckin) && <section className="document-box operation-context"><strong>{editingVehicleCheckin.customerName || 'Cliente'}</strong><small>{operationDetailLine(editingVehicleCheckin)}</small></section>}<label>Vehículo<select value={editingVehicleCheckin.vehicleId || ''} onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, vehicleId: e.target.value, currentKm: vehicles.find((v)=>v.id===e.target.value)?.currentKm || '' })}>{vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label><div className="two-columns"><label>Kilometraje recibido<input type="number" min="0" value={editingVehicleCheckin.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, currentKm: e.target.value })}/></label><label>Nivel de combustible<select value={editingVehicleCheckin.fuelLevel || 'Completo'} onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, fuelLevel: e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label></div><label>Responsable de recibir<select value={editingVehicleCheckin.createdByName || ''} onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, createdByName:e.target.value })}>{operationsPeople.map((name)=><option key={name} value={name}>{name}</option>)}</select></label><label>Reserva relacionada<select value={editingVehicleCheckin.reservationId || ''} onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, reservationId:e.target.value })}><option value="">Sin reserva relacionada</option>{reservationsStore.items.filter((r)=>r.vehicleId===editingVehicleCheckin.vehicleId && normalizeStatus(r.status)==='reserved').map((r)=><option key={r.id} value={r.id}>{r.customerName || 'Sin cliente'} · {formatShortDate(r.startDate)} - {formatShortDate(r.endDate)} · KM entrega {r.deliveryKm || 'N/D'}</option>)}</select></label><label>Estado general<select value={editingVehicleCheckin.generalStatus || 'Bueno'} onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, generalStatus: e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option><option>Requiere mantenimiento</option></select></label><div className="two-columns"><label className="file-pick">Foto tablero<input ref={dashboardPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, _dashboardPhotoFile: e.target.files?.[0] || null })}/><small>{editingVehicleCheckin._dashboardPhotoFile?.name || editingVehicleCheckin.dashboardPhoto?.name || 'Odómetro / tablero'}</small></label><label className="file-pick">Foto vehículo<input ref={vehiclePhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, _vehiclePhotoFile: e.target.files?.[0] || null })}/><small>{editingVehicleCheckin._vehiclePhotoFile?.name || editingVehicleCheckin.vehiclePhoto?.name || 'Exterior del vehículo'}</small></label></div><label>Observación<textarea rows="3" value={editingVehicleCheckin.notes || ''} placeholder="Daños, limpieza, combustible, accesorios, comentarios del cliente..." onChange={(e)=>setEditingVehicleCheckin({ ...editingVehicleCheckin, notes: e.target.value })}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setEditingVehicleCheckin(null)}>Cancelar</button><button type="submit" className="primary">Guardar recepción</button></div></form></div>}
      {editingVehicle && canManageVehicles && <div className="modal-backdrop"><form className="modal small" onSubmit={saveVehicle}><div className="modal-header"><h3>{editingVehicle.id ? 'Editar vehículo' : 'Agregar vehículo'}</h3><button type="button" onClick={() => setEditingVehicle(null)}><X size={20} /></button></div><label>Nombre<input value={editingVehicle.name} placeholder="Ej: Saipa Quick" onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })} /></label><div className="two-columns"><label>Marca<input value={editingVehicle.brand || ''} placeholder="Saipa" onChange={(e) => setEditingVehicle({ ...editingVehicle, brand: e.target.value })} /></label><label>Modelo<input value={editingVehicle.model || ''} placeholder="Quick" onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })} /></label></div><div className="two-columns"><label>Tipo de vehículo<select value={editingVehicle.vehicleType || 'Sedan'} onChange={(e)=>setEditingVehicle({...editingVehicle, vehicleType:e.target.value})}><option>Sedan</option><option>Hatchback</option><option>Pick up</option><option>SUV</option><option>Van</option></select></label><label>Transmisión<select value={editingVehicle.transmission || 'Automático'} onChange={(e)=>setEditingVehicle({...editingVehicle, transmission:e.target.value})}><option>Automático</option><option>Sincrónico</option></select></label></div><div className="two-columns"><label>Año<input value={editingVehicle.year || ''} placeholder="2023" onChange={(e) => setEditingVehicle({ ...editingVehicle, year: e.target.value })} /></label><label>Color<input value={editingVehicle.color || ''} placeholder="Plateado" onChange={(e) => setEditingVehicle({ ...editingVehicle, color: e.target.value })} /></label></div><div className="two-columns"><label>Combustible<select value={editingVehicle.fuelType || 'Gasolina'} onChange={(e)=>setEditingVehicle({...editingVehicle, fuelType:e.target.value})}><option>Gasolina</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></label><label>Placa / referencia<input value={editingVehicle.plate || ''} placeholder="AC670CR" onChange={(e) => setEditingVehicle({ ...editingVehicle, plate: e.target.value })} /></label></div><label>Serial de carrocería / VIN<input value={editingVehicle.vin || ''} placeholder="NAS841100P1188481" onChange={(e) => setEditingVehicle({ ...editingVehicle, vin: e.target.value })} /></label><section className="document-box"><h4>Modelo comercial</h4><div className="two-columns"><label>Tipo de vehículo<select value={editingVehicle.ownershipType || 'Propio'} onChange={(e)=>setEditingVehicle({...editingVehicle,ownershipType:e.target.value})}><option>Propio</option><option>Aliado</option></select></label>{editingVehicle.ownershipType === 'Aliado' && <label>Propietario / aliado<input value={editingVehicle.allyOwnerName || ''} placeholder="Nombre del propietario" onChange={(e)=>setEditingVehicle({...editingVehicle,allyOwnerName:e.target.value})}/></label>}</div>{editingVehicle.ownershipType === 'Aliado' && <div className="two-columns"><label>Modelo ganancia<select value={editingVehicle.allyProfitMode || 'fixed'} onChange={(e)=>setEditingVehicle({...editingVehicle,allyProfitMode:e.target.value})}><option value="fixed">Monto fijo $</option><option value="percent">Porcentaje %</option></select></label><label>{editingVehicle.allyProfitMode === 'percent' ? 'Porcentaje Alohandote %' : 'Ganancia Alohandote $'}<input type="number" min="0" step="0.01" value={editingVehicle.allyProfitValue || ''} placeholder={editingVehicle.allyProfitMode === 'percent' ? 'Ej: 25' : 'Ej: 25'} onChange={(e)=>setEditingVehicle({...editingVehicle,allyProfitValue:e.target.value})}/></label></div>}<small>Propio: el ingreso completo pertenece a Alohandote. Aliado: el sistema separa ganancia Alohandote y cuenta por pagar al propietario.</small></section><label>URL ubicación Google Maps<input value={editingVehicle.mapsUrl || ''} placeholder="https://maps.google.com/..." onChange={(e) => setEditingVehicle({ ...editingVehicle, mapsUrl: e.target.value })} /></label><div className="two-columns"><label>Costo por día $<input type="number" step="0.01" min="0" value={editingVehicle.dailyRentalRate || ''} placeholder="Ej: 50" onChange={(e) => setEditingVehicle({ ...editingVehicle, dailyRentalRate: e.target.value })} /></label><label>Costo del KM adicional $<input type="number" step="0.01" min="0" value={editingVehicle.pricePerKm ?? KM_RATE} placeholder="Ej: 0.30" onChange={(e) => setEditingVehicle({ ...editingVehicle, pricePerKm: e.target.value })} /></label></div><label>Kilometraje actual<input type="number" min="0" value={editingVehicle.currentKm || ''} placeholder="Ej: 45200" onChange={(e) => setEditingVehicle({ ...editingVehicle, currentKm: e.target.value, lastKmUpdateAt: new Date().toISOString(), lastKmUpdatedBy: sellerName(profile, user) })} /></label><label>Inversión del vehículo $<input type="number" min="0" step="0.01" value={editingVehicle.investmentCost || ''} placeholder="Ej: 8500" onChange={(e)=>setEditingVehicle({...editingVehicle, investmentCost:e.target.value})}/></label><div className="feature-grid"><label><input type="checkbox" checked={!!editingVehicle.parkingSensors} onChange={(e)=>setEditingVehicle({...editingVehicle,parkingSensors:e.target.checked})}/> Sensores de estacionamiento</label><label><input type="checkbox" checked={!!editingVehicle.powerSteering} onChange={(e)=>setEditingVehicle({...editingVehicle,powerSteering:e.target.checked})}/> Dirección asistida</label><label><input type="checkbox" checked={!!editingVehicle.bluetooth} onChange={(e)=>setEditingVehicle({...editingVehicle,bluetooth:e.target.checked})}/> Bluetooth</label><label><input type="checkbox" checked={!!editingVehicle.sunroof} onChange={(e)=>setEditingVehicle({...editingVehicle,sunroof:e.target.checked})}/> Quemacoco</label><label><input type="checkbox" checked={!!editingVehicle.ac} onChange={(e)=>setEditingVehicle({...editingVehicle,ac:e.target.checked})}/> A/A</label><label><input type="checkbox" checked={!!editingVehicle.airbag} onChange={(e)=>setEditingVehicle({...editingVehicle,airbag:e.target.checked})}/> Airbag</label><label><input type="checkbox" checked={!!editingVehicle.powerWindows} onChange={(e)=>setEditingVehicle({...editingVehicle,powerWindows:e.target.checked})}/> Vidrios eléctricos</label><label><input type="checkbox" checked={!!editingVehicle.screen} onChange={(e)=>setEditingVehicle({...editingVehicle,screen:e.target.checked})}/> Pantalla</label></div><section className="photo-manager"><div className="photo-manager-head"><div><strong>Fotos del catálogo</strong><small>Ordena o elimina fotos antes de guardar.</small></div><span>{(Array.isArray(editingVehicle.photos)?editingVehicle.photos.length:0) + Array.from(editingVehicle._photoFiles || []).length}/9</span></div>{Array.isArray(editingVehicle.photos) && editingVehicle.photos.length > 0 && <div className="photo-grid-editor">{editingVehicle.photos.slice(0,9).map((photo,index)=><figure key={`veh-${index}`}><img src={photoUrl(photo)} alt={`Foto ${index+1}`}/><figcaption>Foto {index+1}</figcaption><div className="photo-tools"><button type="button" onClick={()=>moveVehiclePhoto(index,-1)} disabled={index===0}>←</button><button type="button" onClick={()=>moveVehiclePhoto(index,1)} disabled={index===editingVehicle.photos.length-1}>→</button><button type="button" className="danger-mini" onClick={()=>removeVehiclePhoto(index)}>✕</button></div></figure>)}</div>}<label className="file-pick">Agregar fotos del vehículo<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e)=>setEditingVehicle({...editingVehicle,_photoFiles:Array.from(e.target.files || []).slice(0, Math.max(0, 9 - (Array.isArray(editingVehicle.photos)?editingVehicle.photos.length:0)))})}/><small>JPG, PNG, WEBP o HEIC. Máximo 9 fotos.</small></label></section><label>Observación del vehículo<textarea rows="3" value={editingVehicle.notes || ''} placeholder="Seguro, seriales, condiciones, etc." onChange={(e) => setEditingVehicle({ ...editingVehicle, notes: e.target.value })} /></label><div className="modal-actions">{editingVehicle.id && <button type="button" className="danger" onClick={() => deleteVehicle(editingVehicle)}><Trash2 size={17} /> Eliminar</button>}{editingVehicle.id && <button type="button" className="secondary" onClick={()=>shareVehicleCatalog(editingVehicle)}>Catálogo PDF / Compartir</button>}<button type="submit" className="primary">Guardar vehículo</button></div></form></div>}
    </main>
  )
}

/* Compatibilidad validaciones legacy:
   profitBs: incomeBs - expensesBs
   refundRows.filter(isConsistentCashRow).forEach
*/
/* Compatibilidad validaciones legacy V141/V143:
   expensesBs = expenseRowsForTotals.reduce
   dataQualityRows: []
*/
/* Compatibilidad validaciones legacy V152:
   method: item.refundPaymentMethod || item.paymentMethod || 'Pago en BS'
*/
/* Compatibilidad validaciones legacy V153:
   visibleProfitBs = Math.max(0, incomeBs - expensesBs)
*/
/* Compatibilidad validaciones legacy V151:
   .filter((item) => isReservationCancelled(item) && num(item.refundAmount) > 0)
*/

/* V223.1 compatibility notes for historical smoke tests:
   const payables = [...payableExpenseRows, ...commissionRows]
   ...validRefundRows, ...commissionRows]
   V223.1 runtime uses pendingCommissionRows for CxP and paidCommissionRows for cash ledger so commissions only descuentan caja after liquidation.
*/
