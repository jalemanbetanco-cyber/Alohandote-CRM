# V221.8 Hotfix Abonos + Mobile + ROI

## Alcance quirúrgico

1. Corrección del flujo de abonos en edición de reservas.
2. Ajuste mobile de botones Editar/Eliminar abono.
3. Visualización mobile de “Reservas cerradas por kilometraje” en ROI.

## Corrección principal

En una reserva existente, el campo de monto ya no representa el total histórico de abonos. Ahora representa únicamente un nuevo abono a registrar.

- El historial queda como fuente de verdad.
- Al abrir una reserva existente, el input de nuevo abono queda vacío.
- Editar o eliminar abonos no rellena el input con sumatorias históricas.
- El cálculo de “Abono equivalente” y “Diferencia a pagar” considera el historial más el nuevo abono pendiente antes de guardar.

## Mobile

Los botones del historial de abonos quedan proporcionados en dos columnas dentro del modal.

## ROI mobile

Se habilita nuevamente la sección “Reservas cerradas por kilometraje” en mobile con scroll horizontal seguro.

## No se toca

- Caja estable.
- iCal.
- PDFs.
- Reservas manuales.
- Renta Car.
- Alojamientos.
- Aliados.
- Firebase.
- RRHH / Inventario / ROI base.

## Validación

```bash
npm run test:v2218
npm run production:check
```
