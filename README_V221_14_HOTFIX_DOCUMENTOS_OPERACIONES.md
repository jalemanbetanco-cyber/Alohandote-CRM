# V221.14 Hotfix Documentos + Link Operaciones

Base: V221.13 estable.

## Alcance quirúrgico

1. Contrato Renta Car mobile
   - Se normaliza a A4 vertical.
   - Se corrige escala de captura para PDF limpio.
   - Se mantiene firma legal y contenido contractual.

2. Imprimir / PDF limpio
   - El botón Imprimir ya no depende de una impresión cruda sin preparación.
   - Oculta acciones, mensajes técnicos, marcas visuales y elementos de UI antes de imprimir.
   - Se conserva el nombre real del documento.

3. Link público de operaciones
   - Valida tokens por ID del documento y también por campo `token`.
   - Acepta tokens antiguos compatibles si están activos y no vencidos.
   - Maneja fechas `expiresAt` como string, número o Timestamp Firestore.

## No tocado

- Caja
- Abonos
- Reservas
- iCal
- CxC/CxP
- Aliados
- Inventario
- RRHH
- ROI
- Firebase rules
