# V97 - Catálogos, fotos y ROI por kilometraje

## Correcciones

### 1. Catálogos PDF / compartir
Se refuerza el botón de catálogo de vehículos:
- Abre una vista limpia del catálogo.
- Incluye botón Guardar PDF.
- Incluye botón Compartir por WhatsApp.
- Si el navegador bloquea la ventana emergente, descarga un HTML imprimible como respaldo.

También se ajusta el catálogo de alojamientos para mostrar mensaje correcto y fallback.

### 2. Imagen rota en alojamientos
Se mejora la función photoUrl para soportar distintos formatos:
- string
- url
- downloadURL
- src
- dataUrl
- dataURL
- previewUrl
- preview
- base64

Además, si una imagen del listado lateral falla, se oculta y aparece un placeholder de casa.

### 3. ROI / ingreso por km
Se refuerza la automatización:
- Al marcar vehículo entregado, el sistema guarda deliveryKm usando el km actual del vehículo si no existe km de entrega.
- Al recibir el vehículo, calcula kmRecorridos = kmRecepcion - deliveryKm.
- El ROI ahora incluye reservas con status:
  - reserved
  - returned
  - completed

Así las reservas recibidas/devueltas siguen contando en ROI.
