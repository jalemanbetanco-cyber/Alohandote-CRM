import React from 'react'

export function ErpModuleShell({ children, className = 'calendar-panel administration-panel' }) {
  return <section className={className}>{children}</section>
}

export default ErpModuleShell
