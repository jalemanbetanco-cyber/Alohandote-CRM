# V221.3 Hotfix Vendedores Renta Car + iCal

Base: V221.2.

## Cambios quirúrgicos

1. En Renta Car, los perfiles `vendedor`, `vendedor alojamiento` y equivalentes normalizados pueden ver botones de documentos:
   - Cotizar
   - Recibo PDF
   - Contrato PDF

2. El botón `Sincronizar iCal guardado` queda separado de la acción de desvincular:
   - Solo sincroniza/actualiza bloqueos iCal importados.
   - No borra `icalUrl` ni `icalUrls`.
   - Guarda `lastIcalSyncAt` para trazabilidad.
   - Los botones iCal quedan como `type="button"` para evitar submits accidentales.

## No tocado

- Caja
- Reservas
- Abonos
- PDFs base
- Aliados
- Firebase
- Inventario
- RRHH
- ROI
