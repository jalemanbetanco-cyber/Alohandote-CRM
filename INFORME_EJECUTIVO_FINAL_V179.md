# Informe Ejecutivo Final V179

## Alcance
Versión correctiva enfocada en los 3 hallazgos reportados después de V178:
1. Guardado de fotos detenido en “Guardando fotos…”.
2. Confirmación de reglas de calendario: alojamientos por noche y renta car por día.
3. Eliminación de ventana emergente previa para documentos PDF.

## Cambios realizados
- Se simplificó el flujo de fotos de catálogo para guardar imágenes optimizadas embebidas, evitando bloqueo por Firebase Storage.
- Se mantuvo la regla de alojamiento por noche y renta car por día.
- Se actualizó el mecanismo de documentos imprimibles para abrir en la misma pestaña.

## No modificado
No se tocaron cajas, compra/venta de divisas, tasas, reservas financieras, RRHH, inventario ni reglas contables validadas.

## Recomendación
V179 debe probarse primero en local y luego desplegarse en Vercel. Si las fotos y documentos pasan, queda como candidata de Go-Live.
