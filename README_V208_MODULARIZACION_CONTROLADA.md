# V208 - Modularización controlada

Base estable congelada: **V207.3 Hotfix Renta Car / Calendario**.

## Objetivo
Reducir riesgo técnico del CRM sin alterar flujos funcionales aprobados.

## Alcance implementado

### 1. Documentos
Se centralizó el branding documental en:

```text
src/modules/documents/branding.js
```

El `App.jsx` ahora importa desde este módulo:

- `cleanPrintCss`
- `alohandotePdfHeader`
- `alohandoteContactFooter`

No cambia el diseño aprobado de PDF, catálogo, recibos ni cotizaciones.

### 2. Abonos
Se creó dominio puro:

```text
src/modules/payments/paymentHistory.js
```

Incluye:

- `paymentTraceKey`
- `dedupePaymentHistory`
- `appendPaymentOnce`
- `shouldAppendPaymentOnSave`

Este módulo deja aislada la regla anti-duplicación para futuras extracciones sin tocar los flujos estables.

### 3. Alojamientos aliados
Se creó dominio puro:

```text
src/modules/lodging/allyAccounting.js
```

Incluye:

- `isAlliedAccommodation`
- `allyIncomeTargetUsd`
- `calculateAllyBreakdown`

Prepara V209/V210 para separar caja/aliados sin impactar el sistema actual.

### 4. Pruebas V208
Se agregó:

```text
tests/v208-modules.test.mjs
```

y el `production:check` ahora ejecuta también:

```bash
npm run test:v208
```

## No se tocó

- Renta Car estable V207.3
- Calendario
- Caja
- Cuentas por pagar/cobrar
- PDF visual aprobado
- iCal
- Firebase Rules
- Storage Rules
- Inventario
- RRHH
- ROI
- Alojamientos aliados funcionales

## Validación requerida

```bash
npm install
npm run production:check
npm run build
vercel --prod
```

## QA manual obligatorio

- Login
- Seleccionar fecha en calendario Renta Car
- Crear cotización Renta Car
- Crear reserva Renta Car
- Editar/eliminar abono en Renta Car
- Crear reserva alojamiento
- Crear alojamiento aliado
- PDF recibo/cotización
- Caja
- Subir comprobante alojamiento
