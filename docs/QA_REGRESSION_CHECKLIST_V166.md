# Alohandote V165 · Checklist QA de regresión manual

## Administración / Caja
- [ ] Caja disponible muestra saldo lógico en Bs.
- [ ] No muestra equivalentes USD falsos debajo de cajas Bs.
- [ ] Compra de $ guarda correctamente.
- [ ] Compra de $ suma USD al método seleccionado.
- [ ] Compra de $ descuenta Bs de caja.
- [ ] Venta de $ guarda correctamente.
- [ ] Venta de $ descuenta USD del método seleccionado.
- [ ] Venta de $ suma Bs a caja.
- [ ] Exportar administración genera archivo.

## Reservas Renta Car
- [ ] Crear reserva con pago completo.
- [ ] Crear reserva con abono.
- [ ] Editar reserva.
- [ ] Bloquear fechas solo cuando se presiona el botón.
- [ ] Botón limpiar campos funciona.
- [ ] Subir comprobante JPG/PNG/HEIC/PDF funciona o muestra error claro.
- [ ] Anular reserva libera calendario.
- [ ] Anulación con devolución en Bs descuenta Bs exactos.
- [ ] Anulación no duplica devolución.

## Alojamientos
- [ ] Crear reserva alojamiento.
- [ ] Check-in visible.
- [ ] Check-out / limpieza visible.
- [ ] iCal no duplica bloqueos.
- [ ] Reservas anuladas no bloquean calendario.

## Comercial / Documentos
- [ ] Cotización abre con contenido.
- [ ] Contrato abre con contenido.
- [ ] Recibo abre con contenido.
- [ ] Permite imprimir o guardar PDF.
- [ ] Catálogo alojamiento se ve correcto.
- [ ] Catálogo renta car usa estructura tipo alojamiento.
- [ ] Catálogos se visualizan bien en celular.

## ERP / Módulos
- [ ] Inventario carga y exporta.
- [ ] RRHH carga y exporta.
- [ ] Mantenimiento carga y exporta.
- [ ] ROI muestra datos conectados con reservas/activos.
- [ ] Mapa completo de módulos visible para admin.
- [ ] Operador no ve módulos restringidos.

## Seguridad / Operación
- [ ] Login admin funciona.
- [ ] Login operador funciona.
- [ ] Reglas Firebase desplegadas.
- [ ] Links públicos no exponen datos sensibles.
- [ ] Monitor de salud sin eventos críticos.
- [ ] Backup JSON creado.
- [ ] Backup Excel creado.
- [ ] Auditoría registra acciones críticas.

## Aprobación
- [ ] Prueba escritorio aprobada.
- [ ] Prueba móvil aprobada.
- [ ] Prueba Vercel Preview aprobada.
- [ ] Backup previo al release creado.
- [ ] Rollback disponible.
