# V223.1 — Liquidación de Comisiones

Base: V223.0 Stable.

## Objetivo
Permitir pagar comisiones de vendedores como una salida real de caja, manteniendo la comisión como cuenta por pagar hasta que se liquide.

## Cambios
- Las comisiones pendientes ya no descuentan caja automáticamente.
- En Cuentas por pagar aparece el botón **Pagar comisión** para registros de comisión vendedor.
- Al pagar una comisión se registra:
  - fecha de pago
  - método de pago
  - referencia
  - monto USD
  - monto Bs si aplica
  - usuario que liquidó
- La comisión pasa a estado **Pagado**.
- El movimiento pagado entra al ledger de caja como egreso según el método seleccionado.
- La cuenta por pagar desaparece del listado pendiente al quedar liquidada.

## Validación
- `npm run production:check` aprobado.
- `npm run build` no ejecutado en este entorno porque no está instalado `vite/node_modules`.

## Módulos no alterados
Caja base, reservas, abonos, iCal, documentos, logística, ROI, inventario, RRHH y flujo comercial estable.
