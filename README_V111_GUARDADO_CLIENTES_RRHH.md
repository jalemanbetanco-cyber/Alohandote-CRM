# V111 - Guardado robusto, autocompletar clientes y recibo RRHH

## 1. Corrección error al guardar reservas
Se corrige un error interno que podía bloquear el guardado de reservas Renta Car al calcular montos de abono equivalentes.

También se reforzó la carga de archivos:
- Si Firebase Storage falla o no tiene permisos, el sistema no bloquea el guardado.
- Guarda una referencia local del archivo con advertencia.
- El registro principal de reserva sí puede guardarse.

Esto evita el mensaje genérico:
"No se pudo guardar. Revisa Firebase Storage, las reglas de seguridad o la conexión."

## 2. Recibo RRHH sin fecha de salida
El recibo PDF de pago RRHH ya no muestra:
- Fecha de salida o término

Se mantiene:
- Fecha de ingreso
- Periodo semanal
- Sueldo semanal USD
- Tasa $USD BCV
- Total Bs
- Firmas

## 3. Autocompletar cliente registrado
Al crear o editar cotización/reserva:
- Renta Car
- Alojamientos

El sistema busca clientes registrados en clientLeads por:
- Nombre
- Cédula / identificación
- Teléfono

Si encuentra coincidencia, completa:
- Nombre
- C.I.
- Teléfono
- Ciudad / dirección
- Canal

## 4. Fecha de creación
Se conserva la lógica:
- Una cotización/reserva nueva fija createdAt / creationDate del día de creación.
- Al editar, no se cambia la fecha inicial.
- Se actualiza updatedAt como fecha de modificación.
