import { useState } from 'react'
import { REPARTOS, VENDEDORES } from '../config/config'

function GrupoOpciones({ nombre, titulo, opciones, valor, onChange }) {
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
            <span>{opcion}</span>
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
    <div className="pantalla-centrada">
      <form className="tarjeta" onSubmit={handleSubmit}>
        <h1>Iniciar jornada</h1>
        <p className="subtexto">Se va a guardar cada venta automáticamente, aunque cierres esta app.</p>
        <GrupoOpciones nombre="reparto" titulo="Reparto" opciones={REPARTOS} valor={reparto} onChange={setReparto} />
        <GrupoOpciones
          nombre="vendedor"
          titulo="Vendedor"
          opciones={VENDEDORES}
          valor={vendedor}
          onChange={setVendedor}
        />
        <button type="submit" className="boton-primario" disabled={enviando || !reparto || !vendedor}>
          {enviando ? 'Iniciando…' : 'Comenzar a vender'}
        </button>
      </form>
    </div>
  )
}
