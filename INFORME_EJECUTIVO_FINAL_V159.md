# Informe ejecutivo V159

## Estado
Versión candidata a prueba de aceptación: Caja + devoluciones + documentos reparados.

## Diagnóstico corregido
La falla principal estaba relacionada con tres puntos:

1. La caja real quitaba los ingresos de reservas anuladas y además restaba la devolución, provocando doble castigo.
2. Las devoluciones en Bs podían interpretarse como USD y multiplicarse por la tasa, generando egresos artificialmente altos.
3. La generación de documentos dependía de ventanas con Blob URL, que en algunos navegadores quedaban en blanco.

## Solución aplicada
- Caja real basada en dinero recibido menos egresos/devoluciones reales.
- Devoluciones con moneda real según método de pago.
- Compatibilidad con datos antiguos de devolución mal interpretados.
- Documentos/catálogos mediante escritura directa segura en pestaña nueva.
- Fallback descargable si el navegador bloquea popup.

## Validación
`npm run production:check` aprobado.

## Recomendación
Probar V159 en local y luego en Vercel Preview. No reemplazar producción hasta validar los flujos de caja, devolución y documentos con datos reales de prueba.
