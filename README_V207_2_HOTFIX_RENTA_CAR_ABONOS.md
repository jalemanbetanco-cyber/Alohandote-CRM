# V207.2 Hotfix - Renta Car y Abonos

## Objetivo
Corregir regresiones reportadas en pruebas de usuario sin alterar módulos estables de V206/V207.

## Correcciones aplicadas

### 1. Renta Car - cotización/reserva
- Se reforzó la apertura de reservas de Renta Car para no depender de campos de alojamientos.
- Al abrir una reserva/cotización de Renta Car se limpia el modal de alojamientos para evitar cruces de estado.
- Se agregó protección cuando no hay vehículo seleccionado.
- Se robusteció `openEditReservation` para trabajar con registros incompletos sin romper la UI.

### 2. Abonos - edición y eliminación
- Se agregó gestor de historial de abonos en ambos módulos:
  - Renta Car.
  - Alojamientos.
- Cada abono puede editarse o eliminarse desde la reserva.
- Los cambios no se aplican hasta presionar `Guardar`, manteniendo control operativo.
- Al editar/eliminar abonos, se recalculan:
  - monto bruto abonado,
  - equivalente USD,
  - equivalente Bs,
  - diferencia pendiente,
  - lectura de caja derivada del historial.

### 3. Duplicación de abonos
- Si se editó el historial de abonos, el guardado no genera un nuevo abono automático.
- Se mantiene la lógica de trazabilidad `paymentHistory`.

## Archivos modificados
- `src/App.jsx`
- `package.json` versión `1.0.2072`

## Validaciones ejecutadas
```bash
npm run production:check
npm run build
```

Resultado: aprobado.

## Alcance protegido
No se modificaron reglas Firebase, iCal, PDF, inventario, RRHH, ROI, tasas BCV, documentos ni lógica de aliados fuera de la visualización/gestión de abonos.
