# V206 · Documentos Alohandote + Alojamientos aliados

## Objetivo

Implementar el ajuste solicitado sin alterar la base estable V200/V201/V203: documentos PDF con identidad Alohandote y clasificación de alojamientos como Propio o Aliado, separando ingreso real Alohandote y cuenta por pagar al propietario.

## Cambios incluidos

### 1. Documentos PDF

- Recibos y cotizaciones vuelven a mostrar el logo de Alohandote en el encabezado.
- Se agrega bloque de contacto minimalista en la parte inferior izquierda:
  - 📸 @alohandote
  - 📱 04248639102
  - ✉️ ventas@alohandote.com

### 2. Catálogo / formulario de alojamiento

- Se agrega tipo de alojamiento:
  - Propio
  - Aliado
- Si es Aliado, se puede indicar:
  - Propietario / aliado
  - Modelo de ganancia Alohandote: monto fijo o porcentaje
  - Valor de ganancia

### 3. Reservas de alojamiento aliado

- Al seleccionar un alojamiento aliado, el formulario muestra la sección de ingreso real.
- El sistema calcula:
  - Total cobrado al cliente
  - Ingreso real Alohandote
  - Por pagar al propietario

### 4. Caja y cuentas por pagar

- Para alojamientos propios, la caja sigue funcionando igual.
- Para alojamientos aliados, la caja usa el ingreso real de Alohandote.
- La parte del propietario se registra como cuenta por pagar automática y no descuenta caja hasta marcarse como Pagado.

## Alcance protegido

No se modificó:

- iCal Airbnb / Estei
- Tasas BCV
- Abonos históricos V201
- Kilometraje
- ROI vehículos
- Mantenimiento
- RRHH
- Inventario
- Firebase Rules
- Documentos overlay V200

## Validaciones ejecutadas

- npm run production:check
- npm run release:preflight
- npm run build

Resultado: aprobado.
