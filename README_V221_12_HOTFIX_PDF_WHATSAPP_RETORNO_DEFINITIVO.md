# V221.12 Hotfix PDF WhatsApp + Retorno Definitivo

## Problema observado en video
- En mobile, al usar **Compartir PDF limpio** dentro de la vista previa, iOS/WhatsApp tomaba el control del WebView desde el iframe.
- Al regresar, la app quedaba en estado inconsistente: aparecía carga/validación y volvía al listado, no al formulario.
- El flujo anterior ejecutaba la acción de compartir dentro del iframe y además intentaba cerrar/retornar desde el propio documento, lo que podía romper el estado React subyacente.

## Corrección quirúrgica
- El PDF se sigue generando dentro de la vista previa, pero la acción de compartir ahora se delega a la ventana principal de Alohandote mediante `postMessage` seguro.
- La ventana principal ejecuta `navigator.share` con el archivo PDF.
- Al finalizar el share/download, solo se cierra el overlay de documento; no se navega, no se recarga, no se usa history.back y no se pierde el formulario.

## Alcance preservado
No se modificó lógica de caja, reservas, abonos, iCal, Renta Car, alojamientos, aliados, inventario, RRHH ni ROI.

## Validación
- `npm run production:check`
