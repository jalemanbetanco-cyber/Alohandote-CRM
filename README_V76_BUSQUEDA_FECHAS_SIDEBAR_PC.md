# V76 - Fix búsqueda por fecha y lista de vehículos PC

## Correcciones
- El motor de búsqueda de Cotizaciones y Reservas ahora filtra por fecha de forma más completa.
- El rango de fechas ahora considera:
  - fecha de creación,
  - fecha de actualización,
  - fecha desde,
  - fecha hasta,
  - y reservas/cotizaciones cuyo rango toque el filtro seleccionado.
- Esto corrige el caso donde hoy se crean cotizaciones/reservas con fechas futuras y no aparecían al filtrar por la fecha de creación.

## Diseño PC
- Ajuste únicamente en vista PC para la lista de vehículos del sidebar.
- Cada vehículo muestra claramente:
  - Marca
  - Modelo
- Se mejora la distribución para evitar títulos cortados.
- La vista mobile no se modifica con este ajuste de sidebar.

## Nota
Se entrega sin package-lock.json para evitar errores de Vercel con registry interno.
