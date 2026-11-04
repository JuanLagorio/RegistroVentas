import { formatearMoneda } from '../lib/format'

export default function ResumenFinal({ jornada, ventas, total, onNuevaJornada }) {
  return (
    <div className="pantalla-centrada">
      <div className="tarjeta">
        <h1>Jornada finalizada ✅</h1>
        <p className="subtexto">
          {jornada.fecha}
          {jornada.nombreReparto ? ` · ${jornada.nombreReparto}` : ''}
          {jornada.vendedor ? ` · ${jornada.vendedor}` : ''}
        </p>
        <p className="total-final">${formatearMoneda(total)}</p>
        <p className="subtexto">{ventas.length} venta{ventas.length === 1 ? '' : 's'} registrada{ventas.length === 1 ? '' : 's'}</p>

        <button type="button" className="boton-primario" onClick={onNuevaJornada}>
          Iniciar nueva jornada
        </button>
      </div>
    </div>
  )
}
