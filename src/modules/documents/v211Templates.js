// V211 - Plantillas corporativas minimalistas para documentos comerciales.
// Módulo puro: no usa React, Firebase ni lógica de negocio.
import { cleanPrintCss, alohandotePdfHeader, alohandoteContactFooter } from './branding.js'

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderItem(item = {}) {
  const label = escapeHtml(item.label || '')
  const value = item.html ? String(item.value || '') : escapeHtml(item.value || 'No indicado')
  const wide = item.wide ? ' wide' : ''
  return `<div class="doc-field${wide}"><span>${label}</span><strong>${value}</strong></div>`
}

function renderSection(section = {}) {
  const items = Array.isArray(section.items) ? section.items.map(renderItem).join('') : ''
  return `<section class="doc-card"><h2>${escapeHtml(section.title || '')}</h2><div class="doc-grid">${items}</div></section>`
}

function renderRows(rows = []) {
  return rows.map((row) => {
    const label = escapeHtml(row.label || '')
    const value = row.html ? String(row.value || '') : escapeHtml(row.value || '')
    return `<div class="doc-row"><span>${label}</span><strong>${value}</strong></div>`
  }).join('')
}

export function buildV211DocumentHtml({
  title,
  pageTitle,
  documentNumber,
  dateLabel,
  sections = [],
  financialTitle = 'Resumen financiero',
  financialRows = [],
  financialAmountLabel = 'Monto (USD / Bs)',
  totalLabel = 'Total',
  totalValue = '',
  rateLabel = 'Tasa EURO',
  rateValue = '',
  note = '',
  actions = '',
  generic = false,
}) {
  const meta = `${documentNumber || ''}${dateLabel ? `\nFecha: ${dateLabel}` : ''}`.trim()
  const headerHtml = generic ? `<section class="alohandote-doc-brand generic-doc"><div class="alohandote-brand-left"><div></div></div>${meta ? `<div class="alohandote-doc-meta">${escapeHtml(meta).replace(/\n/g, '<br>')}</div>` : ''}</section>` : alohandotePdfHeader('Alojamientos & Rent a Car', meta)
  const footerHtml = generic ? '' : alohandoteContactFooter()
  const noteHtml = note ? `<section class="doc-note"><strong>Observación</strong><p>${escapeHtml(note)}</p></section>` : ''
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(pageTitle || title || 'Documento Alohandote')}</title><style>${cleanPrintCss}@page{size:letter;margin:0}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f6f2ed;color:#101828}.actions{text-align:center;margin:16px}.actions button{background:#ff385c;color:white;border:0;border-radius:999px;padding:11px 18px;font-weight:800;cursor:pointer;margin:4px}.actions button.secondary{background:#101828}.sheet{width:760px;max-width:100%;margin:0 auto 24px;background:#fff;padding:28px 34px 18px;border-radius:18px;box-shadow:0 18px 48px rgba(16,24,40,.08)}.doc-title{text-align:center;margin:8px 0 20px}.doc-title h1{margin:0;color:#101828;font-size:23px;letter-spacing:.02em;text-transform:uppercase}.doc-title:after{content:"";display:none}.doc-card{background:#fffaf5;border:1px solid #f6e2d2;border-radius:16px;padding:16px 18px;margin-top:12px}.doc-card h2,.doc-financial h2{margin:0 0 12px;color:#d95714;font-size:13px;letter-spacing:.04em;text-transform:uppercase}.doc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 22px}.doc-field{min-width:0}.doc-field.wide{grid-column:span 2}.doc-field span{display:block;color:#667085;font-size:10px;font-weight:800;text-transform:uppercase;margin-bottom:5px}.doc-field strong{display:block;color:#101828;font-size:13px;line-height:1.35}.doc-financial{margin-top:14px;border-top:1px solid #f0c9ad;padding-top:14px}.doc-financial-head{display:flex;justify-content:space-between;gap:12px;color:#d95714;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}.doc-row{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #edf0f2;padding:9px 0;font-size:13px}.doc-row strong{text-align:right}.doc-total{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff2e8;border-radius:10px;margin-top:10px;padding:12px 16px}.doc-total span{font-size:17px;font-weight:900;text-transform:uppercase}.doc-total strong{font-size:21px;color:#d95714;text-align:right}.doc-rate{display:flex;justify-content:space-between;gap:18px;padding:11px 2px 0;font-size:12px}.doc-note{margin-top:12px;background:#fffaf5;border:1px solid #f6e2d2;border-radius:14px;padding:12px 14px}.doc-note strong{color:#d95714;font-size:12px;text-transform:uppercase}.doc-note p{margin:6px 0 0;line-height:1.4;color:#344054;font-size:12px}@media(max-width:720px){.sheet{border-radius:0;padding:24px 18px}.doc-grid{grid-template-columns:1fr 1fr}.doc-field.wide{grid-column:span 2}.doc-total strong{font-size:18px}}@media print{body{background:#fff}.actions{display:none}.sheet{margin:0;width:100%;border-radius:0;box-shadow:none;padding:24px 30px 14px}}</style></head><body><div class="actions">${actions}</div><main class="sheet">${headerHtml}<section class="doc-title"><h1>${escapeHtml(title)}</h1></section>${sections.map(renderSection).join('')}<section class="doc-financial"><div class="doc-financial-head"><span>${escapeHtml(financialTitle)}</span><span>${escapeHtml(financialAmountLabel)}</span></div>${renderRows(financialRows)}<div class="doc-total"><span>${escapeHtml(totalLabel)}</span><strong>${escapeHtml(totalValue)}</strong></div>${rateValue ? `<div class="doc-rate"><span>${escapeHtml(rateLabel)}</span><strong>${escapeHtml(rateValue)}</strong></div>` : ''}</section>${noteHtml}${footerHtml}</main></body></html>`
}
