HOTFIX V223.5.7.1 - CONTRATO PDF MOBILE

Base: Hotfix V223.5.7 Contrato PDF Justificado.

Alcance quirurgico:
- Desktop/web conserva sin cambios el generador estable V223.5.7.
- Solo en mobile (iPhone/iPad/Android o ancho menor a 768 px), el contrato se genera desde la misma maqueta HTML usada en web.
- Se fija ancho A4 a 794 px.
- Se conserva texto justificado, negritas y formato visual.
- La paginacion busca espacios blancos cercanos al salto para no cortar lineas entre paginas.
- Se usa escala 2 para reducir artefactos y letras omitidas.
- Al compartir, se envia solo el archivo PDF, sin comentario/titulo adicional.

NO modifica:
- ERP
- Caja
- iCal
- Firebase
- Reservas
- Logica comercial
- Otros documentos

IMPLEMENTACION
1. Reemplazar src/App.jsx por el incluido.
2. Ejecutar: npm run build
3. Si compila: vercel --prod --force
4. Probar generando un PDF NUEVO desde el telefono.
