# Alohandote CRM V224 Sprint 4 — Modularización ERP

## Objetivo

Sprint de ingeniería sin cambios funcionales. Se inicia la separación del ERP administrativo para que `App.jsx` deje de ser el único punto de crecimiento del sistema.

## Alcance aplicado

- Se crea `src/modules/erp/` como carpeta formal del ERP.
- Se crea `ErpModuleShell.jsx` y se integra en `App.jsx` como contenedor del panel Administración ERP.
- Se agregan archivos base por dominio ERP:
  - `Caja.jsx`
  - `Income.jsx`
  - `Expenses.jsx`
  - `CxP.jsx`
  - `CxC.jsx`
  - `index.js`
- No se modifica la lógica de caja, reservas, CxP, CxC, iCal, PDF, abonos, Firebase, inventario, RRHH ni ROI.

## Criterio de seguridad

La migración es incremental: primero se crea el límite modular y luego, en siguientes iteraciones, se irán moviendo tablas, cálculos y servicios sin alterar comportamiento.

## Validación esperada

```bash
npm run production:check
npm run build
```
