# V166 · Cotizador BCV, devoluciones y acceso mobile

Base: V165 Go-Live Readiness + V164 funcional aprobada por usuario.

## Cambios aplicados

1. **Cotizador con EURO BCV oficial**
   - `/api/rates` ahora prioriza EURO BCV oficial y no falla completo si USDT/mercado no responde.
   - En desarrollo local, Vite sirve `/api/rates` mediante middleware compatible con Vercel.
   - Renta Car y Alojamientos calculan Bs con la tasa EURO BCV activa.
   - Al guardar reserva, se congela la tasa usada en `bcvEuroRate` y se guardan `totalAmountBs`, `amountBs` y `amountUsdEquivalent`.

2. **Devoluciones / anulaciones**
   - El formulario de anulación precarga el monto según el pago real guardado.
   - Si el pago fue en Bs, usa `amountBs` como monto real a devolver.
   - Si el pago fue en USD/Zelle/Binance/Efectivo $, usa el equivalente USD.
   - El botón de anulación se habilita cuando existe pago real en Bs, incluso si el campo `amount` no representa USD.

3. **Acceso mobile local**
   - `npm run dev` ahora levanta Vite en `0.0.0.0` para permitir acceso desde celular en la misma red.
   - Se agregó `npm run dev:mobile` como alias claro.
   - En celular se debe abrir el link `Network`, no `localhost`.

## Prueba mínima V166

1. Ejecutar:

```bash
npm install --legacy-peer-deps
npm run production:check
npm run release:preflight
npm run build
npm run dev
```

2. Validar Renta Car:
   - Abrir nueva reserva.
   - Ver tasa EURO BCV.
   - Colocar costo en USD.
   - Confirmar costo en Bs automático.
   - Pago en Bs debe calcular equivalente USD.

3. Validar Alojamientos:
   - Abrir nueva reserva alojamiento.
   - Ver tasa EURO BCV.
   - Confirmar costo en Bs automático.

4. Validar devolución:
   - Crear reserva pagada en Bs.
   - Guardar.
   - Abrir anulación/devolución.
   - El campo debe venir con el monto Bs pagado.
   - Guardar devolución debe descontar Bs de caja.

5. Validar mobile:
   - Ejecutar `npm run dev`.
   - Copiar el link `Network`, ejemplo `http://192.168.1.10:5173/`.
   - Abrir ese link desde el celular conectado al mismo WiFi.
