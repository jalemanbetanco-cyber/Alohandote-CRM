# Regresión manual V132

## Objetivo
Confirmar que los módulos críticos siguen operando antes de liberar.

## Casos mínimos
| ID | Flujo | Resultado esperado |
|---|---|---|
| QA-001 | Login admin | Ingresa y ve todos los módulos |
| QA-002 | Login operador | Ve solo módulos permitidos |
| QA-003 | Crear reserva Renta Car | Reserva aparece en calendario |
| QA-004 | Editar reserva | Cambios se guardan |
| QA-005 | Entrega vehículo | Guarda km salida |
| QA-006 | Recepción vehículo | Marca devuelto y calcula km |
| QA-007 | Crear alojamiento | Aparece en calendario alojamiento |
| QA-008 | iCal/Airbnb | No aparece como mantenimiento |
| QA-009 | Limpieza | Marca check-out/limpieza |
| QA-010 | Mantenimiento | Aparece en listado mantenimiento |
| QA-011 | Caja | Movimientos derivados visibles |
| QA-012 | Inventario | Movimiento actualiza stock |
| QA-013 | Backup | Descarga JSON/Excel |
| QA-014 | Auditoría | Registra acción crítica |
| QA-015 | Salud | Sin críticos después de prueba |
| QA-016 | Link público | Requiere token |
| QA-017 | Submission pública | Se sincroniza desde admin |

## Criterio
Sin errores críticos ni bloqueantes.
