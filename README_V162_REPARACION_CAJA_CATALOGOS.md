# V162 - Reparación caja, compra/venta de divisas y catálogo Renta Car

## Cambios aplicados

1. Caja Bs saneada con ledger operativo:
   - Los ingresos reales en Bs forman el saldo disponible.
   - Los egresos Bs heredados o imposibles de cubrir no destruyen la caja principal.
   - Los egresos omitidos quedan en alertas de calidad de datos para depuración.

2. Compra de dólares:
   - Compra = entra USD al método seleccionado + sale Bs de caja.
   - La validación usa el saldo real disponible en Bs, no un cálculo contaminado por egresos heredados.

3. Venta de dólares:
   - Venta = sale USD del método seleccionado + entra Bs a caja.
   - Mantiene validación de saldo en el método USD seleccionado.

4. Dashboard de caja:
   - Ya no se muestran equivalentes USD falsos debajo de cajas Bs.
   - El texto de caja se actualizó para evitar confusión.

5. Catálogos:
   - El catálogo ya no abre una ventana emergente.
   - Se genera en la misma pestaña.
   - El catálogo Renta Car usa la misma estructura visual mobile-first del catálogo de alojamientos.

## Comandos de prueba

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
npm run dev
```

## Prueba funcional mínima

1. Verificar que el egreso excesivo desaparece del resumen principal si no tiene saldo Bs que lo respalde.
2. Registrar compra de $ con saldo Bs disponible.
3. Registrar venta de $ con saldo USD disponible.
4. Generar catálogo de alojamiento y Renta Car: deben abrir en la misma pestaña y con estructura mobile-first.
