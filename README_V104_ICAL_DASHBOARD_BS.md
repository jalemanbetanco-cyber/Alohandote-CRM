# V104 - Corrección iCal propio + dashboard USD/Bs UX

## 1. Corrección de conflicto iCal en alojamientos
El sistema estaba bloqueando la edición de una reserva interna porque detectaba como conflicto un bloqueo iCal importado.

Nueva regla:
- Las reservas internas sí validan conflictos contra otras reservas internas.
- Los bloqueos iCal importados NO bloquean la edición/guardado de reservas internas.
- Esto evita el error: "Ese rango choca con Reservado: Airbnb (Not available)".

Motivo:
Airbnb puede estar bloqueado por el mismo iCal/exportación del sistema Alohandote, por lo que no debe impedir editar la reserva real del sistema.

## 2. Dashboard administrativo más armónico
Se agrega componente visual `DualAmount` para mostrar USD y Bs en dos niveles:

- USD grande/principal
- Bs pequeño/secundario

Esto evita que los montos en Bs rompan la proporción visual en web y mobile.

## 3. Diseño aplicado
Se aplica a:
- KPIs Administración ERP
- Resumen por método de pago
- Tablas administrativas principales

## 4. Concepto UX recomendado
El dólar queda como moneda principal operativa.
El bolívar queda como referencia secundaria, visible pero menos dominante.
