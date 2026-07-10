# V170 - Reset caja + BCV fijo operativo

## Cambios
- Caja disponible solo suma reservas pagadas completamente/sin diferencia a pagar.
- Cuentas por cobrar quedan fuera de caja hasta completar pago.
- Al completar pago, la reserva sale de CxC por `pendingAmount <= 0`.
- Se agregó `LOCAL_STORAGE_VERSION = v170` para iniciar pruebas locales limpias sin datos heredados de V169.
- Se agregó botón admin `Reiniciar caja` para borrar movimientos de prueba y arrancar caja desde cero.
- Tasa EURO BCV fallback operativo: 680,08 Bs.
- Tasa USD BCV fallback operativo para RRHH: 587,40 Bs.
- El cotizador recalcula formularios abiertos aunque existiera una tasa antigua en el draft.

## Prueba obligatoria
1. Abrir V170. La caja local debe iniciar limpia.
2. Crear reserva parcial: debe aparecer en CxC, pero no subir Caja disponible como pago completo.
3. Completar pago: debe salir de CxC y entrar a caja.
4. Verificar EURO BCV 680,08 en reserva.
5. Verificar USD BCV 587,40 en RRHH/recibo.
