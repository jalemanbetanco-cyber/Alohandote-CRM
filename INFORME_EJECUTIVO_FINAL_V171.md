# Informe Ejecutivo Final V171

Estado: candidato para reprueba puntual.

La V171 corrige la inconsistencia de tasas que seguía apareciendo en formularios aunque se hubiese corregido el endpoint. La causa probable era combinación de cache local, valores guardados en registros/personas y fallback externo con datos no esperados.

Decisión técnica: para estabilizar la prueba Go-Live, se fijan las tasas operativas solicitadas directamente en los helpers usados por formularios:

- EURO BCV: 680,08 Bs.
- USD BCV: 587,40 Bs.

Esto evita que el cotizador o RRHH dependan de datos viejos o de una integración externa inestable durante la validación.
