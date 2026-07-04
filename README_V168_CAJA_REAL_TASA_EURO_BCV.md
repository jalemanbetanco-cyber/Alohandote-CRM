# Alohandote V168 · Caja real + tasa EURO BCV reforzada

## Objetivo
Corregir dos bloqueantes detectados en la prueba Go-Live:

1. Las cuentas por cobrar no deben sumarse a la caja disponible.
2. La tasa EURO BCV debe integrarse de forma robusta para que el cotizador calcule bolívares automáticamente.

## Cambios aplicados

### Caja disponible
- La caja disponible queda calculada únicamente con dinero efectivamente cobrado.
- Las cuentas por cobrar quedan separadas en su propio indicador y tabla.
- Un pago en Bs sin tasa disponible ya no se interpreta como si fueran USD.
- Si la tasa no existe, la cuenta pendiente no se cierra en falso en 0.

### Tasa EURO BCV
- `/api/rates` consulta primero `https://www.bcv.org.ve/`.
- Si BCV no responde o cambia su HTML, usa API pública de respaldo de Euro Oficial BCV.
- Se agregó respaldo de referencia BCV publicada por Mercantil para mantener continuidad operativa.
- En local sigue disponible fallback por `.env`, pero solo como último recurso.

## Prueba obligatoria
1. Abrir el cotizador de Renta Car.
2. Verificar que Tasa EURO cargue.
3. Confirmar que `Costo en BS = costo servicio USD x tasa EURO`.
4. Crear una reserva parcial en Bs.
5. Verificar que Caja disponible no sume el monto pendiente.
6. Verificar que Por cobrar muestre el saldo pendiente.

## Variables opcionales de emergencia
```env
VITE_FALLBACK_EUR_BCV=
VITE_FALLBACK_USD_BCV=
```

No usar fallback como regla de producción; solo ante caída temporal de proveedores externos.
