# V158 · Reparación real caja de divisas y documentos

## Cambios aplicados

1. Compra de $ ahora afecta la caja disponible en Bs:
   - Suma USD al método seleccionado (Zelle, Efectivo $, Binance).
   - Resta Bs de la caja Bs disponible.

2. Venta de $ ahora afecta la caja disponible en Bs:
   - Resta USD del método seleccionado.
   - Suma Bs a la caja Bs disponible.

3. Caja Bs ya no se interpreta como dólares:
   - El monto principal muestra Bs.
   - El equivalente en USD queda identificado como referencial.

4. Cotización, contrato y recibo:
   - Se reemplazó document.write por carga de HTML mediante Blob URL.
   - Se agregó base URL para que logo y firma funcionen desde pestañas/documentos generados.
   - Evita pestañas emergentes en blanco por bloqueo de escritura del navegador.

## Validación

Ejecutar:

```bash
npm install --legacy-peer-deps
npm run production:check
npm run build
npm run dev
```

## Pruebas manuales obligatorias

- Compra de 100$ a tasa 100: Zelle +100$, Bs -10.000 Bs.
- Venta de 100$ a tasa 105: Zelle -100$, Bs +10.500 Bs.
- Caja disponible debe cambiar en Bs.
- La caja Bs no debe mostrar símbolo $.
- Cotización debe abrir con contenido.
- Contrato debe abrir con contenido.
- Recibo debe abrir con contenido.
