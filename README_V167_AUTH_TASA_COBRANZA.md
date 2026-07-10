# Alohandote V167 · Autenticación, tasa EURO BCV y cuentas por cobrar

## Objetivo
Esta versión parte de V166 y corrige los hallazgos reportados en la prueba Go-Live:

1. La tasa EURO BCV no cargaba ni calculaba automáticamente en cotizadores.
2. Cuentas por cobrar aparecía en 0 cuando existían reservas con abono parcial en Bs.
3. El sistema se abría sin autenticación cuando Firebase no estaba configurado.

## Cambios aplicados

### Tasa EURO BCV
- El endpoint `/api/rates` primero intenta leer directamente `https://www.bcv.org.ve/`.
- Si el scraping directo del sitio oficial falla por SSL/bloqueo/HTML cambiante, usa una API comunitaria que replica tasas BCV desde el sitio oficial.
- Si todo falla, permite fallback controlado por variables de entorno.
- El cotizador conserva la tasa congelada del registro (`bcvEuroRate`) para que un pago viejo no se recalcule con una tasa nueva.

### Cuentas por cobrar
- Se agregó cálculo robusto con tasa efectiva por reserva.
- Si la tasa global no cargó, el sistema usa `bcvEuroRate`, `exchangeRateSnapshot`, `totalAmountBs/totalAmount` o `amountBs/amountUsdEquivalent`.
- Para pagos en Bs, la cuenta por cobrar se calcula en Bs reales: `totalAmountBs - amountBs`.

### Autenticación
- El modo demo ya no se activa automáticamente cuando Firebase no está configurado.
- Si no hay variables Firebase, el sistema bloquea la entrada administrativa y muestra pantalla de configuración requerida.
- El modo demo solo puede activarse explícitamente con `VITE_ENABLE_DEMO_MODE=true`, y no debe usarse en producción.

## Variables obligatorias para Go-Live
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAILS=
```

## Variables opcionales de fallback
```env
VITE_FALLBACK_EUR_BCV=
VITE_FALLBACK_USD_BCV=
VITE_FALLBACK_USDT_ALCAMBIO=
```

## Importante
En producción NO configures `VITE_ENABLE_DEMO_MODE=true`.

## Prueba recomendada
1. Abrir Vercel Preview.
2. Confirmar que pide login.
3. Entrar con usuario admin Firebase.
4. Crear una reserva de 140 USD con abono parcial en Bs.
5. Confirmar que el cotizador muestra tasa EURO BCV y Bs automático.
6. Confirmar que cuentas por cobrar muestra el saldo pendiente, no 0.
7. Confirmar mobile con link Vercel Preview, no `localhost`.
