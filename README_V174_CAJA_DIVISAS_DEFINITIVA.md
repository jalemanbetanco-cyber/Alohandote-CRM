# V174 · Caja Divisas Definitiva

Corrección puntual sobre V173.

## Reglas corregidas

1. Compra de dólares:
   - Suma USD en la caja seleccionada: Efectivo $, Zelle o Binance/USDT.
   - Descuenta el monto en Bs de la Caja disponible principal.
   - Si no hay Bs suficientes, no registra la compra.

2. Venta de dólares:
   - Descuenta USD de la caja seleccionada.
   - Suma Bs a la Caja disponible principal.
   - Si no hay USD suficientes, no registra la venta.

3. Caja por método:
   - Se elimina la tarjeta visual Bs del bloque “Dónde está el dinero” para evitar doble lectura.
   - La Caja Bs queda representada únicamente por la Caja disponible principal.

## Motivo técnico

En V173 la salida Bs por compra de divisas se reflejaba en la caja por método, pero no siempre entraba al cálculo principal de `Caja disponible`. En V174 `dollarPurchaseOutBs` se suma explícitamente a `expensesBs`, por lo que la caja principal baja correctamente al comprar dólares.
