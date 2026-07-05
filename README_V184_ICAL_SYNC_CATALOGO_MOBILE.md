# V184 · iCal sync + Catálogo mobile 1 página

## Alcance puntual

Versión correctiva basada en V183. No toca caja, reservas financieras, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario, login ni documentos comerciales.

## Corrección iCal

Antes el endpoint iCal podía responder válido pero con 0 eventos porque Airbnb/Booking leen una URL pública y la colección pública mínima `publicIcalBlocks` podía no estar alimentada con reservas existentes.

Ahora, antes de copiar o probar el link iCal, el sistema sincroniza los bloqueos del alojamiento seleccionado hacia `publicIcalBlocks` sin datos personales.

Datos exportados:
- accommodationId
- startDate
- endDate
- status
- updatedAt

No se exporta nombre, teléfono, cédula, monto ni información sensible del huésped.

## Corrección catálogo mobile

Se ajustó únicamente el CSS de impresión de los catálogos para móvil/iPhone:
- menor encabezado,
- fotos centradas con ancho controlado,
- chips más compactos,
- reducción de altos y espacios en impresión.

Objetivo: evitar que el catálogo se divida en 2 páginas cuando se guarda PDF desde celular.

## Prueba requerida

1. Entrar como admin.
2. Seleccionar alojamiento con reservas futuras.
3. Presionar Probar link iCal.
4. Confirmar que el contador de eventos sea mayor a 0 si hay bloqueos/reservas.
5. Copiar link iCal y pegarlo en Airbnb.
6. Generar catálogo desde iPhone/mobile.
7. Guardar PDF y validar que se vea proporcionado en una sola hoja.
