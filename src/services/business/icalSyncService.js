// V224 Sprint 5 - Servicio de negocio iCal.
// No conecta redes ni Firestore: solo centraliza reglas puras para validar futuras integraciones.

export function normalizeIcalUrlList(value = []) {
  const list = Array.isArray(value) ? value : [value]
  return list.map((url) => String(url || '').trim()).filter(Boolean)
}

export function buildIcalSyncPlan({ accommodationId = '', urls = [], existingImportedBlocks = [] } = {}) {
  const normalizedUrls = normalizeIcalUrlList(urls)
  const importedBlocks = Array.isArray(existingImportedBlocks) ? existingImportedBlocks : []

  return {
    accommodationId,
    urls: normalizedUrls,
    shouldSync: Boolean(accommodationId && normalizedUrls.length),
    existingImportedBlockIds: importedBlocks.map((block) => block.id).filter(Boolean),
    generatedAt: new Date().toISOString(),
  }
}

export function buildIcalDisconnectPlan({ accommodationId = '', importedBlocks = [] } = {}) {
  const blocks = Array.isArray(importedBlocks) ? importedBlocks : []
  return {
    accommodationId,
    shouldDisconnect: Boolean(accommodationId),
    importedBlockIdsToRelease: blocks.map((block) => block.id).filter(Boolean),
    releaseCount: blocks.length,
  }
}
