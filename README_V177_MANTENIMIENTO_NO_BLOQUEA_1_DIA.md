# V177 · Mantenimiento menor o igual a 1 día no bloquea calendario

## Objetivo
Aplicar únicamente la regla solicitada sobre el módulo de mantenimiento, sin modificar caja, reservas, tasas, compra/venta de divisas, documentos, catálogos ni demás módulos ya validados.

## Regla aplicada
- Si un mantenimiento dura **menor o igual a 1 día**, se guarda como registro operativo, pero **no bloquea el calendario**.
- Si un mantenimiento dura **más de 1 día**, mantiene el comportamiento anterior y **sí bloquea el calendario**.

## Alcance
Aplica en:
- Calendario de Renta Car.
- Calendario de Alojamientos.
- Validación de conflictos al crear reservas futuras.
- iCal de alojamientos: los mantenimientos de 1 día no se exportan como bloqueo.

## Sin cambios en
- Caja disponible.
- Cuentas por cobrar.
- Cuentas por pagar.
- Compra de $.
- Venta de $.
- Tasas BCV.
- RRHH.
- Inventario.
- Documentos y catálogos.
