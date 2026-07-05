# V137 - Caja inventario y venta de divisas

## Cambios incluidos

### Inventario
- Agregado tipo de pago: Bs, Zelle, Usdt, $Efectivo.
- Agregada tasa $ BCV.
- Agregado monto Bs calculado cuando el pago es Bs.
- Compra de material entra como egreso en Administración ERP.
- La caja afectada depende del tipo de pago.

### Administración ERP
- Agregado botón Venta de $ al lado de Compra de $.
- Usa mismo formulario base.
- Cambia título a Venta de $.
- Cambia tasa a Tasa de venta.
- Monto Bs = cantidad USD x tasa de venta.
- Incrementa caja Bs.
- Disminuye caja de divisa seleccionada.

## Seguridad
No altera reservas, iCal, mantenimiento, RRHH ni operaciones públicas.
