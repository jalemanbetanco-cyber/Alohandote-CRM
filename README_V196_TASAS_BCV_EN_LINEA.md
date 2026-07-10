# V196 · Tasas BCV en línea

Cambio puntual:
- El cotizador usa EURO BCV consultado por `/api/rates`.
- RRHH usa USD BCV consultado por `/api/rates`.
- Se elimina el retorno fijo obligatorio de V171.
- La API intenta BCV oficial y respaldos públicos antes del valor de emergencia.
- El navegador refresca cada 5 minutos y conserva la última tasa válida hasta 24 horas si hay una caída temporal.
- No modifica caja, iCal, reservas, mantenimiento, inventario, documentos ni permisos.
