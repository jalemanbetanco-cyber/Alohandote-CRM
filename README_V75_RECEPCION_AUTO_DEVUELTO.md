# V75 - Recepción automática y estado Devuelto

## Problema corregido
Cuando el personal registraba una recepción desde el link público, la recepción podía guardarse sin `reservationId`, por eso la reserva seguía apareciendo como pendiente.

## Corrección
- Si la recepción viene sin reserva relacionada, el sistema busca automáticamente la reserva pendiente del vehículo.
- Solo toma reservas:
  - del mismo vehículo,
  - con estado Reservado,
  - pagadas al 100%,
  - sin returnedAt,
  - sin recepción ya vinculada.
- Al guardar la recepción:
  - crea el registro de recepción,
  - actualiza el kilometraje del vehículo,
  - marca la reserva como `returned`,
  - guarda returnedAt, kmRecepcion y kmRecorridos,
  - la elimina automáticamente de Pendientes de recepción.

## Nota
Si hay varias reservas pendientes del mismo vehículo, se vincula la más próxima/vencida por fecha de entrega.
