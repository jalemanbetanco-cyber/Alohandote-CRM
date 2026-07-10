# Alohandote V195 · Edición de reserva sin autoconflicto

Corrección puntual para Renta Car:

- Resuelve el ID real de Firestore aunque el campo interno `id` esté vacío.
- Si al editar no cambian vehículo, fechas ni horas, no ejecuta una nueva colisión contra la propia reserva.
- Al guardar usa el documento existente y evita crear una reserva nueva.
- Limpia el mensaje global de conflicto al abrir otra ficha.

No modifica iCal, cajas, alojamientos, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario, documentos ni reglas Firebase.
