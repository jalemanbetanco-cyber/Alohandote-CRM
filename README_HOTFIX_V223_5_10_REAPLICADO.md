# Alohandote CRM V223.5.10 — Hotfix quirúrgico reaplicado

Base: proyecto estable entregado por el propietario.

## Alcance

1. Botón **Contrato PDF** visible directamente en la lista móvil de tareas de entrega/recepción de vehículos.
2. Se conserva el generador de contrato estabilizado: una hoja A4, captura móvil en ancho fijo de 794 px, recorte de borde blanco y márgenes PDF mínimos.
3. Scheduler iCal validado para `America/Caracas`:
   - alojamientos propios activos: 09:00–18:00 cada 60 minutos; fuera de esa ventana cada 180 minutos;
   - alojamientos aliados activos: cada 180 minutos;
   - alojamientos inactivos quedan excluidos.
4. La reconciliación iCal preserva los campos de check-in, check-out y limpieza completados al reconstruir un bloqueo externo, evitando que las tareas realizadas vuelvan a generarse.

## Guardrails

No se modificaron Caja, ERP, ROI, RRHH, inventario, documentos distintos al contrato, reglas Firebase ni flujo manual de sincronización iCal.
