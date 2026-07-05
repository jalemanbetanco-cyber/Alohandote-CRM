# V114 - Mantenimiento con mano de obra, repuestos, medio de pago y facturas

## 1. Estado del formulario de mantenimiento
Cuando el formulario es de mantenimiento, el campo Estado solo muestra:
- Mantenimiento

No permite seleccionar otros estados desde ese formulario.

## 2. Nuevos campos
En el formulario de registro de mantenimiento se agregan:
- Costo mano de obra $
- Costo repuesto $
- Medio de pago
- Facturas / fotos del mantenimiento

## 3. Medio de pago
Opciones:
- BS
- $Efectivo
- Zelle
- Usdt

## 4. Regla de caja
Al registrar mantenimiento:
- Si el medio de pago es BS, descuenta de la caja Bs el equivalente:
  Costo total USD x Tasa $BCV
- Si el medio de pago es $Efectivo, descuenta de Efectivo $
- Si el medio de pago es Zelle, descuenta de Zelle
- Si el medio de pago es Usdt, descuenta de Binance

## 5. Tasa $BCV
Para pagos en BS, el sistema usa la tasa $BCV integrada en el sistema:
- bcvDollar, si está disponible
- tasa alternativa configurada o respaldo si no está disponible

## 6. Facturas
El campo permite cargar múltiples archivos:
- JPG
- PNG
- WEBP
- HEIC / HEIF
- PDF

Los archivos quedan asociados al registro de mantenimiento.
