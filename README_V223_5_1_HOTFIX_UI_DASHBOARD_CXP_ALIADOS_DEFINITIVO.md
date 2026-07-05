# V223.5.1 — Hotfix UI Dashboard + CxP Aliados Definitivo

Base: V223.5 Motor Financiero de Activos Aliados.

## Cambios aplicados

1. Dashboard Renta Car y Alojamientos
   - KPI de Gastos por activo visible y clicable.
   - Detalle de gastos por activo en modal.
   - KPI de Ganancia aliados solo visible si el activo es Aliado.
   - Mantenimiento del dashboard ahora abre detalle con fecha, tipo, costo, estado y notas.

2. Detección de activos aliados
   - Se reforzó la detección de activos aliados leyendo distintos campos posibles: ownershipType, accommodationType, vehicleOwnershipType, assetStatus, propertyStatus, commercialStatus, businessModel, lodgingOwnershipType, entre otros.
   - Esto evita que un activo marcado como Aliado no genere CxP por diferencias de nombre de campo.

3. CxP de aliados
   - Toda reserva de activo aliado calcula CxP por el monto total que corresponde al aliado.
   - Fórmula: monto aliado = total reserva - ganancia Alohandote.
   - El monto ya no depende proporcionalmente del abono registrado.
   - La ganancia Alohandote queda editable desde la CxP.

4. Registrar movimiento
   - El formulario muestra Tasa Euro BCV como referencia operativa.

## Validación ejecutada

- npm run production:check: OK
- Build validado ejecutando Vite directamente por limitación de symlink de node_modules en Linux:
  node node_modules/vite/bin/vite.js build: OK

## Comandos recomendados en Windows / VS Code

npm install --legacy-peer-deps --no-audit --no-fund
npm run production:check
npm run build
vercel --prod
