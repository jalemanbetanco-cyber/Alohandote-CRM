# V95 - Vincular iCal antiguo con alojamiento

## Por qué aparecía "Alojamiento sin vincular"
Ese texto aparece cuando el evento iCal antiguo fue importado sin:
- accommodationId
- accommodationName
- icalSourceUrl
- icalSourceKey

En ese caso el sistema no puede saber automáticamente a qué alojamiento pertenece.

## Solución agregada
Cuando un evento iCal aparezca como "Alojamiento sin vincular", ahora verás un botón:
- Vincular alojamiento

Al presionarlo podrás seleccionar el alojamiento correcto:
- Res. Girasol Suites
- Res. Villamar, Lecheria
- Res. Arabella
- etc.

Al guardar, el sistema actualiza:
- accommodationId
- accommodationName
- propertyName
- assetName
- accommodationTitle

También intenta actualizar todos los eventos del mismo iCal si comparten URL o clave de origen.

## Para futuras sincronizaciones
La V94/V95 ya guarda mejor metadata del alojamiento al sincronizar iCal, por lo que los nuevos eventos deberían entrar con el nombre correcto.

## Recomendación
Para limpiar data antigua:
1. Entra al submódulo Check-in o Check-out.
2. Donde diga "Alojamiento sin vincular", presiona "Vincular alojamiento".
3. Selecciona el alojamiento correcto.
4. Guarda.
