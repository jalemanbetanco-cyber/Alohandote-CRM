import React from 'react'

export default function CalendarDayGrid({ monthDays, renderDay }) {
  return (
    <div className="calendar-grid days-grid">
      {monthDays.map((date, index) => renderDay(date, index))}
    </div>
  )
}
