# V108 - Inventario con factura + abonos por método

## 1. Inventario / creación de producto
Se agregan campos al formulario de artículo/producto:
- Fecha de compra
- Factura del producto

La factura puede cargarse como:
- PDF
- JPG
- PNG
- WEBP

Al guardar el artículo, la factura queda almacenada en el registro del inventario como `invoiceFile`.

## 2. Cotizador Renta Car
Se agrega junto al monto abonado:
- Método del abono: $ Efectivo / Zelle / Usdt / Pago en BS
- Abono equivalente en Bs
- Diferencia a pagar en USD / Bs

La diferencia se calcula con:
- Pendiente USD = Total USD - Abonado USD
- Pendiente Bs = Pendiente USD x Tasa EURO

## 3. Cotizador Alojamientos
Se agrega la misma lógica:
- Método del abono
- Abono equivalente en Bs
- Diferencia a pagar en USD / Bs

## 4. Comprobantes
Se refuerza que los comprobantes muestren pendiente en:
- USD
- Bs
- Tasa EURO

## Nota
El sistema sigue usando el monto en USD como base operativa. Si el pago fue en Bs, se registra el método "Pago en BS" y el sistema calcula el equivalente usando la Tasa EURO activa.
