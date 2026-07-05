# Alohandote V165 · Runbook Go-Live controlado

## Objetivo
Preparar la versión V165 para un despliegue controlado sin alterar la lógica funcional validada en V164. Esta versión agrega controles de release, documentación operativa, workflow CI, preflight técnico y lineamientos de monitoreo/rollback.

## Principio de estabilidad
- No cambiar lógica validada de caja, compra de $, venta de $, catálogos ni documentos.
- Desplegar primero en Vercel Preview.
- Validar con datos controlados antes de promover a producción.
- Conservar ZIP/commit estable anterior y backup técnico antes del cambio.

## Comandos locales obligatorios
```bash
npm install --legacy-peer-deps
npm run production:check
npm run release:preflight
npm run build
npm run dev
```

## Comando único de Go/No-Go
```bash
npm run release:go-no-go
```

Este comando ejecuta:
1. Validaciones técnicas y de negocio.
2. Preflight Go-Live.
3. Build productivo.

## Variables de entorno en Vercel
Configurar en Project Settings > Environment Variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_BASE64=
LEGACY_FIRESTORE_REST_FALLBACK=false
ICAL_PROXY_ALLOWED_HOSTS=airbnb.com,booking.com,calendar.google.com,vrbo.com
```

## Flujo de despliegue recomendado
1. Crear backup JSON y Excel desde Administración ERP.
2. Guardar ZIP estable anterior.
3. Subir V165 a rama nueva o branch de prueba.
4. Dejar que Vercel genere Preview.
5. Ejecutar checklist manual completo.
6. Validar en celular y escritorio.
7. Validar usuario admin y operador.
8. Promover a producción solo si el checklist está 100% OK.

## Criterios de NO-GO
No pasar a producción si ocurre cualquiera de estos casos:
- `npm run release:go-no-go` falla.
- Compra/Venta de $ no actualiza caja correctamente.
- Anulación con devolución Bs no descuenta caja.
- Catálogo o documentos abren en blanco.
- Login/roles no funcionan.
- Monitor de salud muestra evento crítico.
- Vercel Preview no carga o falla en móvil.

## Validación post-deploy
Después de promover a producción:
- Abrir producción en escritorio y móvil.
- Crear prueba controlada de reserva.
- Exportar backup técnico.
- Revisar auditoría reciente.
- Revisar monitor de salud.
- Confirmar que no haya errores en consola del navegador.

## Responsable operativo
El responsable del GO/NO-GO debe confirmar por escrito:
- Versión desplegada.
- Fecha y hora.
- Resultado de checklist.
- Backup creado.
- Plan de reversa disponible.
