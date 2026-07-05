# V223.5.2.1 — Hotfix Bs CxP Aliados + Guardar Movimiento

## Alcance quirúrgico

Se corrige únicamente el flujo de CxP de activos aliados cuando el método/moneda es Bs y el guardado del formulario de movimientos operativos.

## Cambios aplicados

1. El formulario `Registrar / Editar movimiento operativo` ya no bloquea el guardado cuando la moneda es Bs y el monto USD equivalente es 0, siempre que exista un monto Bs válido.
2. Las CxP de aliados en Bs trabajan en Bs como moneda base:
   - Total reserva Bs.
   - Ganancia Alohandote Bs.
   - Monto a pagar aliado Bs = Total reserva Bs - Ganancia Alohandote Bs.
3. El formulario muestra etiquetas correctas según moneda:
   - `Ganancia Alohandote Bs`.
   - `Monto a pagar aliado Bs`.
4. Al guardar una CxP aliada en Bs, se conserva:
   - `reservationTotalBs`.
   - `alohandoteNetIncomeBs`.
   - `amountBs` como monto real a pagar al aliado.
5. Se mantiene equivalente USD solo como referencia técnica para reportes, no como base del flujo Bs.

## No tocado

- Flujo USD, Zelle, USDT y efectivo USD.
- Reservas propias.
- iCal.
- PDFs.
- Dashboards.
- Roles.
- Abonos.
- Comisiones.

## Validación

- `npm run production:check` aprobado.
- `npm run build` aprobado.
