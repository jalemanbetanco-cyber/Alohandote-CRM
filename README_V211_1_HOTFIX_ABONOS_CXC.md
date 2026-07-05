# V211.1 Hotfix — Abonos editados/eliminados y CxC multi-método

## Objetivo
Corregir dos defectos puntuales detectados en pruebas de usuario sin modificar módulos estables.

## Alcance quirúrgico
1. Alojamientos: al editar o eliminar abonos y luego presionar Guardar, se conserva exactamente el historial visible en pantalla.
2. Renta Car: se mantiene la protección ya existente de `_paymentsEdited`.
3. Cuentas por cobrar: si existe un abono real y la reserva queda con saldo pendiente, se registra CxC aunque el método sea Zelle, USDT o efectivo USD.

## No se tocó
- Calendario
- Crear reservas
- Caja
- PDFs V211
- iCal
- Firebase/Storage
- Aliados
- Inventario
- RRHH
- ROI

## Validación requerida
```bash
npm install
npm run production:check
npm run build
vercel --prod
```

## Pruebas manuales GO/NO-GO
- Alojamientos: crear abono, editar abono, guardar, reabrir y validar que no reaparece el valor anterior.
- Alojamientos: eliminar abono, guardar, reabrir y validar que no reaparece.
- Renta Car: repetir edición/eliminación de abono.
- Crear reserva con abono por Zelle / USDT / efectivo USD y validar que el saldo pendiente aparece en Cuentas por cobrar como USD.
- Crear reserva con abono en Bs y validar que el saldo pendiente aparece como Bs.
