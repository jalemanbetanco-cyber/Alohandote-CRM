# V212 — Modularización profunda controlada Calendario + Renta Car

## Objetivo
Reducir riesgo técnico sin alterar comportamiento estable del CRM. Esta versión agrega núcleos puros para calendario y Renta Car, dejando preparada la extracción progresiva desde `App.jsx`.

## Alcance aplicado
- Nuevo módulo `src/modules/calendar/calendarCore.js`.
- Nuevo módulo `src/modules/rentcar/rentcarCore.js`.
- Nueva suite `tests/v212-calendar-rentcar-modules.test.mjs`.
- Nuevo script `test:v212`.
- `production:check` ahora valida V212.
- `package.json` actualizado a `1.0.212`.

## Reglas protegidas
- Las reservas anuladas no bloquean calendario.
- Renta Car no depende de `accommodationId`.
- Los conflictos de Renta Car se calculan por vehículo y rango de fechas.
- Cotización Renta Car mantiene días, tarifa diaria y kilometraje.

## No se modificó
- `src/App.jsx`.
- Caja.
- Abonos.
- Cuentas por cobrar/pagar.
- PDFs V211.
- iCal.
- Firebase/Storage.
- Aliados.
- Inventario, RRHH y ROI.

## Validación requerida
```bash
npm install
npm run production:check
npm run build
vercel --prod
```

## QA manual recomendado
- Entrar al calendario en fechas con reservas Renta Car.
- Crear cotización Renta Car.
- Crear reserva Renta Car.
- Confirmar que reservas anuladas no bloqueen disponibilidad.
- Validar PDF de cotización/recibo.
- Validar caja y abonos sin cambios.
