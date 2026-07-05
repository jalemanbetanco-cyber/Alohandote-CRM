# Alohandote V175 · Reglas definitivas de caja para reservas

## Objetivo
Fijar la lógica exacta de cajas para Renta Car y Alojamientos sin tocar compra/venta de divisas.

## Reglas implementadas

### 1. Reserva abonada en Bs
- El monto abonado en Bs entra a Caja disponible.
- La diferencia pendiente queda registrada en Cuentas por cobrar.
- Cuando el pago queda completo / sin diferencia por pagar, sale de Cuentas por cobrar.

### 2. Reserva abonada en Zelle / USDT / Efectivo $
- El monto abonado entra solamente en la caja USD correspondiente.
- La diferencia pendiente queda pendiente operativa en USD.
- No se registra en Cuentas por cobrar Bs.
- No altera Caja disponible Bs.

### 3. Compra y venta de $
No se modificó la lógica de compra/venta de divisas validada en V174.

### 4. Cuentas por pagar
- Todo gasto con estado Por pagar aparece en Cuentas por pagar sin descontar caja.
- Solo cuando el gasto pasa a Pagado afecta la caja que corresponda.

## Alcance
Aplica a los módulos Renta Car y Alojamientos.
