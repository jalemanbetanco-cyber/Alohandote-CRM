ALOHandote CRM — Hotfix V223.5.9 iCal Cost Safe

ALCANCE QUIRÚRGICO
- No modifica ERP, Caja, ROI, Inventario, RRHH, PDFs, Firebase config, Reservas manuales ni Calendario visual.
- Solo optimiza la sincronización iCal y el feed público.

REGLAS DE HORARIO (zona America/Caracas)
- Alojamientos Propios: 10:00 a 19:00 cada 45 minutos.
- Alojamientos Propios: 19:00 a 10:00 cada 3 horas.
- Alojamientos Aliados: cada 3 horas durante todo el día.

OPTIMIZACIONES
1. El temporizador del navegador despierta cada 5 minutos, pero solo sincroniza alojamientos vencidos según lastIcalSyncAt.
2. Bloqueo local evita que dos pestañas sincronicen al mismo tiempo.
3. Reconciliación incremental: no elimina y recrea todos los bloqueos iCal; solo crea, actualiza o elimina diferencias.
4. publicIcalBlocks incremental: solo escribe documentos que cambiaron y elimina los que ya no corresponden.
5. El backend consulta Firestore por accommodationId, no descarga colecciones completas.
6. Caché del feed público de 30 minutos para reducir lecturas repetidas de Airbnb/Estei.
7. Cache-Control público de 30 minutos.

IMPORTANTE
- La sincronización automática de App.jsx funciona mientras la aplicación está abierta en al menos un dispositivo/pestaña visible.
- Para sincronización 24/7 con la app cerrada se requiere un cron de servidor separado. Este hotfix no inventa ni modifica un cron no incluido en los archivos entregados.

ARCHIVOS A REEMPLAZAR
src/App.jsx
api/_icalCore.js
api/_serverSecurity.js
api/lodging-ical.ics.js
api/lodging-ical.js
api/ical/[accommodationId].ics.js
api/ical/[slug].js

VALIDACIÓN
1. npm run build
2. Probar botón manual "Sincronizar iCal guardado".
3. Revisar que lastIcalSyncAt cambie.
4. Confirmar que una segunda ejecución antes del intervalo no regenere documentos.
5. vercel --prod --force
