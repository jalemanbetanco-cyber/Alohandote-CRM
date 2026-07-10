# V221.15 Hotfix Documentos + Operaciones Definitivo

Corrección real sobre el flujo de vista previa de documentos:

- La vista previa ahora tiene barra superior en la ventana principal de la app, no solo dentro del iframe.
- Compartir PDF limpio se ejecuta desde la app principal para mejorar compatibilidad mobile/WhatsApp.
- Imprimir limpio abre un PDF generado con jsPDF para evitar pies/marcas del navegador.
- El botón Volver a la app cierra la vista previa y conserva el formulario montado.
- Se conserva el nombre del documento por cliente.
- Se preservan reservas, caja, abonos, iCal, inventario, RRHH, ROI y lógica financiera.

QA mínimo:
1. Abrir recibo/cotización/contrato en mobile.
2. Presionar Compartir PDF limpio.
3. Enviar por WhatsApp.
4. Volver a la app y confirmar que el formulario sigue abierto.
5. Presionar Imprimir limpio y validar que no aparezcan marcas inferiores del navegador.
6. Probar link de operaciones con token vigente.
