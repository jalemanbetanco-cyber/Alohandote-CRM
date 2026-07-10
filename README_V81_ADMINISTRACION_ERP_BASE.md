# V81 - Administración ERP Base

## Objetivo
Agregar una primera capa administrativa ERP sobre el sistema anterior sin romper las funcionalidades existentes.

## Nuevo módulo
Se agrega el módulo **Administración** para perfil admin.

## Incluye
- Dashboard administrativo.
- Caja general derivada de reservas, abonos, mantenimientos, devoluciones y comisiones.
- Cuentas por cobrar: reservas con saldo pendiente.
- Cuentas por pagar: mantenimientos, devoluciones y comisiones estimadas.
- Devoluciones: toma reservas anuladas con devolución.
- Comisiones: calcula base 15% sobre reservas con pagos registrados.
- Exportar administración a Excel con hojas:
  - Caja
  - Cuentas por cobrar
  - Cuentas por pagar
  - Devoluciones
  - Comisiones

## Importante
Esta V81 no cambia el flujo existente de Renta Car, Alojamientos, Recepción, Mantenimiento, ROI, Cotizaciones o Reservas.
La capa administrativa se alimenta de los datos ya existentes.

## Siguiente fase sugerida
V82 Inventario ERP Base:
- Inventario general
- Movimientos de inventario
- Stock mínimo
- Consumo por mantenimiento
- Consumo por limpieza
- Egreso automático por compras
