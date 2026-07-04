# Informe Ejecutivo Final V167

## Estado
Versión candidata a prueba Go-Live Preview, basada en V166.

## Correcciones principales
- Tasa EURO BCV reforzada con lectura oficial, fallback comunitario y fallback controlado por `.env`.
- Cuentas por cobrar corregidas para pagos parciales en Bs aun cuando la tasa global no esté disponible.
- Autenticación endurecida: el sistema administrativo ya no abre automáticamente sin Firebase configurado.
- Modo demo limitado a activación explícita por variable `VITE_ENABLE_DEMO_MODE=true`.

## Validaciones ejecutadas
- `npm run production:check`: aprobado.
- `npm run release:preflight`: aprobado.

## Pendiente en ambiente del usuario
- Ejecutar `npm install --legacy-peer-deps`.
- Ejecutar `npm run build`.
- Validar login real con Firebase en Vercel Preview.
- Validar cotizador y cuentas por cobrar con reservas parciales en Bs.
