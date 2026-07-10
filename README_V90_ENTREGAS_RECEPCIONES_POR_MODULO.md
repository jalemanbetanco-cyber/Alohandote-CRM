# V90 - Entregas y recepciones por módulo

## Objetivo
Ordenar la lógica de Entrega / Recepción para que no esté todo mezclado en un solo dashboard.

## Cambios
### Renta Car
Dentro del módulo Renta Car ahora aparecen submódulos solo admin:
- Calendario Renta Car
- Entregas
- Recepciones

### Alojamientos
Dentro del módulo Alojamientos ahora aparecen submódulos solo admin:
- Calendario Alojamientos
- Check-in / Entregas
- Check-out / Recepciones

## Lógica
### Renta Car
- Fecha inicio de reserva = vehículo por entregar.
- Fecha final de reserva = vehículo por recibir.

### Alojamientos
- Fecha inicio de reserva = check-in / alojamiento por entregar.
- Fecha final de reserva = check-out / limpieza.

## iCal
Las reservas iCal se mantienen incluidas en los submódulos de Alojamientos:
- Check-in iCal
- Check-out iCal / limpieza

## Acciones
Los botones ya no sacan del módulo:
- Vehículo entregado
- Recibir vehículo
- Check-in realizado
- Limpieza realizada

## Restricción
Los submódulos son solo para admin. El perfil operator no puede ver ni entrar a estos submódulos.

## No se modifica
- Cotizaciones
- Reservas
- Administración ERP
- Inventario ERP
- RRHH ERP
- Mantenimiento
- Rentabilidad KM / ROI
- iCal múltiple
