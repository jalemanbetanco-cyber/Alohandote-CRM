# Alohandote Financial Engine Specification v1.0

## Objetivo
Definir el comportamiento financiero oficial de Alohandote CRM antes de migrar lógica a servicios.

## Flujo principal
Cotización → Reserva → Abono → Caja → CxC/CxP → Dashboard → Reportes

## Reglas base
1. Un abono recibido no debe cambiar históricamente.
2. Caja solo debe mostrar dinero real disponible.
3. Cuentas por cobrar no entran a caja hasta ser pagadas.
4. Cuentas por pagar no reducen caja hasta ser pagadas.
5. Renta Car y Alojamientos tienen reglas financieras separadas.
6. Alojamientos aliados deben separar comisión Alohandote y monto propietario.
7. Toda modificación financiera futura debe dejar trazabilidad.