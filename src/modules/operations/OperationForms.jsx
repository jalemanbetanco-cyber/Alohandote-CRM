import { X } from 'lucide-react'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

function optionsFromPeople(people = []) {
  return people.map((name) => <option key={name} value={name}>{name}</option>)
}

export function VehicleDeliveryForm({ mode = 'modal', value, vehicles = [], operationsPeople = [], operationDetailLine, onChange, onSubmit, onCancel }) {
  if (!value) return null
  const embedded = mode === 'embedded'
  const formClassName = embedded ? 'public-reception-form embedded' : 'modal small'
  const body = <>
    <h3>Entrega de vehículo</h3>
    {operationDetailLine(value) && <section className="document-box operation-context"><strong>{value.customerName || 'Cliente'}</strong><small>{operationDetailLine(value)}</small></section>}
    {!embedded && <label>Vehículo<select value={value.vehicleId || ''} onChange={(e)=>onChange({ ...value, vehicleId:e.target.value, currentKm: vehicles.find((v)=>v.id===e.target.value)?.currentKm || '' })}>{vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>}
    <label>Responsable de entregar<select value={value.responsible || ''} onChange={(e)=>onChange({ ...value, responsible:e.target.value })}>{optionsFromPeople(operationsPeople)}</select></label>
    <div className={embedded ? '' : 'two-columns'}><label>KM salida<input type="number" min="0" value={value.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>onChange({ ...value, currentKm:e.target.value })}/></label><label>Nivel de combustible<select value={value.fuelLevel || 'Completo'} onChange={(e)=>onChange({ ...value, fuelLevel:e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label></div>
    <label>Estado general<select value={value.generalStatus || 'Bueno'} onChange={(e)=>onChange({ ...value, generalStatus:e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option></select></label>
    <div className={embedded ? '' : 'two-columns'}><label className="file-pick">Foto tablero<input type="file" accept={IMAGE_ACCEPT} onChange={(e)=>onChange({ ...value, _dashboardPhotoFile:e.target.files?.[0] || null })}/><small>{value._dashboardPhotoFile?.name || 'Odómetro / tablero'}</small></label><label className="file-pick">Foto vehículo<input type="file" accept={IMAGE_ACCEPT} onChange={(e)=>onChange({ ...value, _vehiclePhotoFile:e.target.files?.[0] || null })}/><small>{value._vehiclePhotoFile?.name || 'Exterior del vehículo'}</small></label></div>
    <label>Observación<textarea rows="3" value={value.notes || ''} onChange={(e)=>onChange({ ...value, notes:e.target.value })}/></label>
    <div className={embedded ? 'public-form-actions' : 'modal-actions'}><button type="button" className={embedded ? 'secondary full' : 'secondary'} onClick={onCancel}>{embedded ? 'Volver / cancelar' : 'Cancelar'}</button><button className={embedded ? 'primary full' : 'primary'} type="submit">Guardar entrega</button></div>
  </>
  if (embedded) return <form className={formClassName} onSubmit={onSubmit}>{body}</form>
  return <div className="modal-backdrop"><form className={formClassName} onSubmit={onSubmit}><div className="modal-header"><h3>Entrega de vehículo</h3><button type="button" onClick={onCancel}><X size={20}/></button></div>{body}</form></div>
}

export function VehicleReceptionForm({ mode = 'modal', value, selectedVehicle, vehicles = [], reservations = [], operationsPeople = [], operationDetailLine, normalizeStatus, formatShortDate, emptyVehicleCheckin, profile, user, dashboardPhotoInputRef, vehiclePhotoInputRef, onChange, onSubmit, onCancel }) {
  if (!value) return null
  const embedded = mode === 'embedded'
  const publicQuick = mode === 'publicQuick'
  const formClassName = embedded ? 'public-reception-form embedded' : publicQuick ? 'public-reception-form' : 'modal small'
  const fallback = () => emptyVehicleCheckin(selectedVehicle?.id, profile, user)
  const update = (patch) => onChange({ ...(value || fallback()), ...patch })
  const body = <>
    <h3>Recepción de vehículo</h3>
    {operationDetailLine(value) && <section className="document-box operation-context"><strong>{value.customerName || 'Cliente'}</strong><small>{operationDetailLine(value)}</small></section>}
    {!embedded && <label>Vehículo<select value={value.vehicleId || selectedVehicle?.id || ''} onChange={(e)=>update({ vehicleId: e.target.value, currentKm: vehicles.find((v)=>v.id===e.target.value)?.currentKm || '' })}>{vehicles.map((vehicle)=><option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>}
    {publicQuick ? <div className="two-columns"><label>Kilometraje recibido<input type="number" min="0" value={value.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>update({ currentKm: e.target.value })}/></label><label>Recibido por<input value={value.createdByName || ''} placeholder="Nombre del receptor" onChange={(e)=>update({ createdByName: e.target.value })}/></label></div> : <><label>Responsable de recibir<select value={value.createdByName || ''} onChange={(e)=>update({ createdByName:e.target.value })}>{optionsFromPeople(operationsPeople)}</select></label><div className={embedded ? '' : 'two-columns'}><label>Kilometraje recibido<input type="number" min="0" value={value.currentKm || ''} placeholder="Ej: 45650" onChange={(e)=>update({ currentKm: e.target.value })}/></label><label>Nivel de combustible<select value={value.fuelLevel || 'Completo'} onChange={(e)=>update({ fuelLevel: e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label></div></>}
    {publicQuick && <div className="two-columns"><label>Nivel de combustible<select value={value.fuelLevel || 'Completo'} onChange={(e)=>update({ fuelLevel: e.target.value })}><option>Completo</option><option>3/4</option><option>Medio tanque</option><option>1/4</option><option>Bajo</option></select></label><label>Estado general<select value={value.generalStatus || 'Bueno'} onChange={(e)=>update({ generalStatus: e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option><option>Requiere mantenimiento</option></select></label></div>}
    {!embedded && !publicQuick && <label>Reserva relacionada<select value={value.reservationId || ''} onChange={(e)=>update({ reservationId:e.target.value })}><option value="">Sin reserva relacionada</option>{reservations.filter((r)=>r.vehicleId===value.vehicleId && normalizeStatus(r.status)==='reserved').map((r)=><option key={r.id} value={r.id}>{r.customerName || 'Sin cliente'} · {formatShortDate(r.startDate)} - {formatShortDate(r.endDate)} · KM entrega {r.deliveryKm || 'N/D'}</option>)}</select></label>}
    {!publicQuick && <label>Estado general<select value={value.generalStatus || 'Bueno'} onChange={(e)=>update({ generalStatus: e.target.value })}><option>Bueno</option><option>Con observación</option><option>Requiere revisión</option><option>Requiere mantenimiento</option></select></label>}
    <div className={embedded ? '' : 'two-columns'}><label className="file-pick">Foto tablero<input ref={dashboardPhotoInputRef} type="file" accept={IMAGE_ACCEPT} onChange={(e)=>update({ _dashboardPhotoFile: e.target.files?.[0] || null })}/><small>{value._dashboardPhotoFile?.name || value.dashboardPhoto?.name || 'Odómetro / tablero'}</small></label><label className="file-pick">Foto vehículo<input ref={vehiclePhotoInputRef} type="file" accept={IMAGE_ACCEPT} onChange={(e)=>update({ _vehiclePhotoFile: e.target.files?.[0] || null })}/><small>{value._vehiclePhotoFile?.name || value.vehiclePhoto?.name || 'Exterior del vehículo'}</small></label></div>
    <label>Observación<textarea rows={publicQuick ? '4' : '3'} value={value.notes || ''} placeholder="Daños, limpieza, combustible, accesorios, comentarios del cliente..." onChange={(e)=>update({ notes: e.target.value })}/></label>
    {publicQuick ? <button className="primary full" type="submit">Guardar recepción</button> : <div className={embedded ? 'public-form-actions' : 'modal-actions'}><button type="button" className={embedded ? 'secondary full' : 'secondary'} onClick={onCancel}>{embedded ? 'Volver / cancelar' : 'Cancelar'}</button><button className={embedded ? 'primary full' : 'primary'} type="submit">Guardar recepción</button></div>}
  </>
  if (embedded || publicQuick) return <form className={formClassName} onSubmit={onSubmit}>{body}</form>
  return <div className="modal-backdrop"><form className={formClassName} onSubmit={onSubmit}><div className="modal-header"><h3>Recepción de vehículo</h3><button type="button" onClick={onCancel}><X size={20}/></button></div>{body}</form></div>
}

export function CleaningTaskForm({ mode = 'modal', value, accommodations = [], inventoryItems = [], operationsPeople = [], operationDetailLine, onChange, onSubmit, onCancel }) {
  if (!value) return null
  const embedded = mode === 'embedded'
  const formClassName = embedded ? 'public-reception-form embedded' : 'modal small'
  const body = <>
    <h3>Registro de limpieza</h3>
    <label>Alojamiento<input value={value.accommodationName || accommodations.find((apt)=>apt.id===value.accommodationId)?.name || ''} readOnly /></label>
    {operationDetailLine(value) && <section className="document-box operation-context"><strong>{value.customerName || 'Huésped'}</strong><small>{operationDetailLine(value)}</small></section>}
    <label>Responsable de limpieza<select value={value.responsible || ''} onChange={(e)=>onChange({ ...value, responsible:e.target.value })}>{optionsFromPeople(operationsPeople)}</select></label>
    <label className="file-pick">Foto daño / incidencia<input type="file" accept={IMAGE_ACCEPT} onChange={(e)=>onChange({ ...value, _damagePhotoFile:e.target.files?.[0] || null })}/><small>{value._damagePhotoFile?.name || 'Opcional: daño o incidencia'}</small></label>
    <div className={embedded ? '' : 'two-columns'}><label>{embedded ? 'Artículos utilizados' : 'Artículo usado'}<select value={value.inventoryItemId || ''} onChange={(e)=>onChange({ ...value, inventoryItemId:e.target.value })}><option value="">Sin consumo</option>{inventoryItems.filter((item)=>item.module === 'Alojamientos' || item.module === 'General').map((item)=><option key={item.id} value={item.id}>{item.name} · Stock {item.quantity}</option>)}</select></label><label>{embedded ? 'Cantidad utilizada' : 'Cantidad'}<input type="number" min="0" step="1" value={value.quantity || ''} onChange={(e)=>onChange({ ...value, quantity:e.target.value })}/></label></div>
    <label>Observación<textarea rows="3" value={value.notes || ''} placeholder="Daños, consumo, observaciones de limpieza..." onChange={(e)=>onChange({ ...value, notes:e.target.value })}/></label>
    <div className={embedded ? 'public-form-actions' : 'modal-actions'}><button type="button" className={embedded ? 'secondary full' : 'secondary'} onClick={onCancel}>{embedded ? 'Volver / cancelar' : 'Cancelar'}</button><button className={embedded ? 'primary full' : 'primary'} type="submit">Guardar limpieza</button></div>
  </>
  if (embedded) return <form className={formClassName} onSubmit={onSubmit}>{body}</form>
  return <div className="modal-backdrop"><form className={formClassName} onSubmit={onSubmit}><div className="modal-header"><h3>Registro de limpieza</h3><button type="button" onClick={onCancel}><X size={20}/></button></div>{body}</form></div>
}
