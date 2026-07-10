# V178 · Fotos de catálogos + reglas Firebase

## Objetivo
Corregir los únicos bloqueantes restantes del checklist Go-Live:

1. Carga de fotos para catálogo de alojamientos y renta car.
2. Visualización de fotos en catálogo renta car.
3. Reglas Firebase abiertas en consola.

## Cambios aplicados

### Fotos Renta Car
- La subida de fotos ahora usa `vehicle-photos/{uid}/...`.
- Si Firebase Storage rechaza temporalmente la subida, el sistema guarda una versión comprimida embebida en el documento para que el catálogo no quede sin fotos.
- Se agregó conversión HEIC → JPEG cuando el navegador lo permite.
- Se eliminó el uso de `URL.createObjectURL` para fotos de catálogo, porque no sobrevive al generar catálogos en otra pestaña o después de recargar.

### Fotos Alojamientos
- Se mantiene el fallback embebido que ya existía.
- Se agregó soporte explícito en reglas Storage para `accommodation-photos/{uid}/...`.

### Seguridad Firebase
- `storage.rules` ahora permite imágenes autenticadas en:
  - `vehicle-photos/{uid}/...`
  - `accommodation-photos/{uid}/...`
- `firestore.rules` del proyecto ya incluye reglas por usuario autenticado, admin, operador, supervisor y auditoría. Deben publicarse en Firebase antes de producción.

## No se tocó
- Caja.
- Reservas.
- Compra / venta de divisas.
- Mantenimiento.
- Tasas.
- Login.
- RRHH.
- Inventario.
- Documentos PDF.

## Prueba puntual
1. Entrar como admin.
2. Editar un vehículo.
3. Cargar 2 fotos JPG o PNG.
4. Guardar.
5. Generar catálogo renta car.
6. Confirmar que las fotos se visualizan.
7. Editar un alojamiento.
8. Cargar 2 fotos.
9. Guardar.
10. Generar catálogo alojamiento.
11. Confirmar que las fotos se visualizan.
