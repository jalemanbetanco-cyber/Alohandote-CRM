# V87 - Entrega / Recepción segmentada

## Correcciones
- Se elimina el error de mostrar entregas antiguas o fuera de fecha.
- El dashboard ya no muestra reservas pasadas como pendientes.
- Solo se muestran operaciones:
  - De hoy
  - De los próximos 2 días

## Nueva segmentación
El módulo Entrega / Recepción ahora separa claramente:

### Hoy
- Vehículos por entregar
- Alojamientos por entregar / check-in
- Vehículos por recibir
- Alojamientos por recibir / check-out

### Próximos 2 días
- Próximas entregas de vehículos
- Próximos check-in de alojamientos
- Próximas recepciones de vehículos
- Próximos check-out de alojamientos

## Lógica usada
- Vehículo por entregar = fecha inicio de reserva
- Vehículo por recibir = fecha fin de reserva
- Alojamiento por entregar / check-in = fecha inicio de reserva
- Alojamiento por recibir / check-out = fecha fin de reserva

## No se modifica
- Renta Car
- Alojamientos
- Cotizaciones
- Reservas
- Administración ERP
- Inventario ERP
- RRHH ERP
- Mantenimiento
- Rentabilidad KM / ROI
- iCal múltiple
