# V140 - Caja Bs real y eliminación de caja sin método

## Problemas corregidos

### 1. Caja Bs con cálculo incorrecto
La caja principal en Bs se estaba calculando convirtiendo totales USD a la tasa actual. Eso podía distorsionar el valor real.

Ahora se calcula bajo la misma estructura de los formularios:

- Si el movimiento ya trae monto Bs real (`amountBsManual`), se usa ese monto.
- Si no trae monto Bs real, se convierte con la tasa guardada del registro.
- La utilidad en Bs se calcula como `incomeBs - expensesBs`.

### 2. Caja "Sin método"
Se eliminó la tarjeta `Sin método` del panel de caja por método.

Ahora solo se muestran:
- Efectivo $
- Zelle
- Binance
- Bs

## Regla operativa
Los movimientos nuevos deben tener método de pago. Si un registro antiguo no tiene método, el sistema lo normaliza para evitar crear una caja separada sin método.
