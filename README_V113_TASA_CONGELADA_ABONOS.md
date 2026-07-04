# V113 - Tasa congelada para abonos y reservas pagadas

## Problema corregido
Las reservas con abonos o pagos 100% completados se estaban recalculando con la tasa EURO actual.
Eso causaba que una reserva ya pagada volviera a mostrar diferencia pendiente cuando cambiaba la tasa.

## Nueva regla
Al guardar una reserva o cotización, el sistema conserva la tasa usada en ese momento:

- bcvEuroRate
- totalAmountBs
- amountBs
- amountUsdEquivalent

## Comportamiento esperado
Si hoy guardas una reserva con:
- Total: USD 70
- Abono: Bs 46.716,03
- Tasa EURO: 667,37

El sistema calcula y guarda:
- Abono equivalente: USD 70
- Pendiente: USD 0 / Bs 0

Si mañana cambia la tasa EURO, esa reserva NO se recalcula contra la nueva tasa.

## Aplica a
- Renta Car
- Alojamientos
- Cuentas por cobrar
- Caja general
- Dashboard administrativo
- Comprobantes PDF

## Regla técnica
Ahora `euroRateValue()` prioriza la tasa guardada del registro antes que la tasa actual:
- Primero usa bcvEuroRate del registro.
- Si no existe, usa la tasa actual del sistema.

## No cambia
- La tasa actual seguirá aplicando para nuevas reservas/cotizaciones.
- Las reservas antiguas sin tasa guardada usarán la tasa actual como respaldo visual.
