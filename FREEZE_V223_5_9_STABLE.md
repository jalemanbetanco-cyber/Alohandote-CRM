# Alohandote CRM — Freeze V223.5.9 Stable

Fecha de congelación: 2026-07-10

## Estado validado
- Build de producción ejecutado correctamente con `npm run build`.
- Base recibida como proyecto completo desde VS Code.
- No se incluyen `node_modules`, `dist`, `.vercel` ni archivos de entorno con secretos.

## Alcance congelado
- Renta Car
- Alojamientos
- ERP / Caja / ROI
- Inventario y RRHH
- Reservas
- Firebase / Firestore
- Documentos PDF
- iCal actual

## Regla de cambio
Toda mejora futura debe salir de una rama nueva. Esta versión no debe modificarse directamente.

## Próximo desarrollo planificado
Migración quirúrgica de la sincronización automática iCal desde el frontend hacia un único proceso de servidor, con modo diagnóstico, apagado por variable y rollback.
