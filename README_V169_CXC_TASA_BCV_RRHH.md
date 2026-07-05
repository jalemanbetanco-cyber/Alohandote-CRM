# Alohandote V169 · CxC fuera de caja + tasa BCV integrada + RRHH USD BCV

## Cambios aplicados

1. **Cuentas por cobrar fuera de caja disponible**
   - La caja disponible ahora incluye reservas solo cuando la reserva está pagada completamente o sin diferencia a pagar.
   - Las reservas con diferencia pendiente quedan en `Cuentas por cobrar` y no alimentan caja disponible.
   - Cuando el pago se completa, salen automáticamente de CxC y pasan a caja.

2. **Eliminación del mapa duplicado de módulos**
   - Se removió el panel `V156 · Mapa completo de módulos` porque duplicaba la barra principal.

3. **Tasa EURO BCV reforzada en formularios de reserva**
   - El formulario intenta cargar `/api/rates`.
   - Si falla, usa respaldo público de Euro oficial BCV.
   - Si falla, usa `.env` o cache local.
   - Al cargarse la tasa, se inyecta automáticamente en reserva Renta Car y Alojamientos abiertas.

4. **Tasa $ BCV en RRHH**
   - RRHH usa `bcvDollar` cuando existe.
   - El recibo de pago usa la tasa USD BCV del colaborador o la tasa viva del sistema.

## Validación recomendada

```bash
npm install --legacy-peer-deps
npm run production:check
npm run release:preflight
npm run build
npm run dev
```

## Variables fallback opcionales para pruebas locales

```env
VITE_FALLBACK_EUR_BCV=120
VITE_FALLBACK_USD_BCV=110
```

En producción usar Vercel Preview con `/api/rates` activo.
