# V67 - Búsqueda por módulo, eliminación real, mantenimiento y recepción

## Cambios
- Corrección de eliminación real en Firestore/localStorage usando removeItem/deleteDoc.
- Filtro por módulo en Cotizaciones y Reservas: Todos, Renta Car, Alojamientos.
- Operator no ve botones de eliminar; admin sí puede editar/eliminar.
- Formulario de mantenimiento: título Registro de mantenimiento, sin banner de vendedor, KM actual, Próximo mantenimiento y KM objetivo.
- Alerta visual cuando faltan 300 km o menos para mantenimiento.
- Módulo Recepción: botón para copiar link público de recepción por vehículo.
- Módulo Recepción: lista de recepciones pendientes con pago 100%, agrupadas en Hoy y Próximas.
- El link público acepta parámetro ?vehiculo=ID para llevar directo al vehículo correspondiente.

## Nota técnica
El envío de correo automático real requiere backend/Cloud Functions. Esta versión deja los datos necesarios para conectar la notificación.
