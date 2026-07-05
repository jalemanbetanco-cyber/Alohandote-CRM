# V109 - Abonos por moneda real

## Corrección
El sistema ahora interpreta el monto abonado según el método seleccionado.

## Regla
Si el método del abono es:
- $ Efectivo
- Zelle
- Usdt

El monto ingresado se interpreta como USD.

Si el método del abono es:
- Pago en BS

El monto ingresado se interpreta como bolívares y el sistema calcula:

Abono equivalente USD = Monto Bs / Tasa EURO

## Cambios visuales
Se reemplaza:
- Abono equivalente Bs

Por:
- Abono equivalente $

Debajo se muestra la referencia en Bs.

## Diferencia a pagar
La diferencia a pagar ahora se calcula con el equivalente real en USD:

Pendiente USD = Total USD - Abono equivalente USD
Pendiente Bs = Pendiente USD x Tasa EURO

## Aplica para
- Cotizador Renta Car
- Cotizador Alojamientos
- Dashboard administrativo / caja
- Cuentas por cobrar
- Recibos PDF
