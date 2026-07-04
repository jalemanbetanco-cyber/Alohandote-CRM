// V224 Sprint 5 - Servicio de negocio documentos.
// Punto único para preparar contexto de PDF sin alterar plantillas V211 ni branding aprobado.

import { alohandotePdfHeader, alohandoteContactFooter, cleanPrintCss } from '../../modules/documents/branding.js'
import { buildV211DocumentHtml } from '../../modules/documents/v211Templates.js'

export { alohandotePdfHeader, alohandoteContactFooter, cleanPrintCss, buildV211DocumentHtml }

export function buildDocumentGenerationContext({ type = '', record = {}, role = '', branding = 'alohandote' } = {}) {
  return {
    type,
    record,
    role,
    branding,
    generatedAt: new Date().toISOString(),
    useGenericBranding: ['vendedor', 'vendedor alojamiento'].includes(String(role || '').toLowerCase()),
  }
}
