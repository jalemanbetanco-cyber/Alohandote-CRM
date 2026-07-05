export const AUDIT_MODULES = Object.freeze({
  LODGING: 'alojamientos',
  RENTCAR: 'renta_car',
  RESERVATIONS: 'reservas',
  PAYMENTS: 'abonos',
  CASHBOX: 'caja',
  ACCOUNTS_RECEIVABLE: 'cuentas_por_cobrar',
  ACCOUNTS_PAYABLE: 'cuentas_por_pagar',
  ALLIES: 'alojamientos_aliados',
  SYSTEM: 'sistema'
})

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'crear',
  UPDATE: 'editar',
  DELETE: 'eliminar',
  CANCEL: 'anular',
  PAYMENT_CREATE: 'crear_abono',
  PAYMENT_UPDATE: 'editar_abono',
  PAYMENT_DELETE: 'eliminar_abono',
  RECEIVABLE_CREATE: 'crear_cxc',
  PAYABLE_CREATE: 'crear_cxp',
  CASHBOX_CHANGE: 'cambio_caja'
})

export const AUDIT_COLLECTION = 'auditLogs'
export const AUDIT_VERSION = 'V214'
