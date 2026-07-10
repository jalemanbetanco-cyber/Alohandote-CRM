# V179 · Fotos, calendario y documentos sin popup

Cambios aplicados sin tocar caja, reservas, compra/venta de divisas, tasas, RRHH, inventario ni mantenimiento financiero.

## 1. Fotos de catálogos
- Alojamientos y vehículos ya no dependen de Firebase Storage para guardar fotos de catálogo.
- Cada foto se convierte a imagen optimizada embebida para catálogo.
- Evita que el sistema quede congelado en “Guardando fotos…” si Storage tarda o rechaza permisos.
- Mantiene JPG, PNG, WEBP, HEIC/HEIF y máximo 9 fotos.

## 2. Calendario por regla de negocio
- Alojamientos mantienen lógica por noche: fecha de salida no se bloquea como noche ocupada.
- Renta Car mantiene lógica por día de servicio.
- Mantenimiento menor o igual a 1 día sigue sin bloquear calendario.

## 3. Documentos sin ventana emergente
- Cotizaciones, recibos y contratos ya no abren una ventana emergente previa.
- El documento imprimible se carga en la misma pestaña mediante Blob URL.
- Conserva botones para imprimir/guardar PDF y volver.

## Validación recomendada
1. Editar alojamiento, cargar 2 fotos y guardar.
2. Generar catálogo alojamiento y confirmar fotos.
3. Editar vehículo, cargar 2 fotos y guardar.
4. Generar catálogo renta car y confirmar fotos.
5. Generar cotización, recibo y contrato: no debe abrir popup.
6. Validar alojamiento por noche.
7. Validar renta car por día.
