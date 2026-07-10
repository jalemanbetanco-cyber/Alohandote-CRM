V223.5.7.4 - Contrato mobile: ancho útil igual a web

Cambio quirúrgico solo en la generación mobile del contrato PDF:
- elimina el doble margen lateral;
- reduce el padding temporal de captura a 8 mm;
- compacta interlineado y espacios verticales para que el ajuste a una hoja no reduzca el ancho;
- inserta la captura con margen PDF de 5 mm;
- mantiene intacta la ruta web y el resto del CRM.

Reemplazar src/App.jsx, ejecutar npm run build y luego vercel --prod --force.
