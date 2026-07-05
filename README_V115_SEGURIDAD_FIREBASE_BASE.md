# V115 - Seguridad Firebase Base

## Objetivo
Primera fase de endurecimiento técnico recomendada por el diagnóstico externo.

Esta versión NO cambia la UI ni la lógica visual del sistema. Se enfoca en reglas de seguridad de Firebase.

## Cambios principales

### 1. Firestore
Se eliminaron reglas públicas peligrosas como:

- allow read, create: if true
- allow update: if true
- allow write: if true

Nueva regla general:
- Solo usuarios autenticados pueden leer/escribir datos operativos.
- Solo admin puede eliminar.
- `dollarPurchases` queda restringido a admin.
- `users/{uid}` solo puede ser leído/editado por el propio usuario o admin.
- Se agrega colección futura `publicReceptionTokens` solo visible por admin.
- Se agrega `auditLogs` como append-only: se puede crear, pero no editar ni borrar.

## Colecciones cubiertas
- vehicles
- accommodations
- reservations
- lodgingReservations
- vehicleCheckins
- inventoryItems
- inventoryMovements
- clientLeads
- hrPeople
- hrTasks
- dollarPurchases
- users
- publicReceptionTokens
- auditLogs

### 2. Storage
Se elimina subida pública:

Antes:
- vehicle-checkins permitía read/write público.

Ahora:
- Solo usuarios autenticados.
- Tamaño máximo: 30 MB.
- Tipos permitidos: imágenes y PDF según carpeta.
- Las rutas sensibles ya no quedan abiertas públicamente.

## Importante
Esta V115 cierra accesos públicos. Los links públicos de recepción/logística deben evolucionar en la V117 con tokens seguros. Hasta implementar esa fase, si un colaborador no está autenticado, no podrá escribir directamente en Firestore/Storage desde un link público.

## Cómo desplegar reglas
Instala Firebase CLI si no lo tienes:

npm install -g firebase-tools

Inicia sesión:

firebase login

Selecciona el proyecto:

firebase use <ID_DE_TU_PROYECTO_FIREBASE>

Despliega reglas:

firebase deploy --only firestore:rules,storage

## Verificación rápida
Después de desplegar:
1. Entra con tu usuario admin.
2. Valida que puedas ver vehículos, alojamientos y reservas.
3. Valida que puedas crear una reserva.
4. Valida que puedas subir un comprobante o factura.
5. Prueba desde una ventana sin sesión: no debería leer ni escribir datos.
