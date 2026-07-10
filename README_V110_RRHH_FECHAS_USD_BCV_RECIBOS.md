# V110 - RRHH fechas laborales, USD BCV y recibos de pago

## 1. Formulario de personal
Se agregan campos:
- Fecha de nacimiento
- Fecha de ingreso
- Fecha de salida o término
- Tasa $USD BCV oficial
- Pago semanal estimado en Bs

## 2. Tasa $USD BCV oficial
El endpoint `/api/rates` ahora intenta leer también la tasa USD oficial desde el sitio del Banco Central de Venezuela.

El endpoint devuelve:
- bcvEuro
- bcvDollar
- usdtMarket

Si USD BCV no está disponible, el sistema usa como respaldo la tasa EURO o una tasa configurada en variables de entorno:
- BCV_USD_RATE
- VITE_FALLBACK_USD_BCV

## 3. Pagos semanales
El campo de sueldo ahora se presenta como:
- Sueldo semanal $

Y calcula:
- Pago semanal estimado Bs = Sueldo semanal USD x Tasa $USD BCV

## 4. Recibo de pago
En la tabla de Personal se agrega botón:
- Recibo

El recibo incluye:
- Datos del colaborador
- Cédula
- Rol / área
- Fecha de ingreso
- Fecha de salida/término
- Periodo semanal
- Sueldo semanal USD
- Tasa $USD BCV oficial
- Total a pagar en Bs
- Espacio para firmas

## Fuente
La tasa oficial se consulta desde el sitio del Banco Central de Venezuela cuando el entorno/Vercel permite leerlo.
