# V224 Sprint 2 — Modularización Calendarios

Esta versión agrega la estructura base para modularizar calendarios sin alterar la lógica estable.

Componentes agregados:

- `src/modules/calendar/components/CalendarToolbar.jsx`
- `src/modules/calendar/components/CalendarWeekdays.jsx`
- `src/modules/calendar/components/CalendarDayGrid.jsx`
- `src/modules/calendar/components/CalendarPanel.jsx`

Criterio de seguridad:

- App.jsx mantiene el comportamiento actual.
- Los componentes quedan listos para migración progresiva.
- No toca caja, reservas, iCal, PDFs, abonos, CxP, CxC ni Firebase.

Validación recomendada:

```bash
npm install --legacy-peer-deps --no-audit --no-fund
npm run production:check
npm run build
vercel --prod
```
