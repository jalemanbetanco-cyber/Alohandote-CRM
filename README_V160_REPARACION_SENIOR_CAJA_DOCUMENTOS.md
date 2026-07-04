# V160 - Reparación senior definitiva de Caja, Divisas, Devoluciones y Documentos

## Problemas atacados

1. Compra de $ no descontaba de forma confiable la caja Bs visible.
2. Venta de $ no sumaba de forma confiable la caja Bs visible.
3. La caja Bs podía mostrarse negativa por devoluciones/egresos heredados o por devoluciones mayores al monto realmente pagado.
4. Cotización, contrato, recibo y catálogos podían abrir una pestaña emergente en blanco.

## Correcciones aplicadas

### Caja y divisas
- Se reemplazó el cálculo mixto por un ledger firmado: cada movimiento entra con signo real.
- Compra de $ genera dos movimientos: ingreso a caja USD seleccionada y egreso Bs.
- Venta de $ genera dos movimientos: egreso de caja USD seleccionada e ingreso Bs.
- La caja Bs visible se protege con `safeNonNegative` para no mostrar saldos negativos operativos cuando existan datos heredados inconsistentes.
- Se conserva `rawAmountBs` para auditoría interna si se necesita revisar una diferencia histórica.

### Devoluciones
- Si la devolución es por Bs, el campo representa Bs reales. No se multiplica por tasa.
- Si la devolución es por Zelle/Efectivo/Binance, el campo representa USD.
- La devolución no puede superar el monto realmente pagado por la reserva.
- Los registros antiguos se normalizan: `refundAmountBs` manda sobre `refundAmount` cuando el método es Bs.

### Documentos y catálogos
- Se dejó de depender de `document.write` como mecanismo principal.
- Los documentos se abren mediante Blob URL HTML navegable.
- Si el navegador bloquea la pestaña, descarga un HTML imprimible como respaldo.
- Aplica a cotización, contrato, recibo, catálogo renta car y catálogo alojamientos.

## Validación obligatoria

Ejecutar:

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
npm run dev
```

## Prueba funcional manual

1. Compra 100$ tasa 100 Bs: caja USD +100 y caja Bs -10.000 desde su saldo disponible.
2. Venta 100$ tasa 105 Bs: caja USD -100 y caja Bs +10.500.
3. Anulación con devolución Bs: si escribe 10.000, descuenta 10.000 Bs, no 10.000 x tasa.
4. Intentar devolver más de lo pagado: el sistema debe bloquear.
5. Cotización, contrato, recibo y catálogos: deben abrir con contenido y permitir imprimir/guardar PDF.

## Nota de operación

Si en datos históricos hay egresos o devoluciones mayores que los ingresos registrados, la auditoría puede detectar diferencia, pero la caja Bs visible no debe mostrarse como saldo negativo operativo.
