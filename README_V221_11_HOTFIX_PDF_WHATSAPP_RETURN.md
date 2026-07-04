# V221.11 Hotfix PDF WhatsApp + Retorno Seguro

## Alcance quirúrgico
- Corrige el comportamiento mobile al compartir PDF limpio vía WhatsApp.
- Evita que el documento quede navegando en blob/pdf y rompa el retorno a la app.
- Al finalizar la acción de compartir en iOS/Web Share, cierra la vista previa y vuelve al formulario montado.
- Refuerza el botón "Volver a la app" con postMessage seguro hacia el overlay padre.
- Asigna nombre real al contrato de renta car para que no se comparta como documento.pdf genérico.

## No tocado
- Caja
- Reservas
- Abonos
- iCal
- Renta Car lógica operativa
- Alojamientos
- Aliados
- Firebase
- Inventario
- RRHH
- ROI

## Validación
npm run production:check
