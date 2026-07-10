# V199 · Volver al formulario desde documentos

Corrección puntual sobre V198.

- Preabre la pestaña del documento dentro del gesto del usuario para evitar bloqueo de popup.
- Conserva la app y el formulario original abiertos.
- El botón Volver a la app enfoca la pestaña original y cierra solo el documento.
- Incluye respaldo por URL guardada en storage si el navegador no conserva window.opener.
- No modifica iCal, cajas, tasas, reservas, ROI, kilometraje, gastos ni reglas Firebase.
