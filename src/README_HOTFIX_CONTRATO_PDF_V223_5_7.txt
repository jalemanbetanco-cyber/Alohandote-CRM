HOTFIX V223.5.7 - Contrato PDF seguro

Alcance:
- Solo reemplaza src/App.jsx.
- No toca iCal, Caja, ERP, Reservas, Firebase, ROI ni Inventario.

Qué corrige:
1. Contrato PDF generado con texto real mediante jsPDF para evitar desaparición de letras.
2. Sustituye la fuente PDF interna de Times a Helvetica para evitar pérdida de caracteres como la letra "s".
3. Agrega justificación línea por línea en el PDF del contrato.
4. Ajusta CSS de la vista HTML del contrato para mobile/web:
   - text-align: justify
   - text-justify: inter-word
   - sin letter-spacing/word-spacing forzado
   - sin hyphens ni cortes extraños.

Instalación:
1. Respaldar tu src/App.jsx actual.
2. Copiar src/App.jsx de este ZIP dentro de tu carpeta src/.
3. Ejecutar:
   npm run build
4. Si compila:
   vercel --prod --force
