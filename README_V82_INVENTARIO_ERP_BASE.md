# V82 - Inventario ERP Base

## Objetivo
Agregar una capa de inventario ERP sobre el sistema anterior sin romper los módulos existentes.

## Nuevo módulo
Se agrega **Inventario ERP** para perfil admin.

## Incluye
- Inventario Renta Car.
- Inventario Alojamientos.
- Stock mínimo.
- Movimientos de inventario.
- Consumo por mantenimiento.
- Consumo por limpieza.
- Entradas de inventario por compra o reposición.
- Exportación Excel con hojas:
  - Inventario
  - Movimientos
  - Stock mínimo

## Funcionamiento
### Artículos
Cada artículo contiene:
- Nombre
- Categoría
- Módulo: Renta Car o Alojamientos
- Activo relacionado: vehículo o alojamiento
- Cantidad actual
- Cantidad mínima
- Costo unitario
- Proveedor
- Ubicación
- Observaciones

### Movimientos
Puedes registrar:
- Entrada
- Salida
- Compra
- Mantenimiento
- Limpieza
- Reposición
- Ajuste
- Daño / pérdida

Cuando registras una salida, el sistema descuenta stock.
Cuando registras una entrada, el sistema suma stock.

## No cambia
Esta V82 no modifica Renta Car, Alojamientos, Reservas, Cotizaciones, Recepción, Mantenimiento, ROI, iCal múltiple ni Administración ERP.
