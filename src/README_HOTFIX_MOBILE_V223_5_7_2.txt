ALOHandote CRM — Hotfix V223.5.7.2 Contrato Mobile en una sola hoja

ALCANCE QUIRÚRGICO
- Modifica únicamente la exportación PDF del contrato cuando se genera desde móvil.
- Mantiene intacta la versión web/desktop ya estable.
- Mantiene la captura HTML usada en móvil para evitar la desaparición de letras.
- Escala el contrato completo proporcionalmente para que se genere en una sola hoja A4.
- No modifica ERP, Caja, iCal, Firebase, Reservas, calendarios ni otros documentos.

INSTALACIÓN
1. Copiar src/App.jsx y reemplazar el archivo src/App.jsx del proyecto.
2. Ejecutar: npm run build
3. Si compila correctamente: vercel --prod --force
4. Probar generando un contrato NUEVO desde el teléfono.

NOTA
El contenido se ajusta automáticamente al área imprimible de una sola hoja A4. Debido a que
se preserva todo el contrato, el tamaño visual del texto puede ser menor que en la versión de
dos páginas, pero se evita imprimir una segunda hoja.
