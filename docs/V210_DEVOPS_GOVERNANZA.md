# V210 · DevOps / CI-CD / Gobernanza de versiones

## Objetivo

Asegurar que Alohandote CRM evolucione con mayor estabilidad, evitando subir a GitHub o congelar versiones sin pasar por validaciones mínimas.

## Alcance

Esta versión no modifica flujos funcionales del CRM. No toca reservas, caja, abonos, alojamientos aliados, iCal, Firebase, inventario, RRHH, ROI ni documentos PDF.

## Cambios incorporados

- Nuevo script `test:v210`.
- Nuevo script `ci:quality`.
- Nuevo script `release:stable`.
- Nueva suite `tests/v210-devops-governance.test.mjs`.
- Servicio puro `src/services/versionGovernanceService.js`.
- Workflow manual `.github/workflows/release-candidate.yml`.
- `production:check` ahora incluye V210.

## Flujo recomendado

```bash
npm install
npm run production:check
npm run build
vercel --prod
```

Después del despliegue, ejecutar pruebas de usuario. Solo si todo está aprobado:

```bash
git status
git add .
git commit -m "V210 estable - DevOps y gobernanza"
git tag v210
git push origin main
git push origin v210
```

## Regla de congelamiento

GitHub debe recibir únicamente la versión ya desplegada, testeada y aprobada por usuario.
