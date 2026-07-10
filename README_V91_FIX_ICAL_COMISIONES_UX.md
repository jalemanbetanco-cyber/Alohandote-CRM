# V91 - Fix iCal, comisiones y UX

## Cambios
1. Reservas iCal:
   - Mejora la detección del alojamiento real por:
     - accommodationId
     - URL iCal vinculada
     - icalSourceKey con id del alojamiento
     - accommodationName / residence / texto relacionado
   - Nuevas sincronizaciones iCal guardan una clave por alojamiento.
   - Se agrega botón "Reparar nombres iCal" en submódulos de Alojamientos para intentar vincular registros iCal antiguos.

2. Próximas operaciones:
   - La ventana cambia de próximos 2 días a próximo 1 día.

3. Comisiones:
   - Solo se calculan para registros hechos por perfil operator/vendedor.
   - Registros creados por admin/Jose Aleman no generan comisión.

4. UX:
   - Submódulos Entregas/Recepciones y Check-in/Check-out quedan posicionados arriba y sticky.
   - Se elimina el banner "Módulo RRHH ERP activo".

## Nota sobre iCal antiguo
Si un evento iCal viejo no tiene accommodationId ni URL iCal guardada, el sistema no puede saber con 100% certeza a qué alojamiento pertenece. Usa el botón "Reparar nombres iCal"; si sigue apareciendo como "Alojamiento sin vincular", elimina los bloqueos iCal y sincroniza nuevamente desde cada alojamiento.
