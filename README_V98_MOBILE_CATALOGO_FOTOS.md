# V98 - Mobile, catálogo alojamientos y fotos

## Cambios

### 1. Vista mobile
En celular, los botones de submódulos ahora aparecen arriba del calendario:
- Calendario Renta Car / Entregas / Recepciones
- Calendario Alojamientos / Check-in / Check-out

En desktop se mantiene la lógica anterior del sidebar.

### 2. Catálogo de alojamientos
Se corrige la función Catálogo PDF / Compartir:
- Se abre la ventana imprimible correctamente.
- Incluye Compartir por WhatsApp.
- Incluye Guardar catálogo PDF.
- Si el navegador bloquea la ventana, usa fallback de descarga HTML imprimible.

### 3. Fotos de alojamientos
Se refuerza la lectura de fotos.
Además, se agrega reparación HEIC:
- Las nuevas fotos HEIC se intentan convertir a JPG antes de subir/guardar.
- Se agrega botón "Reparar fotos HEIC" en edición de alojamiento para intentar convertir fotos antiguas HEIC.

## Importante
Chrome/Windows no muestra HEIC nativamente. Si una foto antigua fue guardada como HEIC puro, hay que repararla o volver a subirla como JPG/PNG. La V98 intenta convertir usando heic2any desde CDN.
