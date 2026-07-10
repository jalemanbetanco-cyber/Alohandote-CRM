# Alohandote V155 - Production Hardening

## Objetivo
Esta versión endurece la base V154 sin romper la lógica actual del negocio. Mantiene reservas, calendario, caja, inventario, ERP, anulación/devolución, iCal y operaciones públicas, pero agrega controles de seguridad, gate técnico y documentación de despliegue.

## Cambios aplicados

### Seguridad
- `api/ics-proxy.js` ahora valida URL con `new URL()` y bloquea hosts privados/locales para mitigar SSRF.
- Se agregó allowlist configurable con `ICAL_PROXY_ALLOWED_HOSTS`.
- Los endpoints iCal dejaron de exponer nombres de clientes: el `SUMMARY` público ahora muestra solo `No disponible` o `Mantenimiento`.
- Se agregó soporte para acceso server-side seguro a Firestore mediante `FIREBASE_SERVICE_ACCOUNT_BASE64`.
- Se agregaron headers de seguridad en `vercel.json` y en respuestas API.

### DevOps / CI-CD
- Se agregó `scripts/security-static-check.mjs`.
- Se actualizó `production-gate.mjs` para validar hardening V155.
- Se agregó workflow `.github/workflows/production-quality.yml`.
- Se actualizó `package.json` a versión `1.0.155`.

### Calidad
- Se mantuvieron intactas las pruebas de negocio existentes.
- Se agregó gate específico para SSRF, PII en iCal, headers y backend seguro.
- Se mantiene compatibilidad con el flujo actual mediante fallback legacy configurable.

### Arquitectura
- Se extrajo lógica compartida de iCal a `api/_icalCore.js`.
- Se extrajo seguridad server-side a `api/_serverSecurity.js`.
- Los tres endpoints iCal reutilizan una sola función segura.

## Variables de entorno recomendadas para producción

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_del_json_service_account
LEGACY_FIRESTORE_REST_FALLBACK=false
ICAL_PROXY_ALLOWED_HOSTS=airbnb.com,booking.com,calendar.google.com,vrbo.com
```

> Para no romper el sistema actual, el fallback legacy existe. Para go-live formal se recomienda configurar `FIREBASE_SERVICE_ACCOUNT_BASE64` y `LEGACY_FIRESTORE_REST_FALLBACK=false`.

## Comandos de validación

```bash
npm install --legacy-peer-deps
npm run quality:smoke
npm run test:business
npm run security:static
npm run production:gate
npm run build
```

## Criterio GO-LIVE

La versión puede pasar a go-live cuando:
- El build de Vercel finalice correctamente.
- Las variables server-side estén configuradas.
- `LEGACY_FIRESTORE_REST_FALLBACK=false` no rompa iCal.
- Las pruebas manuales críticas de reserva, bloqueo, anulación, caja e iCal pasen.
- Se confirme backup técnico antes del primer uso real.
