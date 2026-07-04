# Alohandote CRM Enterprise Architecture Blueprint

## Principio central
App.jsx debe ser un orquestador. La lógica debe vivir en módulos, servicios, hooks y utilidades.

## Estructura objetivo
- modules/: pantallas y dominios funcionales
- services/: lógica de negocio y conexión con Firebase
- hooks/: lógica reutilizable de React
- components/: componentes visuales reutilizables
- utils/: funciones auxiliares
- firebase/: configuración y acceso a Firebase
- docs/: documentación viva del proyecto

## Regla de oro
Ninguna nueva funcionalidad debe crecer directamente dentro de App.jsx.