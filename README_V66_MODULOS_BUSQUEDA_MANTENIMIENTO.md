# V66 - Módulos Cotizaciones, Reservas y Mantenimiento

## Incluye
- Toast verde minimalista inferior para reserva/cotización creada.
- Mejora para abrir cotizaciones PDF en móvil usando ventana preparada antes del proceso async.
- Nuevos módulos superiores: Cotizaciones, Reservas y Mantenimiento.
- Motor de búsqueda por Nombre, C.I., Teléfono y rango de fechas.
- En modo admin se muestran acciones Editar y Eliminar en resultados.
- El perfil operator sigue limitado a sus propios registros.
- Dashboard inicial de mantenimiento con costos, próximos servicios por kilometraje y registros.
- Campos de km actual, próximo mantenimiento en km y km objetivo en el registro de mantenimiento de Renta Car.

## Nota técnica sobre correo automático
El envío real de correos automáticos a jalemanbetanco@gmail.com necesita backend/Cloud Functions y un proveedor como SendGrid, Mailgun o Gmail API. Esta versión deja el módulo y los datos preparados para conectar esa automatización.
