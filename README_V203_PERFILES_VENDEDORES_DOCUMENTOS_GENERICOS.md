# V203 - Perfiles de vendedores y documentos genéricos

Base: V200 congelada + mejoras aprobadas hasta V202.

## Alcance

- Perfil **Vendedor Renta Car y Alojamientos**: puede ver y operar Renta Car + Alojamientos.
- Perfil **Vendedor Alojamientos**: solo puede ver y operar Alojamientos.
- Se agrega selector de **Vendedor** en formularios de reserva/cotización Renta Car y Alojamientos.
- Vendedores no admin solo modifican reservas creadas por su usuario.
- Cotizaciones y recibos se emiten en formato genérico: sin logo Alohandote ni mensajes internos del sistema.
- Se refuerza sincronización de perfil operador/vendedor desde RRHH/Admin con coincidencia de correo normalizada.

## No tocado

No se modifican iCal, caja, tasas BCV, abonos históricos V201, kilometraje, ROI, gastos, mantenimiento, inventario, documentos overlay V200 ni reglas Firebase.

## Validación sugerida

1. Crear colaborador con perfil Vendedor Renta Car y Alojamientos. Debe ver ambos módulos.
2. Crear colaborador con perfil Vendedor Alojamientos. Debe ver solo Alojamientos.
3. Crear reserva como vendedor y confirmar campo Vendedor.
4. Intentar editar reserva de otro vendedor: debe bloquearse.
5. Generar cotización/recibo: no debe contener logo ni mensajes internos.
