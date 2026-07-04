# V161 - Reparación real de Caja, Compra/Venta de $ y Documentos

## Correcciones aplicadas

1. Las cajas en Bs ya no muestran equivalentes USD en tarjetas principales para evitar saldos ilógicos cuando la tasa está incompleta o heredada.
2. Compra de $ usa ledger firmado:
   - USD seleccionado sube.
   - Caja Bs baja.
   - La operación se bloquea si no hay Bs suficientes.
3. Venta de $ usa ledger firmado:
   - USD seleccionado baja.
   - Caja Bs sube.
   - La operación se bloquea si no hay saldo USD suficiente en la caja seleccionada.
4. Los documentos imprimibles vuelven a escribirse directamente en la pestaña abierta por el clic del usuario. Si el navegador bloquea el popup, descarga HTML imprimible.
5. Se agregó `cashLedger` al registro de compra/venta para auditoría y futura migración ERP.

## Prueba obligatoria

- Si Caja Bs está en 0, una compra de $ debe bloquearse con mensaje de saldo insuficiente.
- Si Zelle/Efectivo/Binance está en 0, una venta de $ debe bloquearse con mensaje de saldo insuficiente.
- Si existe saldo suficiente:
  - Compra 100$ tasa 100 => USD +100, Bs -10.000.
  - Venta 100$ tasa 105 => USD -100, Bs +10.500.
- Cotización, contrato, recibo y catálogos deben abrir con contenido y botón de imprimir/guardar PDF.
