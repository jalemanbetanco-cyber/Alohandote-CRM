# V201 · Abonos históricos con tasa congelada

## Objetivo

Implementar una mejora financiera para que cada abono de reserva conserve su tasa histórica y no sea recalculado cuando la tasa EURO BCV cambie.

## Alcance aplicado

- Renta Car: reservas/bloqueos reservados.
- Alojamientos: reservas de alojamiento.
- Cálculo de total abonado USD y Bs mediante historial de abonos.
- Saldo pendiente calculado contra suma de abonos históricos en USD.
- Saldo pendiente en Bs mostrado con tasa actual/efectiva del registro.
- Compatibilidad con reservas antiguas: migra en memoria el abono único previo a `paymentHistory` sin romper datos existentes.

## Regla financiera

Cada abono queda congelado con:

- fecha del abono,
- método de pago,
- monto bruto ingresado,
- equivalente Bs,
- equivalente USD,
- tasa EURO BCV usada,
- referencia del pago.

Los abonos previos no se recalculan con la tasa actual.

## No modificado

- iCal Airbnb / Estei.
- Cajas existentes y ledger firmado.
- Tasas BCV en línea.
- Disponibilidad/calendarios.
- Kilometraje, entrega y recepción.
- ROI y gastos aprobados.
- Mantenimiento.
- RRHH e inventario.
- Documentos con overlay V200.
- Firebase rules / Storage rules.

## Validaciones ejecutadas

- `npm run production:check`: aprobado.
- `npm run release:preflight`: aprobado.
- `npm run build`: aprobado.

## Advertencias no bloqueantes heredadas

- Vite advierte patrón dinámico de `api/rates.js?ts=*` en `vite.config.js`.
- Esbuild advierte claves duplicadas históricas de mantenimiento (`currentKm`, `nextMaintenanceEveryKm`, `maintenanceTargetKm`).
- Chunk JS mayor a 500 KB.

Estas advertencias ya existían y no fueron alteradas para preservar estabilidad.

## Prueba recomendada

1. Crear o abrir una reserva con abono inicial en Bs.
2. Confirmar que aparece historial de abonos congelados.
3. Cambiar el campo de abono para registrar un segundo pago con tasa actual.
4. Guardar.
5. Confirmar que el primer abono no cambia.
6. Confirmar que el total abonado suma ambos equivalentes USD.
7. Confirmar que la diferencia pendiente queda correcta.
8. Confirmar que iCal, caja, documentos y ROI siguen operando igual.
