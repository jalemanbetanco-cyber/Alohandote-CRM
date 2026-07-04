# V92 - Submódulos en sidebar + refuerzo iCal

## Cambios UX
- Los botones de submódulos de Renta Car ahora se muestran arriba en la barra lateral, ocupando el lugar donde estaba la ficha del usuario:
  - Calendario Renta Car
  - Entregas
  - Recepciones

- Los botones de submódulos de Alojamientos también se muestran arriba en la barra lateral:
  - Calendario Alojamientos
  - Check-in
  - Check-out

- La ficha de usuario se movió a la parte inferior, cerca del botón Salir del sistema.

## iCal
- Se refuerza el guardado de las reservas iCal con:
  - accommodationName
  - propertyName
  - assetName

- Se mejora la búsqueda por URL iCal normalizando la URL para evitar fallos por slash final.
- Se mantiene el botón Reparar nombres iCal en Alojamientos para intentar corregir registros antiguos.

## Nota
Si existen bloqueos iCal muy antiguos que no guardaron accommodationId ni URL iCal, el sistema no puede identificar el alojamiento con certeza. En ese caso, elimina bloqueos iCal y vuelve a sincronizar desde cada alojamiento.
