# V144 - Anulación/Devolución operativa

## Cambios
- Botón `Devolución` reemplazado por `Anulación/Devolución`.
- Se agregó formulario formal de anulación/devolución.
- Campos obligatorios:
  - monto a devolver,
  - método de devolución,
  - número de referencia,
  - comprobante.
- Al guardar:
  - status pasa a `cancelled`,
  - el calendario queda desbloqueado,
  - la reserva ya no entra en cuentas por cobrar,
  - Administración ERP registra egreso como `Anulación / devolución`,
  - queda auditoría y comprobante asociado.

## Impacto
No elimina la reserva: la conserva como anulada para trazabilidad.
