# V78 - Búsqueda por fecha de creación + días mobile

## Cambio principal
El motor de búsqueda de Cotizaciones y Reservas ahora filtra por la FECHA DE CREACIÓN del registro.

### Regla aplicada
- Cotizaciones: se muestran por la fecha en que fueron creadas.
- Reservas: se muestran por la fecha en que fueron creadas.
- Ya no se filtra por la fecha del servicio, check-in, check-out, desde o hasta.

## Ejemplo
Si hoy 09/06/2026 se crea una cotización para el 18/06/2026:
- Al buscar 09/06/2026 debe aparecer.
- Al buscar 18/06/2026 no debe aparecer, salvo que haya sido creada ese día.

## Conversión de cotización a reserva
Cuando una cotización se convierte en reserva, la nueva reserva queda con su propia fecha de creación.

## Mobile
Se refuerza la fila de iniciales del calendario:
L M M J V S D
para Renta Car y Alojamientos.

## Nota
Sin package-lock.json para evitar errores en Vercel.
