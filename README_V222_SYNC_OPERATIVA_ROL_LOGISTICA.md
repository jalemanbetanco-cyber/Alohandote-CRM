# V222 — Sincronización Operativa + Rol Logística

Base: V221.19 Rollback Documentos + Link Operaciones Seguro.

## Alcance aplicado

1. Sincronización iCal tipo Airbnb:
   - Mantiene sincronización automática cada 10 minutos.
   - Conserva URLs iCal y no desvincula calendarios externos.
   - Guarda `lastIcalSyncAt` y `icalSyncStatus` por calendario externo.
   - Muestra plataforma detectada, última actualización, estado y eventos importables.

2. Entregas / recepciones / limpieza:
   - Las tarjetas y formularios muestran contacto del cliente.
   - Las entregas muestran hora de entrega.
   - Las recepciones muestran hora de recepción/devolución.
   - Alojamientos muestran check-in/check-out cuando aplique.

3. Nuevo rol `Logística`:
   - Acceso solo a Entregas y Recepciones de Renta Car.
   - Acceso solo a Check-out / Limpieza en alojamientos.
   - No muestra calendario de Renta Car.
   - No muestra calendario de Alojamientos.
   - No muestra caja, reservas, comercial, ROI, inventario ni administración.

## Módulos no alterados

Caja, abonos, documentos/PDF, reservas comerciales, ROI, iCal base, aliados, inventario y RRHH quedan preservados.

## Validación

- `npm run production:check` aprobado.
- `npm run build` aprobado después de instalar dependencias.

## Deploy

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
vercel --prod
```
