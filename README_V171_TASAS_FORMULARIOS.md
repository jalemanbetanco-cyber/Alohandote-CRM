# V171 · Tasas en formularios corregidas

Corrección enfocada en el problema reportado por Jose:

- Cotizadores Renta Car y Alojamientos usan EURO BCV fijo operativo: **680,08 Bs**.
- Recibo RRHH usa $ BCV fijo operativo: **587,40 Bs**.
- Se ignora cache de tasas de versiones anteriores para evitar que el formulario tome valores viejos.
- `/api/rates` responde los mismos valores fijos para que local, preview y producción muestren lo mismo.
- Se mantiene `LOCAL_STORAGE_VERSION = v171` para seguir probando caja limpia.

## Prueba obligatoria

1. Abrir nueva reserva Renta Car.
2. Ver tasa EURO = 680,08.
3. Servicio 100 USD debe calcular 68.008,00 Bs.
4. Abrir nueva reserva Alojamientos.
5. Ver tasa EURO = 680,08.
6. Abrir RRHH / recibo de pago.
7. Ver $ BCV = 587,40.

