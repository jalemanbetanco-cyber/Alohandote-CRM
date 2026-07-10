# V117 - Roles y permisos reales

## Objetivo
Aplicar la segunda fase recomendada por el consultor especialista: roles y permisos más detallados sin romper el flujo construido.

## Qué cambia
Esta versión no rediseña formularios ni cambia la lógica comercial. Solo ordena permisos y accesos por perfil.

## Roles normalizados
El sistema ahora reconoce perfiles como:

- Administrador
- Supervisor
- Vendedor
- Operador Renta Car
- Operador Alojamientos
- Recepción vehículos
- Limpieza
- Mantenimiento
- Contabilidad
- Solo lectura

## Permisos por módulo

### Administrador
Acceso total.

### Supervisor
Acceso amplio a operación, ERP, inventario, RRHH, mantenimiento y reportes.

### Vendedor
Acceso a:
- Renta Car
- Alojamientos
- Comercial
- Crear/editar cotizaciones y reservas según permisos.

### Operador Renta Car
Acceso a:
- Renta Car
- Entregas / recepciones de vehículos
- Operación de vehículos

### Operador Alojamientos
Acceso a:
- Alojamientos
- Check-in / Check-out
- Operación de alojamientos

### Recepción vehículos
Acceso a:
- Recepciones y entregas de vehículos

### Limpieza
Acceso a:
- Alojamientos
- Check-out / limpieza
- Inventario operativo visible

### Mantenimiento
Acceso a:
- Mantenimiento
- Inventario operativo
- Renta Car como apoyo operativo

### Contabilidad
Acceso a:
- Administración ERP
- Rentabilidad
- Exportaciones
- Caja / reportes

### Solo lectura
Puede consultar módulos, pero no debe crear ni modificar registros.

## RRHH integrado con permisos
En el formulario de Personal se agregan/usan:

- Acceso al sistema
- Perfil de permisos

Si el colaborador tiene correo y usuario Firebase, al iniciar sesión el sistema intenta resolver su perfil por el correo registrado en RRHH.

## Firestore rules
Las reglas fueron ajustadas para separar:

- Operación
- Master data
- RRHH
- Contabilidad
- Eliminación solo admin

## Importante
Después de subir esta versión, despliega reglas:

firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar

## Validación recomendada
1. Entrar con admin: debe ver todo.
2. Crear un personal con correo y perfil Vendedor.
3. Iniciar sesión con ese usuario: debe ver Comercial/Renta Car/Alojamientos, pero no RRHH.
4. Probar perfil Contabilidad: debe ver Administración y Rentabilidad.
5. Probar perfil Limpieza: debe ver operación de alojamientos/limpieza.
