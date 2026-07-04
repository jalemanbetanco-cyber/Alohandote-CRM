import React from 'react'

const DAYS = [
  ['Lun.', 'L'],
  ['Mar.', 'M'],
  ['Mié.', 'M'],
  ['Jue.', 'J'],
  ['Vie.', 'V'],
  ['Sáb.', 'S'],
  ['Dom.', 'D']
]

export default function CalendarWeekdays() {
  return (
    <div className="calendar-grid weekdays">
      {DAYS.map(([full, mobile]) => (
        <div key={full}>
          <span className="weekday-full">{full}</span>
          <span className="weekday-mobile">{mobile}</span>
        </div>
      ))}
    </div>
  )
}
