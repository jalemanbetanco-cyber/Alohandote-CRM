# V223.1.1 Hotfix Comisión Caja + PDF Contrato Mobile

Base: V223.1 Liquidación de Comisiones.

## Cambios aplicados

### 1. Comisión pagada descuenta caja real
- Las comisiones pagadas ahora entran al ledger de caja como egreso real.
- Se descuenta según método seleccionado:
  - Pago en BS / transferencia / pago móvil -> Caja Bs.
  - Zelle -> Caja Zelle.
  - USDT / Binance -> Caja Binance.
  - $ efectivo -> Caja Efectivo $.
- Las comisiones pendientes siguen en Cuentas por pagar y no descuentan caja.
- Las comisiones pagadas salen de Cuentas por pagar y se reflejan en Caja / Balance.
- Se evita doble descuento: solo se considera la comisión si está marcada como pagada y tiene método de pago.

### 2. Contrato Renta Car mobile en PDF limpio A4
- Se corrigió el motor de PDF limpio para contratos con clase `.page`.
- Se elimina el comportamiento que trataba cualquier contrato como tamaño legal 216x330.
- El contrato renta car se genera en A4 vertical con ancho estable.
- Documentos largos se parten en páginas A4 sin deformar el contenido.
- Descargar / Compartir PDF limpio usan el mismo motor.

## Validación ejecutada

```bash
npm run production:check
```

Resultado: aprobado.

## Build

No se pudo validar build en este entorno porque falta `vite/node_modules`.
En local/VS Code ejecutar:

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
vercel --prod
```

## Pruebas manuales obligatorias

1. Pagar comisión con Zelle y validar Caja Zelle disminuye.
2. Pagar comisión con BS y validar Caja Bs disminuye.
3. Pagar comisión con USDT/Binance y validar Caja Binance disminuye.
4. Pagar comisión con efectivo USD y validar Caja Efectivo $ disminuye.
5. Confirmar que comisión pagada ya no aparece como CxP pendiente.
6. Desde mobile generar contrato renta car con "Compartir PDF limpio".
7. Validar que el contrato queda proporcionado A4 y permite impresión.
