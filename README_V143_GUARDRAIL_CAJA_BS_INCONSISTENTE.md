# V143 - Guardrail financiero para caja Bs

## Problema corregido
El balance principal en Bs seguía inflado porque algunos movimientos en Bs tenían montos inconsistentes frente al total USD de la reserva.

## Regla aplicada
La caja Bs solo suma movimientos si:

1. Tienen método válido.
2. Si son Bs, su equivalente USD no supera el total de la reserva por más de 5%.

Ejemplo:
- Reserva total: 50 USD.
- Pago Bs equivale a 50 USD: se suma.
- Pago Bs equivale a 1.000 USD: se excluye y se marca como dato inconsistente.

## Resultado
Los movimientos problemáticos no contaminan caja.
El sistema muestra alerta de calidad de datos:
- método faltante
- monto Bs inconsistente

## Qué debe hacer operación
Editar el registro origen y corregir:
- método de pago,
- monto abonado,
- tasa congelada,
- total de reserva.
