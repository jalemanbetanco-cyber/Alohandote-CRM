# V64 - Corrección buscador de cotizaciones

## Problema corregido
Al buscar una cotización de alojamiento, el sistema podía abrir el formulario de Renta Car con un vehículo seleccionado.

## Corrección
- El buscador ahora infiere correctamente si una cotización pertenece a Alojamientos o Renta Car.
- Usa `module`, `serviceType`, `accommodationId`, `vehicleId` y otros campos relacionados.
- Las nuevas cotizaciones guardan `module`, `serviceType`, `vehicleId` y `accommodationId` para evitar confusiones futuras.
- Al abrir una cotización de alojamiento, abre el formulario de alojamiento.
- Al abrir una cotización de Renta Car, abre el formulario de Renta Car.

## Nota
Las cotizaciones antiguas que no tengan ningún dato de módulo se asignarán según el contexto disponible. Las nuevas quedarán correctamente clasificadas.
