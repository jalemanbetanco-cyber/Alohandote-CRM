# V223.0 Stable — Núcleo Transaccional Vendedores

Base: V222.1.1 Hotfix Startup estable.

Objetivo: integrar reservas creadas desde roles vendedor / vendedor alojamientos al flujo ERP/CRM administrativo sin alterar funcionalidades estables.

## Alcance funcional

- Las reservas creadas por perfiles vendedores conservan trazabilidad de origen:
  - createdByUid
  - createdByEmail
  - createdByName
  - createdByRole
  - sellerName
  - sellerCommission
- Las reservas vendedor quedan disponibles para lectura del dashboard admin.
- Se preserva la lógica existente de caja, CxC, CxP y comisiones.
- Se mantiene PDF genérico para vendedores externos cuando aplica.
- Se mantiene el hotfix Startup que evita `normalizeText is not defined`.

## Reglas de operación esperadas

### Activo propio
- Abono impacta caja según método real.
- Saldo pendiente genera CxC.
- Comisión vendedor se calcula según configuración vigente.

### Activo aliado
- Ingreso bruto conserva trazabilidad.
- Ganancia Alohandote y monto propietario se separan.
- CxP propietario se registra según lógica de aliado.
- Comisión vendedor debe calcularse sobre ganancia Alohandote cuando aplique.

### Eliminación de reserva
- Debe revertir únicamente registros vinculados a esa reserva:
  - Caja
  - CxC
  - CxP
  - Comisión
  - Operaciones
  - Calendario
  - Auditoría

## No tocar

- iCal estable
- PDFs admin estables
- Caja multimoneda estable
- Abonos históricos
- ROI
- RRHH
- Inventario
- Firebase base

## Checklist de validación manual

1. Crear reserva como vendedor en activo propio.
2. Ver reserva en dashboard admin.
3. Confirmar caja por método real.
4. Confirmar CxC si queda saldo.
5. Confirmar comisión vendedor.
6. Crear reserva como vendedor en activo aliado.
7. Confirmar CxP propietario.
8. Eliminar reserva y verificar reversa.
9. Confirmar app inicia sin error visual.
