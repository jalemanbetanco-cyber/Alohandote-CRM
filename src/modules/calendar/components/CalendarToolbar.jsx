import React from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function CalendarToolbar({
  title,
  subtitle,
  monthTitle,
  currentMonth,
  changeMonth,
  canExport = false,
  onExport,
  exportLabel = 'Exportar dashboard'
}) {
  return (
    <div className="topbar">
      <div>
        <span className="eyebrow">Calendario</span>
        <h2>{title}</h2>
        {subtitle ? <p className="vehicle-subtitle">{subtitle}</p> : null}
      </div>
      <div className="month-controls">
        <button type="button" onClick={() => changeMonth(-1)}><ChevronLeft /></button>
        <strong>{monthTitle(currentMonth)}</strong>
        <button type="button" onClick={() => changeMonth(1)}><ChevronRight /></button>
      </div>
      {canExport && (
        <div className="topbar-actions">
          <button className="secondary" type="button" onClick={onExport}>
            <Download size={16}/> {exportLabel}
          </button>
        </div>
      )}
    </div>
  )
}
