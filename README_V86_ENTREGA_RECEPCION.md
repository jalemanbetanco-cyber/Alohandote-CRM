# V86 - Entrega / Recepción

## Objetivo
Transformar el módulo Recepción en un módulo compartido de **Entrega / Recepción**.

## Cambios
- El botón del módulo ahora se llama **Entrega / Recepción**.
- El sistema lee los calendarios de:
  - Renta Car
  - Alojamientos
- Identifica operaciones por fechas:
  - Vehículos a entregar según fecha de inicio de reserva.
  - Vehículos a recibir según fecha final de reserva.
  - Alojamientos a entregar / check-in según fecha de inicio.
  - Alojamientos a recibir / check-out según fecha de salida.
- Se muestran separadas:
  - Entregas / check-in de hoy
  - Recepciones / check-out de hoy
  - Próximas operaciones de los próximos 2 días
- No muestra operaciones futuras posteriores a 2 días para no saturar el dashboard.

## Importante
No modifica:
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
