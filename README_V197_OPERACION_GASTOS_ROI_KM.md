# Alohandote V197 · Operación, gastos y ROI

Corrección puntual sobre V196, sin tocar iCal, cajas, reservas financieras, compra/venta de divisas, tasas BCV, mantenimiento ni reglas Firebase.

## Cambios incluidos

1. Documentos PDF: el botón **Volver a la app** intenta regresar al formulario anterior usando historial/opener y conserva una URL de retorno segura.
2. Kilometraje: al crear una reserva nueva de Renta Car toma el kilometraje actual del vehículo. Al generar contratos usa `deliveryKm` y, si no existe, usa `vehicle.currentKm`.
3. ROI: se agrega columna **Gastos vehículo** al ROI por vehículo y export Excel, separada del mantenimiento.
4. Gastos operativos: se agrega registro de gastos generales para sueldos, condominio, internet, gasolina, limpieza, operativos y administrativos.

## Reglas de gastos

- Si el gasto queda **Pagado**, entra como egreso y afecta caja según método de pago.
- Si queda **Por pagar**, aparece en cuentas por pagar y no descuenta caja hasta cambiarlo a Pagado.
- Puede asociarse a:
  - General
  - Vehículo
  - Alojamiento

## Validación recomendada

1. Generar cotización/recibo/contrato y pulsar Volver a la app.
2. Registrar recepción de vehículo con nuevo kilometraje.
3. Crear una reserva nueva y confirmar que el km de entrega refleja el km actual.
4. Crear gasto de gasolina asociado a un vehículo y revisar ROI.
5. Crear gasto de internet como General Por pagar y revisar cuentas por pagar.
6. Cambiar ese gasto a Pagado y revisar que descuente caja.
