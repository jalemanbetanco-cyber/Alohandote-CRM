# V141 - Balance Bs aislado de cajas USD

## Problema corregido
La caja principal en Bs seguía mostrando un equivalente USD inflado porque los movimientos en USD se estaban convirtiendo a Bs para el balance principal.

## Regla correcta
La caja principal Bs debe sumar solo movimientos reales de Bs:

- pagos en Bs
- compras/ventas de divisas que entran o salen en Bs
- egresos marcados como Bs

Las cajas USD se mantienen separadas:

- Efectivo $
- Zelle
- Binance

## Resultado esperado
El balance principal en Bs ya no debe incluir los USD de Zelle, efectivo o Binance convertidos a Bs.
Debajo del balance principal se muestra solo el equivalente USD del saldo real en Bs.
