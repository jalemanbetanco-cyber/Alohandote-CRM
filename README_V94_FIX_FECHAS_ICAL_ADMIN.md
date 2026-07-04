# V94 - Fix fechas, iCal y botón Administración ERP

## Cambios

### 1. Fechas correctas en Entregas / Recepciones
Se reemplazó el uso de `toISOString()` para calcular el día actual dentro del módulo operativo.
Ahora el sistema usa fecha local del navegador:

- Hoy = fecha local del usuario.
- Mañana = próximo día local.

Esto evita que una reserva del 10 aparezca como "hoy" cuando todavía localmente es 9.

### 2. iCal con nombre del alojamiento
Se refuerza la detección del alojamiento real usando:
- accommodationId
- icalSourceUrl / icalUrl / sourceUrl
- icalSourceKey / externalUid / uid
- accommodationName / propertyName / assetName / title
- coincidencia por nombre o residencia

Las nuevas sincronizaciones iCal guardan también:
- accommodationTitle

Si un bloqueo iCal viejo aparece como "Alojamiento sin vincular", significa que fue importado sin id, sin URL iCal y sin nombre útil. En ese caso debe eliminarse el bloqueo iCal y sincronizar nuevamente desde el alojamiento correcto.

### 3. Botón Administración ERP
Se elimina el banner grande de Administración ERP.
El botón Administración ERP ahora usa el mismo tamaño y estilo base que el resto de módulos.
Solo queda marcado como activo cuando realmente estás dentro de Administración ERP.

## No se modifica
- Comercial
- Renta Car
- Alojamientos
- Inventario ERP
- RRHH ERP
- Mantenimiento
- Rentabilidad KM / ROI
- Submódulos de entregas / recepciones
