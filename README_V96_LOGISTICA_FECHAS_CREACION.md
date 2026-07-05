# V96 - Planificación logística y fecha de creación estable

## Correcciones

### 1. Próximas entregas / check-in
El módulo de logística ya no exige que una reserva esté pagada al 100% para aparecer en:
- Renta Car > Entregas
- Renta Car > Recepciones
- Alojamientos > Check-in
- Alojamientos > Check-out

Ahora toma todas las reservas reales con estado `reserved`.

Esto corrige el caso donde una reserva creada para mañana no aparecía en "Próximas entregas — próximo día".

## Regla operativa
- Fecha inicio = entrega / check-in.
- Fecha final = recepción / check-out.
- Ventana futura = próximo día.

### 2. Cotizaciones y reservas conservan fecha de creación
Se refuerza que al editar una reserva no se cambie su fecha original.

Campos usados:
- createdAt
- creationDate
- updatedAt

Regla:
- createdAt / creationDate se mantienen.
- updatedAt se actualiza en cada modificación.

### 3. LocalStorage también preserva fecha
Se ajusta editItem en modo local para no sobrescribir `createdAt` ni `creationDate`.

## No se modifica
- Comercial
- Administración ERP
- Inventario ERP
- RRHH ERP
- Mantenimiento
- Rentabilidad KM / ROI
- iCal
- Vinculación manual iCal
