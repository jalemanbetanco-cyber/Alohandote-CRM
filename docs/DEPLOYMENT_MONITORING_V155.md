# Despliegue y monitoreo V155

## 1. Instalación limpia

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
```

## 2. Configuración Vercel

Configurar las variables de entorno frontend `VITE_*` y las variables server-side:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `LEGACY_FIRESTORE_REST_FALLBACK=false`
- `ICAL_PROXY_ALLOWED_HOSTS`

## 3. Validación post-deploy

Validar manualmente:

1. Login admin.
2. Crear reserva renta car.
3. Bloquear fechas solo al presionar botón de bloqueo.
4. Crear reserva alojamiento.
5. Anular reserva y validar que el calendario ignore anuladas.
6. Registrar devolución y confirmar caja limpia.
7. Subir comprobante JPG/PNG/HEIC/PDF.
8. Abrir endpoint iCal y confirmar que no expone nombre de cliente.
9. Probar importación iCal desde proveedores autorizados.
10. Exportar backup técnico.

## 4. Monitoreo mínimo

- Revisar errores de Vercel Functions.
- Revisar `permission-denied` en Firebase.
- Revisar costos de Firestore/Storage semanalmente.
- Exportar backup antes de cambios críticos.
- Crear alerta operativa si iCal falla.

## 5. Rollback

Conservar la versión V154 como rollback. Si V155 falla:

1. Revertir deploy en Vercel al último despliegue estable.
2. Restaurar variables de entorno anteriores si fueron modificadas.
3. Revisar logs.
4. No borrar datos Firestore.
5. Ejecutar backup antes de reintentar deploy.
