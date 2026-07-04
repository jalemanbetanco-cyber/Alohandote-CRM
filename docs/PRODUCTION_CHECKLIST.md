# V132 - Checklist de producción Alohandote V2

## Estado de salida recomendado
El sistema no debe operar formalmente en producción si alguno de estos puntos falla.

## Checklist técnico obligatorio

| Área | Validación | Comando / evidencia |
|---|---|---|
| Calidad | Smoke test aprobado | `npm run quality:smoke` |
| Calidad | Pruebas de negocio aprobadas | `npm run test:business` |
| Calidad | Build productivo aprobado | `npm run build` |
| Seguridad | Reglas Firebase desplegadas | `firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar` |
| Seguridad | Roles reales probados | Admin, supervisor, operador, limpieza, mantenimiento, contabilidad |
| Continuidad | Backup descargado | JSON y Excel desde Administración ERP |
| Observabilidad | Monitor sin críticos | Administración ERP > Monitor de salud |
| QA manual | Regresión manual completada | Flujos críticos abajo |
| UX | Prueba mobile real | iPhone/Android |
| Operación | Plan de reversa disponible | ZIP/commit anterior y backup |

## Flujos críticos de regresión manual
1. Login admin, supervisor y operador.
2. Crear reserva Renta Car.
3. Editar reserva Renta Car.
4. Entregar vehículo.
5. Recibir vehículo.
6. Crear reserva de alojamiento.
7. Validar bloqueo iCal/Airbnb.
8. Marcar limpieza/check-out.
9. Registrar mantenimiento.
10. Validar caja y cuentas por cobrar.
11. Crear movimiento de inventario.
12. Generar backup técnico.
13. Revisar auditoría.
14. Revisar monitor de salud.
15. Generar link público seguro.
16. Sincronizar operación pública.

## Criterio GO / NO-GO
- GO: todos los puntos obligatorios aprobados.
- PENDING: hay puntos sin validar.
- NO-GO: al menos un punto obligatorio falló.

## Recomendación
Operar primero con producción controlada: pocos usuarios, monitoreo diario y backup semanal.
