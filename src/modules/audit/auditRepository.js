import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { AUDIT_COLLECTION } from './auditTypes.js'

export async function saveAuditLog(log, firestoreDb = db) {
  if (!log?.modulo || !log?.accion) return null
  const ref = await addDoc(collection(firestoreDb, AUDIT_COLLECTION), log)
  return ref.id
}

export async function listAuditLogs({ modulo, accion, userId, limitCount = 100 } = {}, firestoreDb = db) {
  const filters = []
  if (modulo) filters.push(where('modulo', '==', modulo))
  if (accion) filters.push(where('accion', '==', accion))
  if (userId) filters.push(where('userId', '==', userId))

  const q = query(
    collection(firestoreDb, AUDIT_COLLECTION),
    ...filters,
    orderBy('fecha', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}
