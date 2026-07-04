# V224 Sprint 1 — Modularización controlada de dashboards

Base estable: V223.5.2.5.

## Alcance
- Se crea `src/modules/dashboards/DashboardCards.jsx`.
- Se extraen componentes presentacionales reutilizables para KPIs, tarjetas clicables y detalle de mantenimiento.
- Renta Car y Alojamientos reutilizan los mismos componentes de dashboard.

## Guardrails
- No se modificó lógica financiera.
- No se modificó caja, CxP, CxC, reservas, abonos, iCal, PDF, roles ni Firebase.
- `App.jsx` sigue orquestando datos; Sprint 1 solo extrae UI del dashboard.

## QA sugerido
1. Abrir dashboard Renta Car.
2. Validar KPIs, gastos y mantenimientos.
3. Abrir dashboard Alojamientos.
4. Validar KPIs, gastos y mantenimientos.
5. Validar que activos propios no muestran Ganancia aliados y aliados sí.
6. Ejecutar `npm run production:check` y `npm run build`.
