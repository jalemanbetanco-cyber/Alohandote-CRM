# V65 - Sidebar estilo Airbnb + recomendación WhatsApp

## Cambios de diseño V65
- La barra lateral ahora muestra cada **vehículo** y **alojamiento** con una **miniatura de foto** en un recuadro pequeño, inspirada en la estructura visual de Airbnb.
- Si el elemento no tiene foto, se muestra un placeholder limpio.
- Se mejoró la jerarquía visual del nombre y el subtítulo.
- Se mantuvieron los botones de acción (editar, eliminar, catálogo, KM) a la derecha.

## Recomendación profesional para envío automático por WhatsApp
Para que al guardar una reserva el sistema envíe automáticamente:
- recibo PDF,
- ubicación de Google Maps,
- texto personalizado,
- video,
- y lo haga al número del cliente,

**no es suficiente solo con frontend**.

### Solución recomendada
Usar:
1. **Firebase Firestore** → guardar la reserva.
2. **Firebase Cloud Functions / backend Node.js** → detectar la nueva reserva.
3. **WhatsApp Business Cloud API (Meta)** → enviar mensajes automáticos.
4. **Firebase Storage** → guardar PDF y video.

### Flujo recomendado
1. Usuario guarda la reserva.
2. La app crea el documento de reserva en Firestore.
3. Una Cloud Function detecta la nueva reserva.
4. La función construye el mensaje y obtiene:
   - enlace del PDF,
   - link de Google Maps,
   - texto base,
   - URL del video.
5. La función llama la API de WhatsApp Business y envía el mensaje al cliente.

### Datos que conviene guardar en la reserva
- `customerName`
- `phone`
- `mapsUrl`
- `receiptUrl`
- `videoUrl`
- `whatsappStatus`
- `whatsappSentAt`
- `whatsappError`

### Mensaje sugerido
Hola, {nombre}. 👋
Tu reserva fue registrada correctamente.

📄 Recibo: {link_pdf}
📍 Ubicación: {google_maps}
🎥 Video / guía de acceso: {video_url}

Cualquier duda, estamos atentos.
Alohandote.

## Nota importante
Para **enviar archivo PDF o video automáticamente**, debes tener:
- cuenta de Meta Business,
- número aprobado en WhatsApp Business Cloud API,
- token permanente,
- plantillas aprobadas si el envío sale fuera de la ventana de 24 horas.
