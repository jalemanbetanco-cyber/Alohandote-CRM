# Informe Ejecutivo V163

Estado: candidato a prueba local / preview.

## Corrección principal
La devolución en Bs ahora afecta caja aunque no exista equivalente USD, porque el filtro de devoluciones considera `refundAmountBs` y `refundRawAmount`, no solo `refundAmount`.

## ROI
El módulo de ROI ahora queda conectado tanto con renta car como con alojamientos. La exportación incluye vehículos, reservas y alojamientos.

## Tasas
Administración ERP muestra EURO BCV, USD BCV y USDT/mercado, con botón de actualización. En Vercel consulta `/api/rates`; en local permite fallback por `.env`.

## Recomendación
Probar antes de avanzar a GO LIVE:
- Anulación con devolución Bs.
- ROI de alojamientos y vehículos.
- Tasas en preview de Vercel.
