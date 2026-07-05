# V118 - Fix deploy root + operator legacy

## Problemas corregidos

### 1. Error en Vercel: package.json no encontrado
El ZIP anterior tenía la carpeta `v117work/` como carpeta raíz interna. Si se subía desde la carpeta padre por error, GitHub quedaba con `v117work/package.json` y Vercel buscaba `/package.json`, por eso fallaba.

Esta V118 se entrega con los archivos del proyecto directamente en la raíz del ZIP:
- package.json
- src/
- index.html
- firestore.rules
- storage.rules
- firebase.json

Así, aunque descomprimas y subas la carpeta resultante, Vercel encuentra `package.json`.

### 2. Perfil operator
Se agregó compatibilidad con perfiles antiguos que tienen:
- operator
- operador

Ahora se normalizan como `operator_general` y conservan acceso operativo a:
- Renta Car
- Alojamientos
- Comercial
- Entregas / recepciones
- Check-in / check-out
- Crear/editar operación comercial y logística

### 3. Reglas Firebase
Las reglas también reconocen:
- operator_general
- operator
- Operador
- operador

## Importante
Después de subir esta versión, vuelve a desplegar reglas:

firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar
