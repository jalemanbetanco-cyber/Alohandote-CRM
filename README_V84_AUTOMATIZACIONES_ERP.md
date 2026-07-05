# V84 - Automatizaciones ERP

## Objetivo
Conectar los módulos operativos con Administración, Inventario, RRHH y ROI sin romper las funciones existentes.

## Automatizaciones incluidas

### Reserva genera ingreso automático
La capa Administración ERP ya refleja automáticamente los abonos/pagos de reservas como ingresos derivados.

### Mantenimiento genera egreso automático
Los mantenimientos con costo se reflejan automáticamente como egresos en Administración ERP.

### Inventario se descuenta desde mantenimiento
En los formularios de mantenimiento de Renta Car y Alojamientos se agregó:
- Inventario usado
- Cantidad inventario

Al guardar el mantenimiento, el sistema descuenta el stock y registra un movimiento de inventario automático.

### Limpieza genera tarea automática
Al guardar una reserva de alojamiento, el sistema crea automáticamente una tarea de limpieza con fecha de check-out.

### Recepción actualiza ROI
Al recibir un vehículo, la reserva queda como Devuelto, se calcula km recorrido y esa data alimenta Rentabilidad KM / ROI.

### Comisiones automáticas
Administración y RRHH agrupan las comisiones estimadas por vendedor.

## Nuevo indicador
En Administración ERP se agregó una franja de automatizaciones con:
- Ingresos automáticos
- Egresos mantenimiento
- Consumos inventario
- Tareas limpieza
- ROI actualizado
- Comisiones auto

## Importante
Esta V84 no elimina ni reemplaza funciones previas. Solo conecta módulos existentes y agrega campos de inventario dentro de mantenimiento.
