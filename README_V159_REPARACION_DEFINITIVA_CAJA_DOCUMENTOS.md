# V159 - Reparación definitiva Caja + Devoluciones + Documentos

## Objetivo
Corregir definitivamente los hallazgos reportados en V157/V158:

1. Compra de $ no descontaba Bs de caja disponible.
2. Venta de $ no sumaba Bs a caja disponible.
3. Caja Bs mostraba balances imposibles o negativos por doble castigo de anulaciones/devoluciones.
4. Cotización, contrato, recibo y catálogos abrían pestaña en blanco.

## Correcciones aplicadas

### Caja real en Bs
- La caja real ahora toma los ingresos efectivamente recibidos aunque luego la reserva sea anulada.
- La devolución se descuenta una sola vez, evitando doble castigo.
- Compra de $ descuenta Bs de caja disponible y suma USD al método seleccionado.
- Venta de $ suma Bs a caja disponible y descuenta USD del método seleccionado.
- La caja disponible se protege visualmente contra saldos negativos y conserva una advertencia de revisión cuando los movimientos dejan caja negativa.

### Devoluciones
- Si el método de devolución es Bs, el formulario ahora solicita `Monto a devolver Bs`.
- Si el método de devolución es Zelle/Efectivo/USDT, solicita `Monto a devolver $`.
- Se guardan tres valores: `refundAmount` en USD equivalente, `refundAmountBs` en Bs reales y `refundRawAmount` como monto escrito por el usuario.
- Se agregó compatibilidad con registros antiguos donde el monto Bs pudo haberse guardado en el campo USD.

### Documentos y catálogos
- Se reemplazó la apertura con Blob URL por escritura directa segura en la nueva pestaña usando `document.write` controlado.
- Si el navegador bloquea la ventana, se descarga un HTML imprimible como fallback.
- Aplica a cotización, contrato, recibo, catálogo de renta car y catálogo de alojamientos.

## Validación ejecutada

Comando ejecutado:

```bash
npm run production:check
```

Resultado:

```txt
GO técnico: validaciones estáticas de producción aprobadas.
```

## Validación pendiente en equipo del usuario

El build real requiere instalar dependencias porque el entorno donde se generó este ZIP no tiene `node_modules` ni `vite` instalado:

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

## Prueba obligatoria

1. Compra de 100$ a tasa 100 Bs:
   - USD método seleccionado sube +100$.
   - Caja Bs baja -10.000 Bs.

2. Venta de 100$ a tasa 105 Bs:
   - USD método seleccionado baja -100$.
   - Caja Bs sube +10.500 Bs.

3. Anulación con devolución en Bs:
   - El campo debe decir `Monto a devolver Bs`.
   - Caja Bs debe bajar exactamente el monto Bs escrito, no multiplicarlo otra vez por la tasa.

4. Anulación con devolución en $:
   - El campo debe decir `Monto a devolver $`.
   - Caja USD del método debe bajar en dólares.

5. Cotización, contrato, recibo y catálogos:
   - Deben abrir con contenido.
   - No deben quedar en blanco.
   - Deben permitir imprimir/guardar PDF desde el navegador.

## Nota importante
Esta versión no debe reemplazar producción directamente. Debe probarse primero en local y luego en Vercel Preview.
