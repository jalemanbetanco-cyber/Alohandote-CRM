# V221 — Correcciones Operativas + Aliados Renta Car

Base congelada: V220 STABLE.

## Cambios quirúrgicos

1. Abonos: después de editar/eliminar un abono, el sistema recalcula el historial real y permite registrar un nuevo abono solo por el diferencial ingresado, evitando falsos errores de “abono mayor al total”.
2. PDFs vendedor/vendedor alojamiento: cotizaciones y comprobantes salen en formato genérico, sin logo ni datos de contacto corporativos.
3. iCal: sincronización silenciosa cada 10 minutos para calendarios externos vinculados; reemplaza bloqueos importados y refleja modificaciones/cancelaciones externas en operaciones.
4. Link operaciones colaboradores: excluye alojamientos y vehículos aliados; solo muestra activos propios.
5. Alojamientos: se agregan ítems Microondas y Air fryer al formulario y catálogo.
6. Renta Car: vehículos propios/aliados con ganancia Alohandote y cuenta por pagar automática al propietario.

## Módulos preservados

No se alteró la estructura estable de caja, PDFs admin, reservas base, calendario, Firebase, iCal público, inventario, RRHH, ROI ni backups.

## Validación

```bash
npm run production:check
npm run build
```
