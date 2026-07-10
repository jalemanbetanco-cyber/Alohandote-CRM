# V221.18 Hotfix Documentos + Link Logística Final

Correcciones quirúrgicas reales:

1. Corrige error de copia del link de logística causado por variable `payload` inexistente.
2. El link de operaciones incluye snapshot `ops` y puede abrir aunque Firestore bloquee lectura pública.
3. Si Firebase no está disponible, el modo operaciones usa el payload embebido en el link.
4. Compartir PDF limpio en mobile espera y genera el PDF en el mismo click, sin pedir segundo intento.
5. Barra mobile de documentos queda más compacta y proporcional.

No toca caja, reservas, abonos, iCal, ROI, inventario ni lógica financiera estable.
