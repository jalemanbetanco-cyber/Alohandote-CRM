# V207.3 Hotfix - Renta Car Calendario

## Objetivo
Corregir de forma quirúrgica el crash del módulo Renta Car al seleccionar cualquier fecha del calendario.

## Causa raíz
En el modal de Renta Car se había filtrado accidentalmente un bloque visual exclusivo de alojamientos aliados. Ese bloque intentaba leer `editingLodging.accommodationId` cuando `editingLodging` era `null`, porque el flujo activo era Renta Car. Por eso el sistema caía con:

`Cannot read properties of null (reading 'accommodationId')`

## Corrección aplicada
- Se eliminó del modal Renta Car el bloque de "Ingreso alojamiento aliado".
- No se modificó el flujo de alojamientos aliados.
- No se modificaron cálculos de caja, iCal, Firebase, PDF, inventario, RRHH ni ROI.
- Se mantiene la lógica de edición/eliminación de abonos incorporada en V207.2.

## Pruebas obligatorias
1. Entrar al módulo Renta Car.
2. Seleccionar cualquier día vacío del calendario.
3. Debe abrir el formulario de reserva/cotización sin error visual.
4. Generar cotización Renta Car.
5. Guardar reserva Renta Car.
6. Crear, editar y eliminar abonos en Renta Car.
7. Validar que alojamientos aliados siguen funcionando.
8. Validar caja y PDF.

## Versión
`1.0.2073`
