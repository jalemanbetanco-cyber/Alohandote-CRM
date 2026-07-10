# Informe Ejecutivo V161

Estado: candidata a prueba local / Vercel Preview.

La V161 corrige dos problemas de fondo detectados en pruebas reales:

1. La interfaz mostraba equivalentes USD irreales para cajas en Bs. Ahora las cajas en Bs se presentan solo en Bs.
2. La compra/venta de divisas ahora valida saldo antes de guardar y registra movimientos firmados de caja.

Criterio GO LIVE: no aprobar hasta que Jose valide en preview:
- Compra de $ con saldo Bs suficiente.
- Venta de $ con saldo USD suficiente.
- Bloqueo correcto cuando no hay saldo.
- Documentos y catálogos no abren en blanco.
