# V69 - Correcciones exportación, recepción y mantenimiento

## Cambios
- El formulario de mantenimiento actualiza KM actual y KM objetivo al cambiar de vehículo.
- Se agregó botón Exportar mantenimientos a Excel.
- Se reparó el link público de recepción: ahora usa `/?recepcion=1&vehiculo=ID` para evitar error 404 en Vercel.
- El módulo Reservas ya no muestra reservas importadas desde Airbnb/iCal; solo reservas creadas dentro del sistema.
- Se agregó botón Exportar reservas a Excel dentro del módulo Reservas.
- Se agregó botón Exportar cotizaciones a Excel dentro del módulo Cotizaciones.
- Las exportaciones excluyen bloqueos importados de Airbnb/iCal.
- Mantiene permisos: operator no elimina; admin puede editar/eliminar.

## Nota
No se incluye package-lock.json para evitar instalaciones desde registros internos y reducir errores en Vercel.
