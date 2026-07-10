# V77 - Fix búsqueda por fecha + días mobile

## Corrección búsqueda por fecha
El filtro de fechas ahora funciona de forma estricta:
- Si el registro tiene fecha Desde/Hasta, se filtra por ese rango de servicio.
- Ya no muestra reservas/cotizaciones fuera del rango solo porque fueron creadas o modificadas ese día.
- Si un lead antiguo no tiene fecha de servicio, usa fecha de creación/actualización como respaldo.

## Calendario mobile
- Se agrega fila visible de iniciales de días:
  L M M J V S D
- Aplica en Renta Car y Alojamientos.
- En PC se mantiene la etiqueta completa: Lun., Mar., Mié., etc.

## Nota
Se entrega sin package-lock.json para evitar errores de registry en Vercel.
