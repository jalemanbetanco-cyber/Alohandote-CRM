# Alohandote V165 · Plan de rollback

## Objetivo
Restaurar la versión estable anterior si V165 presenta fallas en producción.

## Activos que deben conservarse antes del deploy
- ZIP estable anterior.
- Backup JSON de Alohandote.
- Backup Excel de Alohandote.
- Commit o deploy anterior de Vercel.
- Copia de reglas Firebase vigentes.

## Rollback desde Vercel
1. Entrar a Vercel.
2. Abrir el proyecto Alohandote.
3. Ir a Deployments.
4. Seleccionar el deploy estable anterior.
5. Presionar Promote to Production.
6. Validar login, calendario y caja.

## Rollback desde GitHub
```bash
git log --oneline
```
Identificar commit estable anterior y revertir:
```bash
git revert <commit>
git push
```

## Rollback de reglas Firebase
Si el problema es de permisos:
```bash
firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar
```
Usar la copia estable previa de `firestore.rules` y `storage.rules`.

## Rollback de datos
Solo restaurar datos si hubo corrupción confirmada. Antes:
- Exportar estado actual.
- Identificar registros afectados.
- Restaurar solo colecciones necesarias.
- Documentar cada ajuste.

## Criterios para activar rollback
- La app no carga.
- No se puede iniciar sesión.
- Caja calcula mal después del deploy.
- Reservas no se guardan.
- Catálogos/documentos bloquean la operación.
- Reglas Firebase impiden operar.

## Comunicación operativa
Mensaje sugerido:
> Estamos aplicando una reversa técnica preventiva para mantener estable Alohandote. La operación vuelve a la versión anterior mientras revisamos la incidencia.
