# V93 - Comercial unificado y reglas corregidas

## Cambios solicitados

### 1. Comercial unificado
Se reemplazan los módulos superiores separados:
- Cotizaciones
- Reservas

Por un solo módulo:
- Comercial

Dentro de Comercial se mantienen los submódulos:
- Cotizaciones
- Reservas

### 2. Búsqueda por operador
El motor de búsqueda comercial agrega el campo:
- Operador

El perfil admin puede ver cotizaciones y reservas de todos los operadores y filtrar por operador/vendedor.

### 3. Mantenimiento no se toma como reserva
El motor comercial excluye registros con status `maintenance`.
Los bloqueos de mantenimiento deben gestionarse desde el módulo Mantenimiento.

### 4. Reservas iCal no eliminables
El sistema bloquea la eliminación de reservas iCal desde Comercial y desde acciones de eliminación directa.
Para liberar iCal se debe usar la gestión propia del alojamiento:
- Eliminar bloqueos iCal
- Desvincular iCal

### 5. Se elimina Logística general
Se elimina el botón superior de Logística general para evitar duplicidad, ya que Entregas/Recepciones ahora viven dentro de:
- Renta Car
- Alojamientos

## No se modifica
- Renta Car
- Alojamientos
- Administración ERP
- Inventario ERP
- RRHH ERP
- Mantenimiento
- Rentabilidad KM / ROI
- Submódulos de Entrega/Recepción por activo
