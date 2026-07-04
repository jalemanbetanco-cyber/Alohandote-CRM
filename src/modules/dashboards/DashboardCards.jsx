export function DashboardKpi({ icon: Icon, label, value }) {
  return (
    <div>
      {Icon ? <Icon size={18} /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function DashboardActionCard({ label, value, onClick }) {
  return (
    <button type="button" className="analytics-card-button" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  )
}

export function DashboardMaintenanceDetail({ rows = [], selectedId = '', onSelect, formatShortDate, money }) {
  if (!rows.length) return null
  const activeId = selectedId || rows[0]?.id || ''
  const item = rows.find((row) => row.id === activeId)
  return (
    <section className="document-box dashboard-maintenance-detail">
      <label>
        Próximo mantenimiento
        <select value={activeId} onChange={(event) => onSelect(event.target.value)}>
          {rows.map((row) => (
            <option key={row.id} value={row.id}>
              {formatShortDate(row.startDate)} · {row.maintenanceType || 'Mantenimiento'} · {money(row.maintenanceCost || row.amount || 0)}
            </option>
          ))}
        </select>
      </label>
      {item ? <small>{item.note || item.notes || item.customerName || 'Sin detalle registrado'} · {formatShortDate(item.startDate)} - {formatShortDate(item.endDate)}</small> : null}
    </section>
  )
}
