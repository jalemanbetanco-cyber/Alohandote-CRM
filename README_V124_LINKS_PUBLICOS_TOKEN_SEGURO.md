# V124 - Links públicos seguros con token

## Objetivo
Mejorar seguridad de operaciones públicas sin romper el sistema interno.

## Problema anterior
El link público de operaciones usaba solo:

?operaciones=1

Eso era demasiado abierto para un sistema que maneja datos operativos.

## Nueva lógica
El botón "Copiar link logística" ahora genera un token seguro:

?operaciones=1&token=TOKEN

El token se guarda en:

publicReceptionTokens

Con:
- token
- scope: public-operations
- active
- expiresAt
- expiresAtMs
- createdBy
- snapshot de tareas permitidas
- cantidad de tareas

## Cómo funciona el link público
El link público:
1. Valida el token.
2. Muestra solo las tareas guardadas en el snapshot del token.
3. Ya no intenta listar toda la base de datos en modo público.
4. Al guardar una entrega/recepción/limpieza, crea una solicitud en:

publicOperationSubmissions

## Importante
Por seguridad, esta fase evita que el usuario público tenga acceso directo de escritura a reservas internas.

El flujo queda:
- Público envía operación.
- Sistema registra submission.
- Próxima fase puede sincronizar/validar automáticamente esas submissions contra las reservas internas.

## Seguridad Firestore
Se agregan reglas:
- publicReceptionTokens: lectura pública solo por token válido, activo y no vencido.
- publicOperationSubmissions: creación pública solo con token válido.
- lectura/edición de submissions solo admin/supervisor.

## No cambia
- Módulos internos.
- Reservas.
- Cotizaciones.
- Mantenimiento.
- Caja.
- Inventario.
- RRHH.

## Validación
1. Entrar como admin.
2. Ir a Entregas/Recepciones o Check-out.
3. Copiar link logística.
4. Abrir en ventana incógnito.
5. Confirmar que si no hay token muestra "Link no disponible".
6. Confirmar que con token muestra tareas.
7. Enviar una tarea.
8. Confirmar que se crea documento en publicOperationSubmissions.
