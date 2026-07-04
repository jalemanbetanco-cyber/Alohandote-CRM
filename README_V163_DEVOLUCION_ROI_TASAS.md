# V163 · Devolución Bs + ROI conectado + tasas BCV

## Cambios aplicados

1. Devoluciones/anulaciones en Bs
- Ahora una reserva anulada con `refundAmountBs` o `refundRawAmount` entra al ledger aunque `refundAmount` USD sea 0.
- La caja disponible en Bs descuenta el monto real devuelto en Bs.
- El cálculo ya no depende de que exista equivalente USD para que la devolución afecte caja.

2. Caja por método
- Las tarjetas de método de pago usan el mismo ledger aceptado que la caja principal.
- Se evita que la vista muestre movimientos rechazados por saneamiento histórico como si afectaran wallets reales.

3. ROI conectado
- El módulo de rentabilidad ahora consolida flota y alojamientos.
- Se agregó ROI por alojamiento con ingresos, noches, limpieza, mantenimiento, utilidad e ingreso por noche.
- La exportación Excel incluye una hoja nueva: `Rentabilidad Alojamientos`.

4. Tasas EURO / USD BCV
- Se agregó panel visible de tasas en Administración ERP.
- Botón `Actualizar tasas` para forzar consulta.
- En Vercel se usa `/api/rates`.
- En local se pueden usar variables fallback en `.env`:
  - `VITE_FALLBACK_EUR_BCV`
  - `VITE_FALLBACK_USD_BCV`
  - `VITE_FALLBACK_USDT_ALCAMBIO`

## Prueba crítica

1. Crear reserva pagada en Bs.
2. Anular con devolución en Bs.
3. Confirmar que `Caja disponible` baja exactamente por el monto devuelto en Bs.
4. Entrar a Rentabilidad KM / ROI y confirmar que muestra flota y alojamientos.
5. En Administración, confirmar panel de tasas y usar `Actualizar tasas`.
