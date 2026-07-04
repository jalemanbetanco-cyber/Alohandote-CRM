# Alohandote V194 · Edición de reservas y error aislado

Corrección puntual:

- Conserva el ID real de Firestore en `__docId` aunque un documento antiguo tenga un campo `id` vacío o incorrecto.
- Al editar una reserva de Renta Car o Alojamiento, la validación ignora correctamente el mismo documento.
- El mensaje de conflicto se limpia al abrir otra reserva o crear una nueva, evitando que aparezca en formularios no relacionados.
- No modifica caja, pagos, iCal, mantenimiento, documentos, tasas ni reglas Firebase.
