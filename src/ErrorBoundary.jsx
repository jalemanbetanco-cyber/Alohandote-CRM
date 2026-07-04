import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Alohandote UI error boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-crash-screen">
          <section className="app-crash-card">
            <div className="app-crash-badge">Estabilidad</div>
            <h1>El sistema detectó un error visual</h1>
            <p>
              La aplicación no se cerró por completo. Recarga la pantalla y, si el error continúa,
              revisa la consola o envía captura del mensaje técnico.
            </p>
            <pre>{this.state.error?.message || 'Error no identificado'}</pre>
            <div className="app-crash-actions">
              <button type="button" onClick={() => window.location.reload()}>Recargar sistema</button>
              <button type="button" className="secondary" onClick={() => this.setState({ hasError: false, error: null })}>Intentar continuar</button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
