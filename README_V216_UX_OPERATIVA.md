# V216 UX Operativa Controlada

## Objetivo
Mejorar la experiencia operativa del CRM con una capa de utilidades UX reutilizables y testeables, sin alterar flujos estables ni tocar `App.jsx`.

## Alcance
- `src/modules/ux/formGuidanceCore.js`: guía de formularios para reservas y abonos.
- `src/modules/ux/quickActionsCore.js`: acciones rápidas y estados vacíos operativos.
- `src/modules/ux/searchFilterCore.js`: búsqueda/filtros normalizados.
- `src/modules/ux/uxTypes.js`: constantes UX.
- `tests/v216-ux-operativa.test.mjs`: pruebas de regresión UX.

## No modificado
- Caja.
- Reservas.
- Abonos.
- PDFs.
- Calendario.
- Renta Car.
- iCal.
- Firebase.
- Aliados.
- RRHH / Inventario / ROI.

## Validación
Ejecutar:

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
```

## Resultado esperado
La V216 deja preparada una base de UX operativa para futuras mejoras visuales sin acoplar lógica nueva a `App.jsx`.
