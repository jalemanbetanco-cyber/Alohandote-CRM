HOTFIX V223.5.7.3 — PARIDAD DE DIMENSIONES PDF MOBILE / WEB

Alcance quirúrgico:
- Solo modifica el render del contrato PDF en mobile.
- Mantiene una sola hoja A4.
- Elimina el doble margen generado por el padding HTML + margen PDF.
- Recorta únicamente el borde blanco exterior y ajusta el contenido al ancho útil A4.
- Usa márgenes equivalentes al PDF web: 12 mm laterales, 10 mm superior y 12 mm inferior.
- Mantiene intacta la ruta web estable y no toca ERP, Caja, iCal, Firebase, Reservas ni otros documentos.

Instalación:
1. Reemplazar src/App.jsx.
2. Ejecutar npm run build.
3. Si compila, ejecutar vercel --prod --force.
4. Generar un PDF nuevo desde el teléfono para validar.
