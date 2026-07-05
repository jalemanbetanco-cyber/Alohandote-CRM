# Smoke tests obligatorios

Ejecutar después de cada despliegue.

## Arranque
- Abrir la app sin errores de consola.
- Confirmar que no aparece pantalla blanca.
- Confirmar login admin.

## Renta Car
- Crear cotización.
- Convertir cotización en reserva.
- Editar reserva.
- Registrar abono.
- Confirmar que la fecha de creación no cambia.

## Alojamientos
- Crear reserva.
- Validar choque con iCal.
- Confirmar que iCal NO aparece como mantenimiento.
- Validar check-in/check-out.

## Mantenimiento
- Crear mantenimiento.
- Confirmar bloqueo en calendario.
- Confirmar que aparece en listado.
- Confirmar costo y medio de pago.

## Administración
- Confirmar ingresos por método de pago.
- Confirmar cuentas por cobrar.
- Confirmar que pagos en Bs no se recalculan con tasa nueva.

## Seguridad
- Perfil admin ve todo.
- Perfil operator legacy abre módulos operativos.
- Perfil solo lectura no debe guardar.
