# V116 - Reparación listado de mantenimientos

## Problema
El mantenimiento sí bloqueaba el calendario, pero podía no aparecer claramente en el listado de Mantenimiento.

## Causa probable
El listado dependía únicamente de:
- status === maintenance

Si por algún flujo el registro quedaba con campos de mantenimiento pero el estado no estaba normalizado exactamente, el calendario se bloqueaba pero el dashboard podía no listarlo.

Además, el listado estaba ordenado por fecha de inicio ascendente, por eso un registro nuevo podía quedar en medio o abajo de la tabla.

## Corrección
1. Al guardar mantenimiento, el sistema fuerza:
   status = maintenance

2. El dashboard ahora reconoce mantenimiento si el registro tiene:
   - status maintenance
   - maintenanceType
   - maintenanceCost
   - maintenanceLaborCost
   - maintenancePartsCost
   - maintenancePaymentMethod
   - maintenanceInvoices

3. Los registros nuevos aparecen primero, usando:
   - createdAt
   - updatedAt
   - startDate

4. El costo del listado toma:
   - maintenanceCost
   - o suma de mano de obra + repuestos

## Resultado esperado
Al registrar mantenimiento:
- Se bloquea calendario
- Se guarda registro
- Aparece arriba en el módulo Mantenimiento
- Se mantiene visible aunque haya sido creado desde calendario
