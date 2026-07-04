# V223.3.1 Hotfix JSX Dashboard

## Objetivo
Corregir exclusivamente el error de compilación en `src/App.jsx` reportado por Vite/esbuild:

`Expected "}" but found "{"` en la línea del dashboard de Renta Car.

## Cambio aplicado
Se envolvieron los dos bloques JSX hermanos del dashboard (`analytics-strip` y `dashboard-maintenance-detail`) dentro de un Fragment:

```jsx
{canViewDashboard && (
  <>
    <section className="analytics-strip">...</section>
    {analytics.maintenance.length > 0 && <section>...</section>}
  </>
)}
```

## Alcance
- No modifica lógica financiera.
- No modifica caja.
- No modifica reservas.
- No modifica comisiones.
- No modifica iCal.
- No modifica PDFs.
- No modifica roles.
- No modifica dashboard de alojamientos.

## Validación esperada local
Ejecutar:

```bash
npm install --legacy-peer-deps --no-audit --no-fund
npm run production:check
npm run build
vercel --prod
```

## Resultado esperado
El build debe superar el error de sintaxis JSX en `App.jsx`.
