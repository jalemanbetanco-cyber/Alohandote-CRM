# V202 - Perfil operador sincronizado en vivo

## Objetivo
Corregir que el perfil operador no refleje la información actualizada desde Admin/RRHH.

## Alcance
- Se mantiene V200/V201 como base estable.
- Se agrega sincronización en tiempo real para `users/{uid}` y `hrPeople` por correo.
- El operador ve nombre, rol y fuente del perfil en el sidebar.
- Si Admin actualiza el nombre, rol, acceso o estado del colaborador, la sesión del operador se actualiza sin cerrar sesión.

## No modificado
- iCal Airbnb / Estei
- Caja
- Tasas BCV
- Reservas
- Abonos históricos V201
- Kilometraje
- ROI y gastos
- Mantenimiento
- RRHH base
- Inventario
- Documentos
- Firebase Rules

## Prueba de aceptación
1. Entrar como operador.
2. Desde Admin/RRHH cambiar el nombre o perfil de permisos del operador.
3. Guardar.
4. Volver a la sesión operador sin cerrar sesión.
5. El sidebar debe reflejar el cambio.
6. Crear una reserva y validar que `createdByName` use el nombre actualizado.
