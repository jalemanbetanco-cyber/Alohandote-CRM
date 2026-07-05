# V136 - Validación final para producción

## Objetivo
Agregar una compuerta final antes de pasar a producción controlada.

## Nuevo comando principal
```powershell
npm run production:check
```

Este comando ejecuta:

1. `npm run quality:smoke`
2. `npm run test:business`
3. `npm run production:gate`

## Comando final completo
```powershell
npm run quality:all
```

Este comando ejecuta todo lo anterior y además:

4. `npm run quality:build`

## Criterio GO
Puedes avanzar a producción controlada si:

- `npm run production:check` pasa.
- `npm run build` pasa.
- Vercel despliega sin errores.
- Firebase rules se despliegan.
- Monitor de salud queda sin críticos.
- Backup JSON y Excel están descargados.
- Prueba mobile real completada.

## Criterio NO-GO
No avanzar si aparece:

- Pantalla visual de error.
- `ReferenceError`.
- `RangeError`.
- `permission-denied`.
- Fallas en `production:check`.
- Fallas en build.
- Roles reales sin validar.
- No hay backup previo.

## Validación manual final
Después de desplegar:

1. Abrir dominio principal en incógnito.
2. Entrar como admin.
3. Abrir Administración ERP.
4. Revisar Monitor de salud.
5. Descargar Backup JSON.
6. Descargar Backup Excel.
7. Crear una reserva de prueba.
8. Editar la reserva.
9. Eliminar o cancelar la prueba.
10. Revisar auditoría reciente.
11. Probar desde celular real.

## Resultado esperado
Sistema estable para producción controlada.
