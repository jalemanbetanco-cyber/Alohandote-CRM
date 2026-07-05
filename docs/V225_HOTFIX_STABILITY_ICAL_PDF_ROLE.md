# V225 Hotfix Stability — iCal, PDF móvil y Role Bootstrap

## Alcance
Corrección quirúrgica de tres incidencias reportadas sin tocar Caja, ERP, reservas comerciales, inventario, RRHH ni dashboard financiero.

## Cambios incluidos

### 1. iCal export hacia Airbnb
Archivo: `api/_icalCore.js`

Se corrigió el filtro que excluía reservas internas cuando el canal contenía `Airbnb` o `Booking`. A partir de este hotfix solo se consideran importados los registros con señales técnicas reales de iCal externo: `source`, `sourceType`, `icalSourceKey`, `icalSourceUrl` o `externalUid`.

Resultado esperado: si Alohandote sincroniza 4 bloqueos públicos, el endpoint `/api/ical/<id>.ics` debe exportar 4 eventos.

### 2. PDF responsive / móvil
Archivos: `src/App.jsx` y `src/modules/documents/v211Templates.js`

Se estabilizó la captura PDF para móvil forzando un ancho de captura estable, evitando que html2canvas recorte por el viewport del teléfono. También se agregó `viewport` a documentos comerciales y contrato.

### 3. Role Bootstrap admin
Archivo: `src/App.jsx`

Se evita que una sesión admin por correo sea degradada temporalmente a operador mientras llegan datos de Firestore/RRHH. Si el correo pertenece a `adminEmails`, el rol efectivo se mantiene como `admin`.

## Pruebas obligatorias

1. `npm run build`
2. Login con admin: debe entrar como administrador sin esperar/salir.
3. Alojamientos → Copiar link iCal para Airbnb → Probar link iCal.
   - Resultado esperado: eventos exportados igual a bloqueos públicos aplicables.
4. Crear recibo, cotización y contrato en móvil; descargar PDF limpio.
5. Validar que Caja, reservas, CxC/CxP y dashboard sigan iguales.

## Rollback
Revertir los cambios en `api/_icalCore.js`, `src/App.jsx` y `src/modules/documents/v211Templates.js`.
