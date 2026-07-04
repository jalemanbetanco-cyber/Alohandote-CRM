# Informe ejecutivo V170

La V170 corrige la lógica de Caja/CxC y prepara un arranque limpio para pruebas de Go-Live.

## Decisiones
- CxC no entra en caja disponible.
- Caja solo usa dinero de reservas pagadas completamente y movimientos reales de divisas/egresos.
- Datos locales antiguos se aíslan con namespace v170.
- Tasas BCV quedan con fallback operativo solicitado: EUR 680,08 y USD 587,40.

## Estado
Candidata a prueba funcional. No publicar sin validar en Vercel Preview.
