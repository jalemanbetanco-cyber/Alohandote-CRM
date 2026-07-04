# V191 · Sincronización iCal atómica multi-plataforma

Cambio puntual sobre V190:

- Corrige el botón "Sincronizar iCal guardado" para que no alterne entre Airbnb y Estei.
- Antes el primer iCal importado podía eliminar los bloqueos importados previos y, si luego otro origen cambiaba/fallaba, parecía que se desincronizaba una plataforma al sincronizar la otra.
- Ahora el flujo es atómico:
  1. Lee todos los enlaces iCal guardados.
  2. Si todos responden con BEGIN:VCALENDAR, elimina los bloqueos iCal anteriores.
  3. Inserta de nuevo el conjunto completo: Airbnb + Estei + otros.
  4. Si un enlace falla, no elimina los bloqueos anteriores.

No se modifican caja, reservas financieras, mantenimiento, tasas, RRHH, inventario, documentos, catálogos, login ni reglas Firebase.
