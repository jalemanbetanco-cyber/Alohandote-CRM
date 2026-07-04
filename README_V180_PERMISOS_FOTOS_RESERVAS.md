# V180 · Permisos, fotos y reservas

Correcciones aplicadas sin tocar caja, tasas, compra/venta de dólares ni mantenimiento financiero.

## Ajustes

1. Fotos de catálogo
   - Se eliminó la dependencia crítica de Firebase Storage para guardar fotos.
   - Las fotos se preparan como imágenes embebidas y comprimidas para catálogo.
   - Se agregó timeout para evitar que el formulario quede pegado en “Guardando fotos...”.

2. Reservas
   - Se corrigen reglas Firestore para que usuarios autenticados y activos puedan crear/actualizar reservas de Renta Car y Alojamientos.
   - Esto corrige errores `permission-denied` al guardar.

3. Seguridad
   - Se eliminan reglas abiertas por fecha.
   - Solo usuarios autenticados pueden leer/escribir datos.
   - Solo admin puede eliminar.

## No se tocó

- Caja.
- Compra de dólares.
- Venta de dólares.
- Reglas de cuentas por cobrar.
- Mantenimiento por pagar/pagado.
- Tasas BCV.
- Documentos sin ventana emergente.
