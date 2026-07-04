# V120 - Reparar iCal listado como mantenimiento

## Problema
El módulo Mantenimiento estaba mostrando reservas iCal de alojamientos como si fueran registros de mantenimiento.

## Causa
El sistema estaba usando una detección demasiado amplia:

- Si el registro tenía `maintenanceType`, lo tomaba como mantenimiento.
- Algunos registros de alojamiento traían `maintenanceType: Preventivo` por defecto aunque eran reservas normales.
- Las reservas iCal importadas también podían heredar esa estructura y terminar en el listado de mantenimiento.

## Correcciones aplicadas

### 1. Detección estricta de mantenimiento
Ahora un registro solo se considera mantenimiento si:

- status === maintenance
- o tiene costo real de mantenimiento
- o tiene medio/evidencia de mantenimiento

Ya NO basta con tener `maintenanceType`.

### 2. Reservas iCal excluidas
Si el registro viene de iCal, nunca se muestra como mantenimiento.

### 3. Reservas de alojamiento nuevas
Las reservas de alojamiento nuevas ya no nacen con `maintenanceType: Preventivo`.

### 4. Caja / Administración
También se evita que reservas iCal contaminadas entren como egreso de mantenimiento.

## Resultado esperado
En el módulo Mantenimiento solo deben aparecer:

- Mantenimientos reales de Renta Car
- Mantenimientos reales de alojamientos si se crean explícitamente
- Registros con costo o evidencia de mantenimiento

No deben aparecer:

- Reservas iCal Airbnb
- Check-in / Check-out iCal
- Reservas normales de alojamiento
