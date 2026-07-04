# V123 - Auditoría funcional de acciones críticas

## Objetivo
Registrar acciones críticas del sistema para mejorar trazabilidad, control interno, soporte y seguridad operativa.

## Qué se registra
La colección `auditLogs` registra eventos como:

- Crear / editar reserva Renta Car.
- Crear / editar reserva de alojamiento.
- Crear / editar mantenimiento.
- Entrega de vehículo.
- Recepción de vehículo.
- Crear / editar vehículo.
- Crear / editar alojamiento.
- Eliminar vehículo y sus reservas relacionadas.
- Eliminar alojamiento.
- Crear / editar artículo de inventario.
- Movimientos de inventario: entrada/salida.
- Crear / editar personal RRHH.
- Compra de divisas en Administración.

## Datos guardados por evento
Cada evento guarda:

- Acción.
- Módulo.
- ID del registro afectado.
- Resumen del registro.
- Usuario, correo, rol y UID.
- Fecha y hora.
- Origen: admin-app, public-operations o public-reception.
- Datos extra relevantes.

## Visualización
En Administración ERP se agregó la tarjeta:

- Auditoría reciente

Muestra las últimas acciones críticas: fecha, acción, módulo y usuario.

## Seguridad
La colección `auditLogs` mantiene la regla definida desde V115/V117:

- Lectura: admin/supervisor.
- Creación: usuario autenticado con acceso.
- Edición y eliminación: bloqueadas.

## Importante
La auditoría no debe bloquear el flujo principal. Si por alguna razón el log falla, el sistema registra una advertencia en consola y permite continuar la operación.

## Validación
1. Crear una reserva Renta Car.
2. Abrir Administración ERP.
3. Confirmar que aparece un registro `reservation_created`.
4. Registrar recepción de vehículo.
5. Confirmar evento `vehicle_reception_completed`.
6. Crear movimiento de inventario.
7. Confirmar evento de entrada/salida.
