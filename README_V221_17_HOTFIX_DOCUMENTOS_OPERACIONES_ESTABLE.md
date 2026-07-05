# V221.17 Hotfix Documentos + Operaciones Estable

## Objetivo
Reparación quirúrgica del flujo mobile de documentos y del acceso público de operaciones para terceros.

## Cambios aplicados

### 1. Barra de documentos mobile estable
- Se reemplazó la barra horizontal desproporcionada por una grilla 2x2 compacta.
- Se redujo texto de botones para evitar desbordes en pantallas pequeñas.
- Se mantiene el iframe del documento, pero los controles visibles quedan en la app principal.

### 2. Compartir PDF limpio
- El flujo espera PDF preparado.
- Si Web Share funciona, comparte el PDF como archivo.
- Al volver del share, cierra overlay y retorna al formulario sin history.back ni recarga.
- Si Web Share falla, descarga el PDF limpio como fallback sin romper el estado.

### 3. Documento embebido sin doble barra
- Se refuerza ocultamiento de acciones internas dentro del iframe.
- Se mantiene fondo blanco y evita capturas con UI interna visible.

### 4. Link operaciones para terceros
- El link generado ahora incluye snapshot operativo embebido (`ops`) como respaldo.
- Si Firestore bloquea lectura pública del token, el tercero igualmente puede abrir las tareas desde el snapshot.
- Se mantiene validación por token cuando Firestore lo permite.
- No se toca la escritura/confirmación de operaciones existentes.

## No modificado
- Caja
- Abonos
- Reservas
- iCal
- Aliados
- Inventario
- ROI
- Firebase rules
- Lógica financiera

## Validación
`npm run production:check` aprobado.

## Build
No validado en entorno sandbox por falta de vite/node_modules.
