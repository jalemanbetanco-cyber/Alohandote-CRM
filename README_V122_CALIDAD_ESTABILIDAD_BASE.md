# V122 - Calidad, estabilidad y seguridad base

## Objetivo
Avanzar con la planificación profesional sin alterar la lógica construida.

## Cambios aplicados

### 1. Error Boundary
Se agregó `src/ErrorBoundary.jsx` y se envolvió la aplicación en `src/main.jsx`.

Beneficio:
- Si ocurre un error visual, el sistema muestra una pantalla controlada.
- Evita que el usuario vea solo una pantalla blanca.
- Permite recargar o intentar continuar.

### 2. Smoke check
Se agregó:

npm run quality:smoke

Valida:
- Archivos principales.
- ErrorBoundary montado.
- Reglas Firebase sin `if true`.
- Detector iCal global.
- Compatibilidad operator.
- Corrección de mantenimiento/iCal.

### 3. Quality scripts
Se agregaron:

npm run quality:build
npm run quality:smoke
npm run quality:all

### 4. Documentación profesional
Nueva carpeta `docs/` con:
- QUALITY_BASELINE.md
- QA_SMOKE_TESTS.md
- SECURITY_BASELINE.md
- ARCHITECTURE_GUARDRAILS.md

## No cambia
- Reservas.
- Cotizaciones.
- Mantenimiento.
- Caja.
- Inventario.
- RRHH.
- iCal.
- Diseño existente.

## Validación recomendada
1. npm run quality:smoke
2. npm run build
3. Subir a GitHub.
4. Validar Vercel.
5. Probar login admin y operator.
