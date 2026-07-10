# V222.1 Hotfix Operativo-Financiero

Base: V222 — Sincronización Operativa + Rol Logística.

## Alcance aplicado

1. Rol Logística
- Las actividades operativas de logística ahora filtran activos propios.
- Vehículos y alojamientos marcados como `Aliado` no se muestran en check-out/limpieza, entregas ni recepciones para el rol Logística ni para operaciones públicas.

2. Reservas creadas por vendedores
- Las reservas creadas por roles vendedor / vendedor alojamientos / vendedor renta car y alojamientos se consideran comisionables para el panel admin.
- Las comisiones usan la tasa del colaborador en RRHH si existe; si no existe, mantiene 15% como fallback.
- Los abonos siguen alimentando la caja por método real según el historial de pagos.
- Las cuentas por cobrar siguen derivándose del saldo pendiente real de la reserva.

3. Eliminación definitiva de reserva
- Al eliminar una reserva se ejecuta limpieza de registros vinculados:
  - cuenta por pagar automática de aliado / propietario,
  - lead relacionado,
  - operaciones/checkins vinculados,
  - submissions públicas vinculadas,
  - bloque iCal público en alojamientos.
- La eliminación queda auditada con resumen de limpieza.

4. Mantenimientos múltiples por fecha
- Renta car: los mantenimientos no bloquean por conflicto de fecha contra otros mantenimientos.
- Alojamientos: los mantenimientos permiten múltiples registros en la misma fecha.
- Las reservas reales mantienen sus validaciones de conflicto sin alteración.

## Módulos preservados

No se modifica el flujo documental, iCal externo, PDFs, ROI, RRHH base, inventario ni caja estable. Los cambios afectan únicamente filtros operativos, derivación comisionable, cleanup de eliminación y validación de mantenimiento.

## Validación técnica ejecutada

```bash
npm run production:check
npm run build
```

Resultado: OK. `npm run build` finalizó con advertencias no bloqueantes ya existentes de tamaño de bundle y glob en api/rates.
