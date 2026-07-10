// V211 - Branding documental corporativo minimalista.
// Módulo puro: no usa React ni Firebase. Solo afecta salida visual de PDF/impresión.

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const cleanPrintCss = `@page{size:A4;margin:0}html.alohandote-printing,body.alohandote-printing{background:#fff!important}.pdf-actions,.system-footer,.debug-watermark,.watermark,.toast,.notice-print,.print-watermark{display:none!important}.alohandote-doc-brand{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid #f0c9ad;padding-bottom:16px;margin-bottom:18px}.alohandote-brand-left{display:flex;align-items:center;gap:14px}.alohandote-doc-brand img{width:92px;height:92px;object-fit:contain}.alohandote-doc-brand strong{display:block;font-size:21px;letter-spacing:-.03em;color:#101828}.alohandote-doc-brand small{display:block;color:#667085;font-weight:700;font-size:12px}.alohandote-doc-meta{text-align:right;color:#101828;font-size:12px;line-height:1.45}.alohandote-doc-meta b{display:inline-block;color:#d95714;background:#fff2e8;border-radius:999px;padding:7px 12px;font-size:13px}.alohandote-contact-footer{margin-top:24px;padding-top:10px;border-top:1px solid #f0c9ad;display:flex;justify-content:center;gap:34px;text-align:center;color:#344054;font-size:11px;font-weight:700;line-height:1.4}.alohandote-contact-footer div{white-space:nowrap}@media print{@page{margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}.actions,#alohandote-printable-toolbar,.pdf-actions,.system-footer,.debug-watermark,.watermark,.toast,.notice-print,.print-watermark,.print-footer,.print-header,.browser-footer,.browser-header{display:none!important}.alohandote-contact-footer{position:relative}}`

export function alohandotePdfHeader(subtitle = 'Alojamientos & Rent a Car', meta = '') {
  const safeMeta = meta ? `<div class="alohandote-doc-meta">${escapeHtml(meta).replace(/\n/g, '<br>')}</div>` : ''
  return `<section class="alohandote-doc-brand"><div class="alohandote-brand-left"><img src="/alohandote-logo.png" alt="Alohandote"/><div><strong>Alohandote</strong><small>${escapeHtml(subtitle)}</small></div></div>${safeMeta}</section>`
}

export function alohandoteContactFooter() {
  return `<section class="alohandote-contact-footer"><div>📷 @alohandote</div><div>📱 04248639102</div><div>✉️ ventas@alohandote.com</div></section>`
}
