# V142 - Caja excluye movimientos sin método

## Problema corregido
El balance seguía inflado porque los registros antiguos sin método de pago se estaban normalizando como Bs.

## Solución
- `paymentBucket` vuelve a clasificar movimientos sin método como `Sin método`.
- La caja visible solo usa métodos válidos:
  - Efectivo $
  - Zelle
  - Binance
  - Bs
- Los movimientos sin método se excluyen de los totales de caja.
- Se muestra una alerta de calidad de datos indicando cuántos movimientos antiguos faltan por corregir.

## Resultado esperado
El balance principal en Bs ya no debe sumar registros sin método.
Las cajas USD no se convierten a Bs.
No aparece una tarjeta de caja llamada "Sin método".
