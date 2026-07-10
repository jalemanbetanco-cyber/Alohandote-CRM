# V157 - Corrección caja divisas, documentos y catálogos mobile

## Objetivo
Corregir los hallazgos reportados durante la prueba de V156 sin alterar los módulos que ya funcionaban.

## Cambios aplicados

### 1. Caja Bs y compra/venta de divisas
- Compra de $ ahora suma la divisa comprada a la caja seleccionada y descuenta el equivalente real en Bs de la caja Bs.
- Venta de $ ahora descuenta la divisa vendida de la caja seleccionada y suma el equivalente real en Bs a la caja Bs.
- La caja Bs se muestra como Bs principal, no como USD principal.
- Se elimina la confusión visual donde un monto en bolívares podía verse como si fuera un balance en dólares.

### 2. Documentos PDF / ventanas en blanco
- Se endureció `writePrintableWindow` con fallback por Blob HTML.
- Si el navegador no permite escribir en la pestaña emergente, se abre el documento por URL temporal segura.
- Las cotizaciones ya no quedan en blanco si falla el guardado del lead/comercial; el documento se genera igual y se registra el aviso en consola.

### 3. Catálogos PDF en una sola página
- Catálogo de alojamientos ajustado a formato mobile/vertical 108mm x 192mm.
- Catálogo de renta car mantiene proporción mobile y una sola página.
- Se redujeron espacios, tipografías y chips para mejorar proporción en celulares.
- Se conserva botón de WhatsApp y botón imprimir/guardar PDF.

## Validaciones ejecutadas

```bash
npm run production:check
```

Resultado: aprobado.

Pendiente de validar en tu equipo/Vercel:

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

En este entorno el build no pudo ejecutarse porque `vite` no está instalado en `node_modules`.

## Pruebas manuales recomendadas
1. Registrar compra de $ con caja Zelle/Efectivo/USDT y confirmar que la caja Bs baja.
2. Registrar venta de $ y confirmar que la caja Bs sube y la caja USD baja.
3. Revisar que la caja Bs se vea como Bs, no como $.
4. Generar cotización, contrato y recibo en Renta Car.
5. Generar recibo/cotización en Alojamientos.
6. Generar catálogo PDF de vehículo y alojamiento desde PC y celular.
7. Guardar PDF y revisar que quede en una sola página.
