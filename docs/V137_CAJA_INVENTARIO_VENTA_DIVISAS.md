# V137 - Caja de inventario y venta de divisas

## Objetivo
Agregar dos ajustes antes de la revisión final sin romper funciones existentes.

## 1. Inventario: forma de pago y caja
El formulario de creación/edición de artículo ahora incluye:

- Tipo de pago: Bs, Zelle, Usdt, $Efectivo.
- Tasa $ BCV.
- Monto en Bs calculado, visible solo cuando el tipo de pago es Bs.

## Regla
Si el artículo se paga en Bs:
- El sistema calcula `cantidad x costo unitario USD x tasa $ BCV`.
- Ese monto en Bs descuenta la caja principal Bs.
- El egreso aparece como `Compra de material`.

Si el artículo se paga en Zelle, Usdt o $Efectivo:
- Se descuenta la caja correspondiente en USD.
- El monto Bs no se muestra en el formulario.

## 2. Administración: Venta de $
Se agregó botón:

`Venta de $`

Usa el mismo formulario base de compra, pero:
- El título cambia a Venta de $.
- La tasa se muestra como Tasa de venta.
- Regla: cantidad USD x tasa de venta = monto Bs.
- Incrementa la caja principal Bs.
- Disminuye la caja de divisa seleccionada: Zelle, Efectivo o Binance/Usdt.

## Validación
Se agregaron validaciones al smoke, production gate y pruebas de negocio.
