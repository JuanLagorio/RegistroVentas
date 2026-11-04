import { formatearMoneda } from '../lib/format'
import { fechaCorta, nombreMes } from '../lib/meses'

export default function ListaJornadas({ mes, jornadas, descargando, eliminando, onDescargar, onEliminar }) {
  const total = jornadas.reduce((acc, j) => acc + (j.totalFinal ?? 0), 0)

  return (
    <div className="admin-seccion">
      <section className="panel">
        <div className="panel-encabezado">
          <h2>Jornadas de {nombreMes(mes)}</h2>
          <span className="subtexto">
            {jornadas.length} jornada{jornadas.length === 1 ? '' : 's'} · ${formatearMoneda(total)}
          </span>
        </div>

        {jornadas.length === 0 ? (
          <p className="subtexto centrado">No hay jornadas en la lista para este mes.</p>
        ) : (
          <table className="tabla tabla-jornadas">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Reparto</th>
                <th>Vendedor</th>
                <th className="num">Total</th>
                <th className="acciones">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {jornadas.map((j) => (
                <tr key={j.id}>
                  <td data-label="Fecha">{fechaCorta(j.fecha)}</td>
                  <td data-label="Reparto">{j.nombreReparto || 'Reparto sin nombre'}</td>
                  <td data-label="Vendedor">{j.vendedor || <span className="subtexto">Sin vendedor</span>}</td>
                  <td data-label="Total" className="num total-celda">
                    ${formatearMoneda(j.totalFinal ?? 0)}
                  </td>
                  <td className="acciones">
                    <div className="acciones-fila">
                      <button
                        type="button"
                        className="boton-chico boton-chico-secundario"
                        disabled={descargando === j.id}
                        onClick={() => onDescargar(j)}
                      >
                        {descargando === j.id ? 'Generando…' : 'Descargar PDF'}
                      </button>
                      <button
                        type="button"
                        className="boton-chico boton-chico-peligro"
                        disabled={eliminando === j.id}
                        onClick={() => onEliminar(j)}
                      >
                        {eliminando === j.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total de la lista</td>
                <td className="num">${formatearMoneda(total)}</td>
                <td className="acciones" />
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  )
}
