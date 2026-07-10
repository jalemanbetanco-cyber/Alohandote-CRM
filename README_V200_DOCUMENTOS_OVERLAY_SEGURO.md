# V200 · Documentos en vista previa interna segura

## Alcance
Corrección exclusiva del flujo **Volver a la app** para cotizaciones, recibos, contratos y comprobantes.

## Solución
Los documentos dejan de depender de pestañas emergentes, `window.opener`, historial o enlaces `blob:`. Se muestran en una vista previa de pantalla completa dentro de un `iframe` de la misma aplicación.

- La aplicación y el formulario permanecen montados debajo.
- **Volver a la app** envía un mensaje seguro al contenedor y cierra solo la vista previa.
- No hay recarga, navegación al inicio ni pérdida del formulario.
- Se valida el origen del mensaje antes de cerrar la vista previa.

## Fuera de alcance y preservado
No se modifica iCal, caja, tasas BCV, reservas, kilometraje, ROI, gastos, mantenimiento, RRHH, inventario, Firebase ni reglas de negocio.

## Prueba de aceptación
1. Abrir un formulario con datos.
2. Generar cotización, recibo, contrato o comprobante.
3. Pulsar **Volver a la app**.
4. Debe cerrarse la vista previa y mostrarse el mismo formulario con sus datos intactos.
