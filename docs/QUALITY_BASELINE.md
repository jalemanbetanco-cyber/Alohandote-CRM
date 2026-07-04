# V122 - Baseline profesional de calidad

## Objetivo
Crear una base de mantenimiento profesional para que el sistema Alohandote siga creciendo sin romper funciones existentes.

## Referencias de calidad usadas
- ISO/IEC 25010: calidad de producto de software.
- OWASP Top 10: riesgos principales de seguridad web.
- OWASP ASVS: requisitos verificables de seguridad de aplicaciones.

## Atributos de calidad priorizados para Alohandote
1. Seguridad: roles, reglas Firebase, acceso mínimo necesario.
2. Confiabilidad: evitar pantallas en blanco, validar flujos críticos.
3. Mantenibilidad: cambios pequeños, documentados y versionados.
4. Usabilidad: no romper mobile ni vista PC al evolucionar.
5. Trazabilidad: cada versión debe explicar qué cambia y qué no cambia.

## Regla de evolución
Ninguna versión debe mezclar:
- Cambio visual grande
- Cambio de reglas Firebase
- Cambio de lógica contable
- Cambio de estructura de datos

Si una mejora toca más de una categoría, debe dividirse en fases.
