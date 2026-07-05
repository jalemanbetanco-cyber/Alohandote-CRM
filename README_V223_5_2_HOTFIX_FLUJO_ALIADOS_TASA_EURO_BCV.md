# V223.5.2 — Hotfix Flujo Aliados + Tasa Euro BCV

## Objetivo
Corregir quirúrgicamente el flujo financiero de activos aliados y unificar la tasa Euro BCV usada en Registrar movimiento con la tasa del cotizador.

## Cambios aplicados

1. **Caja de reservas aliadas**
   - Al crear una reserva sobre activo aliado, la caja ahora registra el monto total realmente recibido.
   - Ya no se reduce el ingreso inicial aplicando automáticamente el porcentaje/monto de ganancia del activo.

2. **CxP de activos aliados**
   - La CxP nace por el total de la reserva.
   - La ganancia Alohandote se define al editar/liquidar la CxP.
   - Al guardar la CxP, el monto a pagar al aliado se calcula como:

   ```text
   Monto aliado = Total reserva - Ganancia Alohandote
   ```

3. **Pago al aliado**
   - Al marcar la CxP como pagada, se descuenta de caja solo el monto que corresponde al aliado.
   - La ganancia Alohandote queda preservada dentro de caja.

4. **Tasa Euro BCV**
   - Registrar movimiento usa la misma lógica de tasa Euro BCV del cotizador.
   - Se mantiene el nombre interno `bcvDollarRate` por compatibilidad histórica, pero el valor usado en el formulario ERP es la tasa Euro BCV.

## Módulos no modificados
- iCal
- PDFs
- roles
- abonos
- reservas propias
- logística
- dashboards visuales estabilizados

## Validación ejecutada

```bash
npm run production:check
npm run build
```

Ambos comandos pasaron correctamente.
