# V119 - Fix sistema no abre: publicTaskId en LoginScreen

## Problema corregido
El sistema fallaba al cargar con:

Uncaught ReferenceError: publicTaskId is not defined

## Causa
En una versión anterior quedaron dos líneas dentro de `LoginScreen` usando variables que solo existen dentro del componente principal `App`:

- publicTaskId
- activeTask
- publicOperationButtonLabel
- returnToPublicOperationsList

Como `LoginScreen` se renderiza antes de App, el sistema rompía completamente.

## Corrección
Se eliminaron esas referencias del LoginScreen.

## También se mantiene
- Corrección V118 para que `package.json` quede en la raíz.
- Compatibilidad con perfil legacy `operator` / `operador`.
- Reglas Firebase actualizadas.

## Validación
Después de desplegar:
1. Abrir sistema normal.
2. Login admin.
3. Login operator.
4. Abrir comercial/renta car/alojamientos.
5. Abrir link público de operaciones si aplica.
