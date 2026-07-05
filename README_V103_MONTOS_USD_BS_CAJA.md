# V103 - Montos USD/Bs y caja por método de pago

## Objetivo
Aplicar una capa general para que el sistema pueda controlar montos en dólares y bolívares usando la Tasa EURO.

## Cambios principales

### 1. Nuevos helpers financieros
Se agregan funciones generales:
- money()
- bsMoney()
- amountBs()
- moneyDual()
- paymentBucket()

Esto permite mostrar:
- USD
- Bs
- USD / Bs

### 2. Reservas y alojamientos guardan montos en Bs
Al guardar reservas, el sistema registra:
- bcvEuroRate
- totalAmountBs
- amountBs

La regla:
- totalAmountBs = totalAmount USD x Tasa EURO
- amountBs = abono USD x Tasa EURO

### 3. Formularios de reservas/cotizaciones
En Renta Car se agrega:
- Costo en BS
- Total servicio USD / Bs
- Base por días USD / Bs

En Alojamientos ya existía Costo en BS y se refuerza almacenamiento.

### 4. Comprobantes PDF
Los comprobantes y cotizaciones muestran:
- Total en USD / Bs
- Abonado en USD / Bs
- Pendiente en USD / Bs
- Tasa EURO usada

Aplica para:
- Cotización Renta Car
- Recibo Reserva Renta Car
- Cotización Alojamientos
- Recibo Reserva Alojamientos

### 5. Dashboard Administración ERP
Se agrega resumen por método de pago:
- Efectivo $
- Zelle
- Binance
- Bs
- Sin método

Cada tarjeta muestra:
- USD / Bs
- cantidad de pagos

### 6. Caja, cuentas por cobrar, pagar y comisiones
Se refuerza visualización dual:
- Monto USD / Bs

## Nota importante
Para que los montos en Bs sean precisos, la Tasa EURO debe estar disponible al momento de crear o guardar la reserva. Si una reserva antigua no tiene tasa guardada, el sistema usa la tasa activa actual como referencia visual.
