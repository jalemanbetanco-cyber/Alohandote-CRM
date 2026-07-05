# V213 - Núcleo Financiero Controlado

## Objetivo
Separar reglas puras de pagos, cuentas por cobrar y cuentas por pagar para reducir riesgo financiero sin tocar la UI ni los flujos estables.

## Alcance
- `src/modules/financial/currencyCore.js`
- `src/modules/financial/paymentCore.js`
- `src/modules/accountsReceivable/accountsReceivableCore.js`
- `src/modules/accountsPayable/accountsPayableCore.js`
- `tests/v213-financial-core.test.mjs`

## Principios
- No modifica `App.jsx`.
- No altera caja, reservas, calendario, PDF, iCal, Firebase, aliados ni RRHH/inventario/ROI.
- Mantiene V211.1 como regla activa para abonos editados/eliminados y CxC por divisas.
- Prepara extracción gradual futura del núcleo financiero.

## Validación
Ejecutar:

```bash
npm run production:check
npm run build
```

## Criterios QA
- Abonos en Bs conservan CxC en Bs.
- Abonos en Zelle/USDT/efectivo USD conservan CxC en USD.
- Edición/eliminación de abonos usa el borrador visible como fuente de verdad.
- CxP calcula moneda operativa según método de pago.
