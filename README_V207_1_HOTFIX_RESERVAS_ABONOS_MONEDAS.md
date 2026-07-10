# V207.1 Hotfix - Reservas, abonos y monedas CxC/CxP

Base: V207 Blindaje Firebase / Storage.

## Objetivo
Corregir regresiones detectadas en pruebas de usuario sin alterar los flujos estables aprobados.

## Correcciones

1. Renta Car
- Protección contra accesos nulos relacionados con `accommodationId`.
- El módulo Renta Car no debe depender de alojamiento seleccionado.

2. Abonos
- Evita duplicación al crear reservas nuevas.
- Agrega trazabilidad `paymentTraceId` por abono.
- Deduplica historial de pagos al normalizar registros existentes.

3. Cuentas por pagar / cobrar
- Las cuentas por pagar de alojamientos aliados conservan el método de pago real del cliente.
- Si el cliente pagó en Zelle, USDT o efectivo USD, la cuenta se expresa en USD con su canal.
- Si el cliente pagó en Bs, la cuenta se expresa en Bs.

## Validación requerida

```bash
npm install
npm run production:check
npm run build
firebase deploy --only firestore:rules,storage
vercel --prod
```

## QA manual obligatorio
- Login.
- Crear reserva Renta Car.
- Crear abono inicial y verificar que no se duplique.
- Editar reserva sin agregar abono y verificar que no se duplique.
- Crear alojamiento aliado con pago Zelle/USDT/$ efectivo y revisar CxP en USD.
- Crear alojamiento aliado con pago Bs y revisar CxP en Bs.
- Validar caja, PDF, comprobantes y alojamiento aliado.
