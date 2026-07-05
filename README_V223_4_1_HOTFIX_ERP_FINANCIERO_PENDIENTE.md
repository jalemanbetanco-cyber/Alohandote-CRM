# V223.4.1 — Hotfix ERP Financiero Pendiente

Cambios aplicados de forma quirúrgica sobre V223.4:

1. Dashboard de activos
- ROI por vehículo muestra Gastos asociados como botón consultable.
- Nuevo ROI por alojamiento con Gastos asociados consultables.
- Modal de detalle con fecha, categoría, concepto, método, monto y comprobante.

2. Administración ERP / Registrar movimiento
- Reemplazo de textos Registrar gasto por Registrar movimiento.
- Formulario conserva estructura y permite Ingreso/Egreso.
- Ingreso suma caja; Egreso pagado descuenta caja; Por pagar queda pendiente.
- Se agregó carga de comprobante/factura al movimiento operativo.

3. CxP aliados
- Se conserva campo editable Ganancia neta Alohandote.
- Monto a pagar aliado = Total reserva - Ganancia neta Alohandote.
- Al marcar pagado, descuenta solo monto del aliado según método.
- Compatible con Bs, Zelle, USDT/Binance y efectivo.

Validación local:
- npm run production:check OK
- npm run build OK

No se modificó:
- iCal
- PDFs
- abonos
- roles
- reservas base
- dashboards exportables
