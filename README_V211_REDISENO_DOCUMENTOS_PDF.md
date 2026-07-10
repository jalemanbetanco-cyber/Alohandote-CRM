# V211 - Rediseño corporativo de documentos PDF

Base estable: V210 desplegada.

## Alcance
- Rediseño visual minimalista de cotizaciones y comprobantes automáticos.
- Aplica a Alojamientos y Renta Car.
- Integra logo oficial `public/alohandote-logo.png`.
- Elimina subtítulos redundantes, bloque de políticas y mensajes de validez.
- Footer corporativo limpio: @alohandote · 04248639102 · ventas@alohandote.com.

## Sin cambios funcionales
No se modifica caja, reservas, abonos, iCal, Firebase, aliados, inventario, RRHH, ROI ni calendarios.

## Validación
```bash
npm run production:check
npm run build
```
