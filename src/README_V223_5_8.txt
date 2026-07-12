HOTFIX V223.5.8 — MOBILE PDF + SHARE SIN COMENTARIO

Reemplazar únicamente:
  src/App.jsx

por:
  App.V223_5_8_MobilePdfFix.jsx

Cambios quirúrgicos:
1. Contrato PDF: el justificado usa una sola operación de texto por línea.
   Evita el fallo del visor de iOS/WhatsApp que omitía letras al posicionar cada palabra por separado.
2. Compartir: navigator.share envía únicamente el archivo PDF.
   Se elimina title/text para que WhatsApp no inserte el nombre como comentario del mensaje.
3. No se modifican iCal, Caja, ERP, Firebase, reservas, inventario ni RRHH.

Validación:
  npm run build
  vercel --prod --force

Prueba móvil recomendada:
- Generar un contrato nuevo (no reutilizar un PDF anterior de WhatsApp).
- Compartirlo a un chat de prueba.
- Confirmar que el cuadro de comentario esté vacío y que el PDF conserve todas las letras.
