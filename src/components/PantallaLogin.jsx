import logo from '../assets/logo-donasol.jpg'
import portada from '../assets/portada.webp'

// Marco de marca para las pantallas de entrada (inicio de jornada y PIN del
// panel): portada roja con el logo y la onda amarilla del flyer de Doña Sol.
export default function PantallaLogin({ children }) {
  return (
    <div className="login">
      <header className="login-hero" style={{ '--login-portada': `url(${portada})` }}>
        <div className="login-marca">
          <div className="login-rayos" aria-hidden="true" />
          <img src={logo} alt="Doña Sol" className="login-logo" width="293" height="215" />
        </div>
        <p className="login-lema">Siempre rinde mucho más</p>
        <svg className="login-onda" viewBox="0 0 400 48" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 34 C 140 26, 260 8, 400 2 L400 48 L0 48 Z" fill="var(--amarillo)" />
          <path d="M0 44 C 140 37, 260 20, 400 14 L400 48 L0 48 Z" fill="var(--bg)" />
        </svg>
      </header>
      <main className="login-cuerpo">{children}</main>
      <footer className="login-pie">Registro de Ventas · Doña Sol</footer>
    </div>
  )
}
