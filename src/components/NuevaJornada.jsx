import { useState } from 'react'
import { REPARTOS, VENDEDORES } from '../config/config'
import PantallaLogin from './PantallaLogin'

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function fechaDeHoy() {
  const texto = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function GrupoOpciones({ nombre, titulo, opciones, valor, onChange, renderOpcion }) {
  return (
    <fieldset className="grupo-opciones">
      <legend>{titulo}</legend>
      <div className="opciones">
        {opciones.map((opcion) => (
          <label key={opcion} className="opcion">
            <input
              type="radio"
              name={nombre}
              value={opcion}
              checked={valor === opcion}
              onChange={() => onChange(opcion)}
              required
            />
            <span className="opcion-cara">{renderOpcion(opcion)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function NuevaJornada({ onCrear }) {
  const [reparto, setReparto] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reparto || !vendedor) return
    setEnviando(true)
    try {
      await onCrear({ nombreReparto: reparto, vendedor })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <PantallaLogin>
      <form className="tarjeta login-tarjeta" onSubmit={handleSubmit}>
        <div className="login-saludo">
          <p className="login-fecha">{fechaDeHoy()}</p>
          <h1>{saludo()}</h1>
          <p className="subtexto">Elegí el reparto y quién vende hoy para empezar la jornada.</p>
        </div>

        <GrupoOpciones
          nombre="reparto"
          titulo="Reparto"
          opciones={REPARTOS}
          valor={reparto}
          onChange={setReparto}
          renderOpcion={(r) => {
            const numero = r.replace(/\D/g, '')
            return (
              <>
                {numero ? (
                  <span className="opcion-num">{numero}</span>
                ) : (
                  <span className="opcion-lugar">{r}</span>
                )}
                <span className="opcion-etiqueta">Reparto</span>
              </>
            )
          }}
        />

        <GrupoOpciones
          nombre="vendedor"
          titulo="Vendedor"
          opciones={VENDEDORES}
          valor={vendedor}
          onChange={setVendedor}
          renderOpcion={(v) => (
            <>
              <span className="avatar" aria-hidden="true">
                {v.charAt(0)}
              </span>
              <span className="opcion-nombre">{v}</span>
            </>
          )}
        />

        <button type="submit" className="boton-login" disabled={enviando || !reparto || !vendedor}>
          {enviando ? 'Iniciando…' : 'Comenzar a vender'}
        </button>

        <p className="login-nota">Cada venta se guarda sola en la nube, aunque cierres la app.</p>
      </form>
    </PantallaLogin>
  )
}
