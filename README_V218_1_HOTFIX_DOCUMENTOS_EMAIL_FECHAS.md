# V218.1 Hotfix Documentos / Email / Fechas

Base: V218 desplegada.

## Alcance quirúrgico

1. Contrato PDF Renta Car: se elimina solo el bloque de contacto inferior.
2. Formularios de reservas/cotizaciones de Alojamientos y Renta Car: se agrega campo `Correo electrónico`.
3. PDFs de cotización y reserva: se conserva el campo `Correo` y se alimenta desde el nuevo email capturado.
4. PDFs de Renta Car: se elimina el kilometraje aproximado de cotizaciones/recibos.
5. Fechas de documentos: entrega, devolución, check in y check out usan formato tipo `Lun-27 jun`.

## No se toca

- Caja
- Abonos
- CxC/CxP
- Calendario
- iCal
- Firebase
- Aliados
- Inventario
- RRHH
- ROI
- Reglas de seguridad

## Validación

```bash
npm run production:check
npm run build
```
