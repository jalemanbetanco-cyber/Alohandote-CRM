# Informe Ejecutivo Final V166

## Estado
Versión correctiva orientada a cerrar los hallazgos detectados durante la validación Go-Live V165.

## Hallazgos corregidos

1. **Cotizador sin tasa EURO BCV funcional en local**
   - Se habilitó `/api/rates` también en desarrollo local mediante middleware Vite.
   - El endpoint mantiene la tasa EURO BCV como dato principal y no falla por falta de USDT/mercado.

2. **Cálculo Bs incompleto en Renta Car y Alojamientos**
   - Los formularios usan la tasa EURO BCV activa para calcular Bs automáticamente.
   - Al guardar se congela la tasa usada para trazabilidad y consistencia de caja.

3. **Devolución/anulación sin monto precargado**
   - El formulario ahora toma `amountBs`, `amountUsdEquivalent` o el cálculo por método de pago.
   - El botón de devolución se habilita por pago real en Bs, no solo por monto USD.

4. **Acceso mobile local**
   - Se configuró Vite con `host: 0.0.0.0`.
   - Se agregó comando `npm run dev:mobile`.

## Validaciones ejecutadas

- `npm run production:check`: aprobado.
- `npm run release:preflight`: aprobado.

## Pendiente antes de GO-LIVE

- Ejecutar `npm run build` en el equipo local o Vercel después de `npm install`.
- Probar Vercel Preview desde PC y celular.
- Confirmar Firebase real, login admin/operador y reglas desplegadas.

## Recomendación

V166 queda como candidata a Preview Go-Live. No promover a producción hasta validar los 3 escenarios corregidos en local y Vercel Preview.
