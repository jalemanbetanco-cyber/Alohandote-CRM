# V156 - Restauración de módulos y navegación completa

## Objetivo
Corregir el hallazgo QA-V155-001: en la primera prueba la aplicación funcionaba en los flujos disponibles, pero se percibía incompleta porque el modo demo/perfil operador ocultaba módulos críticos del sistema.

## Principio de no regresión
Esta versión no elimina flujos existentes. Mantiene la lógica funcional de V154/V155 y solo agrega una capa de visibilidad/control para que la prueba de completitud sea correcta.

## Cambios aplicados

### 1. Modo demo administrador
Cuando Firebase no está configurado o la app se ejecuta localmente en modo demo, ahora se activa un perfil efectivo de administrador para pruebas:

- Nombre: Administrador Demo
- Rol: admin
- Permisos: todos los módulos visibles
- Datos: siguen guardándose en localStorage, no en producción

Esto evita que una prueba local se confunda con un perfil operador limitado.

### 2. Navegación completa para administrador
Se agregó un panel QA/admin llamado `V156 · Mapa completo de módulos` con accesos directos a:

- Renta Car
- Entregas de vehículos
- Recepciones de vehículos
- Alojamientos
- Check-in
- Check-out / limpieza
- Comercial
- Caja / Administración
- Inventario
- RRHH
- Mantenimiento
- Rentabilidad / ROI

### 3. Permisos reales conservados
En producción con Firebase, los permisos siguen dependiendo del usuario autenticado y de su perfil:

- Admin: ve todo
- Supervisor: ve operación + ERP autorizado
- Operador: ve solo operación permitida
- Limpieza/mantenimiento/contabilidad: ven solo sus módulos

### 4. Validación técnica agregada al gate
`npm run production:gate` ahora valida que:

- Existe el modo demo administrador V156
- Existe el panel de mapa completo de módulos V156
- No se perdieron las validaciones V154/V155

## Archivos modificados

- `src/App.jsx`
- `src/styles.css`
- `scripts/production-gate.mjs`
- `package.json`

## Resultado de pruebas

Comando ejecutado:

```bash
npm run production:check
```

Resultado:

```txt
GO técnico: validaciones estáticas de producción aprobadas.
```

## Pendiente antes de producción
El build real aún debe ejecutarse en un ambiente con dependencias instaladas:

```bash
npm install --legacy-peer-deps
npm run build
```

En este entorno el build no pudo validarse porque `vite` no está instalado en `node_modules`.

## Criterio QA para aprobar esta versión

La versión V156 se considera aprobada funcionalmente si:

- En modo demo se ve el panel `V156 · Mapa completo de módulos`.
- Admin ve todos los módulos.
- Operador no ve módulos administrativos no autorizados.
- Lo probado en V155 sigue funcionando.
- El build en Vercel Preview pasa sin errores.
