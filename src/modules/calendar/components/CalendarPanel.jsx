import React from 'react'
import CalendarToolbar from './CalendarToolbar.jsx'
import CalendarWeekdays from './CalendarWeekdays.jsx'
import CalendarDayGrid from './CalendarDayGrid.jsx'

export default function CalendarPanel({
  title,
  subtitle,
  monthTitle,
  currentMonth,
  changeMonth,
  canExport,
  onExport,
  exportLabel,
  emptyTitle,
  emptyMessage,
  isEmpty,
  children,
  monthDays,
  renderDay
}) {
  return (
    <section className="calendar-panel">
      <CalendarToolbar
        title={title}
        subtitle={subtitle}
        monthTitle={monthTitle}
        currentMonth={currentMonth}
        changeMonth={changeMonth}
        canExport={canExport}
        onExport={onExport}
        exportLabel={exportLabel}
      />
      {isEmpty ? (
        <div className="empty-module-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {children}
          <CalendarWeekdays />
          <CalendarDayGrid monthDays={monthDays} renderDay={renderDay} />
        </>
      )}
    </section>
  )
}
