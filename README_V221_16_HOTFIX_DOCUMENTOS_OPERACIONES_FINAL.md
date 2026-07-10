# V221.16 Hotfix Documentos + Operaciones Final

Corrección quirúrgica sobre V221.15.

## Causa raíz corregida

1. Los documentos seguían mostrando una barra interna dentro del iframe, por lo que en mobile el usuario podía ejecutar acciones desde el contexto incorrecto del iframe.
2. El PDF no siempre estaba precargado antes de compartir; en iOS/WhatsApp eso rompe el Web Share API o genera un archivo desproporcionado.
3. El botón imprimir podía caer a `window.print()` del HTML, generando pies/marcas del navegador.
4. La validación de links públicos dependía de reglas demasiado estrictas para tokens históricos.

## Cambios

- Oculta acciones internas del documento cuando está dentro de la vista previa embebida.
- El usuario usa únicamente la barra superior controlada por la app principal.
- El botón Compartir queda deshabilitado hasta que el PDF limpio esté precargado.
- Compartir, descargar e imprimir usan exactamente el mismo Blob PDF limpio.
- Imprimir ya no cae a impresión HTML si el PDF aún no está listo.
- Reglas Firestore de `publicReceptionTokens` permiten lectura pública controlada de tokens activos.

## No tocado

Caja, reservas, abonos, iCal, aliados, inventario, RRHH, ROI ni lógica financiera.

## Validación

`npm run production:check`
