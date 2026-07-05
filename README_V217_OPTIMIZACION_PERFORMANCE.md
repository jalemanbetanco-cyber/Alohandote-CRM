# V217 - Optimización Performance Controlada

## Objetivo
Preparar el CRM para crecer con más reservas, vehículos, alojamientos, abonos y movimientos sin degradar la experiencia operativa.

## Alcance aplicado
- Se agrega `src/modules/performance/` como capa pura de soporte.
- Se agregan utilidades para clasificar tamaño de datasets.
- Se agregan recomendaciones para virtualización/paginación.
- Se agrega construcción estable de claves de memoización.
- Se agrega núcleo de cache temporal seguro.
- Se agrega planificador de consultas por rango de fechas.
- Se agregan pruebas `test:v217`.

## Principio de seguridad
Esta versión no modifica flujos activos ni UI. Solo agrega módulos puros reutilizables para siguientes fases.

## No se tocó
- `src/App.jsx`
- Caja
- Abonos
- Reservas
- Calendario
- Renta Car
- PDFs
- iCal
- Firebase/Storage
- Aliados
- RRHH / Inventario / ROI

## Validación
```bash
npm run production:check
npm run build
```

## Próxima fase sugerida
V218 puede integrar progresivamente estos helpers dentro de listados pesados, empezando por dashboards y reportes, siempre con pruebas de regresión.
