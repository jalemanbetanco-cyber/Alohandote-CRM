# Guardrails de arquitectura

## Principios
- Cambios pequeños por versión.
- No romper estructura actual.
- Congelar reglas de negocio críticas antes de refactorizar.
- Crear servicios por dominio antes de separar UI.

## Dominios del sistema
- Comercial: cotizaciones, reservas, clientes.
- Renta Car: vehículos, calendario, entregas/recepciones.
- Alojamientos: unidades, iCal, check-in/check-out, limpieza.
- Administración: caja, por cobrar, devoluciones, compra de divisas.
- Inventario: productos, movimientos, consumos.
- RRHH: personal, roles, tareas, comisiones.
- Mantenimiento: preventivo/correctivo, costos, facturas.
- Rentabilidad: ROI, km, ingreso/km.

## Regla para refactorizar
Primero crear helper/servicio.
Luego usarlo en una sola pantalla.
Después migrar más módulos.
Nunca refactorizar todo App.jsx en una sola versión.
