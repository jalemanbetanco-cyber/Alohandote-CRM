# V223.5.2.4 Hotfix Botón Guardar Movimiento ERP

Alcance quirúrgico:
- Corrige exclusivamente el botón Guardar movimiento en Administración ERP.
- El botón ahora ejecuta directamente saveGeneralExpense mediante onClick, sin depender únicamente del submit nativo del formulario.
- Se elimina el bloqueo silencioso por concepto vacío usando descripción segura por defecto: Gasto operativo / Ingreso operativo / Pago aliado.
- Conserva el flujo estable de CxP aliados, Bs, Zelle, USDT, efectivo, dashboards, reservas, abonos, iCal y PDFs.

Validado:
- npm run production:check
- npm run build
