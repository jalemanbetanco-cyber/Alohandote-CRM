# V83 - Recursos Humanos ERP Base

## Objetivo
Agregar la capa de Recursos Humanos sobre el sistema anterior sin romper Renta Car, Alojamientos, Reservas, Recepción, Mantenimiento, ROI, Administración ni Inventario.

## Nuevo módulo
Se agrega **RRHH ERP** para perfil admin.

## Incluye
- Personal.
- Roles.
- Tareas operativas.
- Comisiones por vendedor.
- Actividad del equipo.
- Matriz base de permisos más detallados.
- Exportación Excel.

## Personal
Cada colaborador contiene:
- Nombre
- Cédula
- Teléfono
- Correo
- Rol
- Área
- Tipo de relación
- Sueldo base
- Comisión %
- Estado
- Observaciones

## Tareas operativas
Permite crear tareas para:
- Renta Car
- Alojamientos
- Recepción vehículos
- Mantenimiento
- Inventario
- Administración

Campos:
- Tarea
- Responsable
- Fecha
- Prioridad
- Estado
- Observaciones

## Comisiones
Se alimenta de la capa administrativa ya creada y agrupa comisiones por vendedor.

## Actividad del equipo
Resume actividad derivada de:
- Reservas Renta Car
- Reservas Alojamientos
- Recepción de vehículos
- Movimientos de inventario

## Nota
La matriz de permisos queda visible como base funcional. En una siguiente versión se pueden endurecer reglas por rol directamente en Firestore y en la interfaz.
