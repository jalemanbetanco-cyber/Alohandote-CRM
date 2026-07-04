# V224 Sprint 2 — Modularización Calendarios

Base estable: V224 Sprint 1 / V223.5.2.5.

Objetivo: preparar la extracción controlada del calendario sin alterar comportamiento funcional.

Se agregan componentes reutilizables:

- `CalendarToolbar.jsx`
- `CalendarWeekdays.jsx`
- `CalendarDayGrid.jsx`
- `CalendarPanel.jsx`

Alcance seguro:

- No se modifica la lógica de reservas.
- No se modifica caja.
- No se modifica iCal.
- No se modifica Firebase.
- No se modifica PDF.
- No se modifica CxP/CxC.

La integración funcional completa del calendario debe continuar de forma gradual, comparando visualmente contra la baseline estable antes de eliminar JSX antiguo de `App.jsx`.
