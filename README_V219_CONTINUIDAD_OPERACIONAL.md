# V219 — Continuidad Operacional y Release Readiness

## Objetivo
Agregar una capa técnica de continuidad operacional para reducir riesgos de despliegue, rollback y respaldo, sin modificar flujos funcionales del CRM.

## Alcance
- Nuevo módulo `src/modules/ops/`.
- Checklist GO/NO-GO para despliegues.
- Plan de rollback estructurado.
- Manifiesto de respaldo de colecciones y archivos.
- Clasificación de riesgo operacional.
- Prueba `test:v219` integrada al `production:check`.

## No se tocó
- `App.jsx`.
- Caja.
- Reservas.
- Abonos.
- PDFs.
- Calendario.
- Renta Car.
- iCal.
- Firebase funcional.
- Aliados.
- RRHH / Inventario / ROI.

## Validación recomendada
```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
vercel --prod
```

## Criterio GO/NO-GO
La versión solo debe congelarse si pasan:
- `production:check`.
- `build`.
- Login.
- Crear reserva alojamiento.
- Crear reserva Renta Car.
- Crear, editar y eliminar abono.
- Caja.
- PDF cotización y recibo.
- Operaciones públicas.
