import React, { useState } from 'react';
import axios from 'axios';

const CargaCSV = () => {
  const [dataPorCategoria, setDataPorCategoria] = useState({});
  const [archivoNombre, setArchivoNombre] = useState('');
  const API = import.meta.env.VITE_API_URL;

  const mapaCategorias = {
    'profiles': 'perfiles',
    'reinforcement': 'refuerzos',
    'glass': 'vidrio',
    'hardware': 'herraje',
    'accessories': 'accesorios',
    'gasketandbrushes': 'gomascepillos',
    'screws': 'tornillos',
    'installationmaterials': 'instalacion',
  };

  const limpiarYProcesarCSV = (contenido) => {
    const lineas = contenido.split('\n');
    let categoriaActual = null;
    const resultados = {};

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      const partes = linea.split(';').map(x => x.trim());
      const clave = partes.join('').toLowerCase().replace(/\s+/g, '');

      if (mapaCategorias[clave]) {
        categoriaActual = mapaCategorias[clave];
        if (!resultados[categoriaActual]) resultados[categoriaActual] = [];
        continue;
      }

      if (/codigo/i.test(linea) && /nombre/i.test(linea)) continue;

      if (partes.length >= 11 && /^\d{5,}/.test(partes[4])) {
        const codigo = partes[4];
        const producto = partes[5];
        const cantidadRaw = partes[10];
        let cantidad = parseFloat((cantidadRaw || '').replace(',', '.'));

        if (categoriaActual && codigo && producto && !isNaN(cantidad)) {
          if (categoriaActual === 'perfiles' || categoriaActual === 'refuerzos') {
            cantidad = Math.ceil(cantidad / 5.8);
          } else {
            cantidad = Math.ceil(cantidad);
          }

          resultados[categoriaActual].push({
            codigo,
            producto,
            cantidad,
            cantidad_original: parseFloat((cantidadRaw || '').replace(',', '.'))
        });
        }
      }
    }

    return resultados;
  };

  const handleFileChange = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setArchivoNombre(archivo.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target.result;
      const procesado = limpiarYProcesarCSV(contenido);
      setDataPorCategoria(procesado);
    };
    reader.readAsText(archivo, 'ISO-8859-1');
  };

  const handleCantidadChange = (categoria, idx, valor) => {
    const nuevo = { ...dataPorCategoria };
    nuevo[categoria][idx].cantidad = parseInt(valor) || 0;
    setDataPorCategoria(nuevo);
  };

  const eliminarItem = (categoria, idx) => {
    const nuevo = { ...dataPorCategoria };
    nuevo[categoria].splice(idx, 1);
    setDataPorCategoria(nuevo);
  };

  const guardarTodo = async () => {
    const cliente_id = prompt('Ingrese ID del cliente:');
    const presupuesto_id = prompt('Ingrese ID del presupuesto:');
    const numero_presupuesto = prompt('Ingrese número de presupuesto:');

    if (!cliente_id || !presupuesto_id || !numero_presupuesto) {
      alert('Datos incompletos.');
      return;
    }

    try {
      for (const categoria in dataPorCategoria) {
        const payload = {
          cliente_id,
          presupuesto_id,
          numero_presupuesto,
          items: dataPorCategoria[categoria],
        };

        await axios.post(`${API}api/ot_pautas/${categoria}/lote`, payload);
      }

      alert('Carga por lote completada con éxito.');
      setDataPorCategoria({});
    } catch (error) {
      console.error('Error en carga por lote:', error);
      alert('Error en la carga por lote.');
    }
  };

  return (
    <div className="container my-4">
      <h4>Cargar archivo CSV de Pautas</h4>
      <input type="file" accept=".csv" className="form-control mb-3" onChange={handleFileChange} />
      {archivoNombre && <p>Archivo cargado: <strong>{archivoNombre}</strong></p>}

      {Object.keys(dataPorCategoria).length > 0 && (
        <>
          <button className="btn btn-success mb-3" onClick={guardarTodo}>
            Guardar TODO (por lote)
          </button>
          {Object.entries(dataPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="mb-4">
                <h5>{categoria.toUpperCase()}</h5>
                <table className="table table-sm table-bordered">
                <thead>
                    <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad Cargada</th>
                    <th>Cantidad Solicitada</th>
                    <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                    <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.codigo}</td>
                        <td>{item.producto}</td>
                        <td>{item.cantidad_original}</td>
                        <td>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            step="1"
                            value={item.cantidad}
                            onChange={(e) => {
                            const nuevaCantidad = parseInt(e.target.value, 10) || 0;
                            setDataPorCategoria(prev => {
                                const nuevos = { ...prev };
                                nuevos[categoria][idx].cantidad = nuevaCantidad;
                                return nuevos;
                            });
                            }}
                        />
                        </td>
                        <td>
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                            setDataPorCategoria(prev => {
                                const nuevos = { ...prev };
                                nuevos[categoria] = nuevos[categoria].filter((_, i) => i !== idx);
                                return nuevos;
                            });
                            }}
                        >
                            Eliminar
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            ))}

        </>
      )}
    </div>
  );
};

export default CargaCSV;
