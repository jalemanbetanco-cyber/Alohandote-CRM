# Informe Ejecutivo V174

Estado: candidata a prueba final QA.

Esta versión corrige el flujo contable de compra/venta de divisas sin modificar tasas, reservas, catálogos, RRHH ni formularios validados.

## Validación esperada

- Crear ingreso en Bs.
- Comprar 50$ por Zelle: debe subir Zelle +50$ y bajar Caja disponible Bs.
- Comprar 50$ por Efectivo: debe subir Efectivo +50$ y bajar Caja disponible Bs, si hay saldo Bs suficiente.
- Vender desde Zelle/Efectivo/Binance: debe bajar USD y subir Caja disponible Bs.
- No debe aparecer tarjeta Bs duplicada junto a Binance.
