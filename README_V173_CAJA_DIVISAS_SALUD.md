# V173 · Caja divisas + monitor de salud

## Correcciones

1. Compra de $:
   - Requiere saldo suficiente en Caja Bs.
   - Descuenta Bs de Caja Bs.
   - Suma USD a la caja seleccionada: Efectivo $, Zelle o Binance.

2. Venta de $:
   - Requiere saldo suficiente en la caja USD seleccionada.
   - Descuenta USD de esa caja.
   - Suma Bs a Caja Bs.

3. Monitor de salud:
   - En modo demo local ya no muestra `Firebase no disponible` como error operativo.
   - En producción o preview sin Firebase configurado mantiene la advertencia de seguridad.

4. Datos limpios:
   - LOCAL_STORAGE_VERSION = v173 para evitar arrastrar pruebas de versiones anteriores.
