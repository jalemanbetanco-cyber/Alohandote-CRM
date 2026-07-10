# Alohandote CRM V223.5.5 Hotfix iCal Schedule + Cleaning Persistence

Cambios incluidos:
1. Sincronización iCal automática con menor consumo:
   - Alojamientos propios: 10:00–19:00 cada 45 minutos.
   - Alojamientos propios: 19:00–10:00 cada 3 horas.
   - Alojamientos aliados: siempre cada 3 horas.
   - El temporizador revisa cada 15 minutos, pero solo sincroniza alojamientos vencidos según `lastIcalSyncAt`.

2. Persistencia de limpiezas realizadas:
   - Se agrega colección/almacén `completedCleaningTasks`.
   - Al marcar limpieza/check-out como realizado, se guarda una marca estable.
   - Si la reserva iCal se elimina y se vuelve a recrear durante la sincronización, la marca se reaplica.
   - Las tareas ya realizadas no deberían regenerarse en logística después de nuevas sincronizaciones iCal.

Archivo reemplazado:
- src/App.jsx

No modifica ERP, Caja, ROI, PDFs ni reglas financieras.
