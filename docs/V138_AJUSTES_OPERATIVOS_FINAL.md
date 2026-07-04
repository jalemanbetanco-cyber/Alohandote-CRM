# V138 - Ajustes operativos finales

## Cambios incluidos

### 1. Reservas Renta Car por hora
La validación de conflicto ahora usa fecha + hora.

Regla:
- Si una reserva devuelve el vehículo antes o justo a la hora de entrega de otra reserva del mismo día, se permite guardar.
- Si la devolución se cruza con la entrega de la otra reserva, se bloquea.

Ejemplo:
- Reserva A devuelve 12/06 a las 09:00.
- Reserva B inicia 12/06 a las 12:00.
- Permitido.

### 2. Cajas
La caja principal de Administración ahora se muestra en Bs.
Debajo muestra el equivalente en USD usando la tasa EURO del cotizador.

Las cajas de divisa:
- Efectivo $
- Zelle
- Binance

muestran solo USD y ya no muestran monto Bs debajo.

La caja Bs muestra Bs y debajo su equivalente USD.

### 3. Cuentas por pagar
La tabla de cuentas por pagar ahora incluye acciones:
- Editar
- Borrar

Según el origen:
- Mantenimiento: abre o elimina/anula el mantenimiento.
- Inventario: abre o elimina el artículo/material.
- Devolución: anula el pendiente de devolución.
- Comisión: marca la comisión como anulada.
