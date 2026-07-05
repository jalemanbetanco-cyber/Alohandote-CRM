# V105 - Dashboard administrativo UX + Compra de $

## 1. Dashboard más simétrico
Se ajusta la visual del dashboard administrativo:
- Títulos más grandes y destacados.
- Monto en USD al doble de tamaño aproximado respecto a V104.
- Monto en Bs se mantiene secundario y pequeño.
- Texto centrado y ajustado a cada campo/tarjeta.
- Mejor proporción en web y mobile.

## 2. Botón Compra de $
Se agrega botón "Compra de $" al lado izquierdo de "Exportar administración".

## 3. Formulario Compra de $
Campos:
- Tipo de divisas: Zelle / Efectivo / Usdt
- Cantidad
- Tasa de compra
- Monto en Bs
- Nota / referencia

## 4. Regla de caja
Al guardar una compra:
- Suma la cantidad en USD a la caja correspondiente:
  - Zelle
  - Efectivo $
  - Binance para Usdt
- Resta el monto en Bs de la caja Bs.
- Registra el movimiento en caja general.
- Exporta la hoja "Compras de dolares" en el Excel de administración.

## Nota
La compra de divisas representa un movimiento interno de caja, no una reserva.
