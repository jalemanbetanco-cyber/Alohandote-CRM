# V209 - Automatización QA y Regresión Controlada

## Objetivo

V209 parte de V208 estable y agrega una capa de pruebas automatizadas para proteger los flujos críticos antes de avanzar a nuevas funcionalidades.

## Alcance implementado

- Nueva suite `test:v209`.
- Nuevo comando `qa:regression`.
- Matriz QA automatizable para GO/NO-GO.
- Pruebas de regresión sobre Renta Car, abonos, caja por método, documentos, iCal y alojamientos aliados.
- Funciones puras adicionales para editar/eliminar/resumir abonos sin tocar la UI estable.

## Lo que NO se tocó

- `src/App.jsx`.
- Renta Car estable.
- Calendario.
- Caja.
- iCal.
- Firebase/Storage Rules.
- PDF visual.
- Inventario.
- RRHH.
- ROI.

## Comandos

```bash
npm install
npm run production:check
npm run build
vercel --prod
```

## Criterio GO/NO-GO

- 90% a 100% sin fallas críticas: GO.
- 75% a 89% sin fallas críticas: GO con observaciones.
- Menos de 75% o cualquier falla crítica: NO-GO.

## Nota técnica

V209 no cambia comportamiento funcional. Su propósito es blindar el proyecto para que cada nueva versión sea validada con una matriz de regresión más estricta antes de desplegar.
