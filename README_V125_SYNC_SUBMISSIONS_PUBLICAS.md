# V125 - Sincronizar submissions públicas

## Objetivo
Completar la fase posterior a V124: los links públicos seguros ya no escriben directamente sobre reservas internas; ahora generan submissions. Esta V125 permite que administración/supervisión sincronice esas submissions con las reservas reales.

## Qué agrega
1. Cola de operaciones públicas pendientes en Administración ERP.
2. Botón individual "Sincronizar" para cada operación pública.
3. Botón "Sincronizar pendientes" para procesar hasta 20 operaciones.
4. Al sincronizar:
   - Entrega vehículo: marca reserva como entregada y actualiza km del vehículo.
   - Recepción vehículo: crea recepción, marca reserva como devuelta y actualiza km.
   - Limpieza alojamiento: marca check-out/limpieza completada y descuenta inventario si aplica.
5. Auditoría de sincronización.

## Seguridad
El link público sigue sin escribir directamente sobre reservas internas. Solo crea documentos en:
- publicOperationSubmissions

La sincronización la ejecuta un usuario interno con permisos:
- admin
- supervisor

## Beneficio
Se reduce el riesgo de que un link público modifique datos críticos directamente, pero el equipo puede convertir esas operaciones en cambios reales desde Administración.

## Validación
1. Generar link logística.
2. Abrir en incógnito y completar una operación.
3. Entrar como admin.
4. Abrir Administración ERP.
5. Ver "Operaciones públicas pendientes".
6. Presionar "Sincronizar".
7. Confirmar que la tarea impacta reserva/calendario/inventario según corresponda.
