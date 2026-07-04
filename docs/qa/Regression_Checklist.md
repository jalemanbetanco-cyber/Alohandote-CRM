# Alohandote CRM Regression Checklist

Antes de aprobar cualquier cambio se debe validar:

## General
- Login funciona.
- No hay errores en consola.
- npm run build pasa correctamente.

## Reservas
- Crear reserva Renta Car.
- Crear reserva Alojamiento.
- Editar reserva.
- Eliminar o cancelar según regla aprobada.

## Caja
- Ingreso en Bs impacta caja Bs.
- Ingreso en USD impacta método correspondiente.
- Egreso reduce caja solo cuando corresponde.
- CxC no entra en caja hasta pagarse.
- CxP no sale de caja hasta pagarse.

## Documentos
- Cotización PDF funciona.
- Recibo PDF funciona.
- Contrato Renta Car funciona.

## Calendario
- Renta Car bloquea por día.
- Alojamiento bloquea por noche.
- No hay conflictos visuales.