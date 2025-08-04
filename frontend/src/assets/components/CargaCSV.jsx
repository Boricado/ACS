import React, { useState } from 'react';

const CargaCSV = ({ setDataPorCategoria }) => {
  const [archivoNombre, setArchivoNombre] = useState('');
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
      setDataPorCategoria(prev => {
        const nuevo = { ...prev };
        for (const cat in procesado) {
          if (!nuevo[cat]) nuevo[cat] = [];
          nuevo[cat] = [...nuevo[cat], ...procesado[cat]];
        }
        return nuevo;
      });
    };
    reader.readAsText(archivo, 'ISO-8859-1');
  };

  return (
    <div className="container my-4">
      <h4>Cargar archivo CSV de Pautas</h4>
      <input
        type="file"
        accept=".csv"
        className="form-control mb-3"
        onChange={handleFileChange}
      />
      {archivoNombre && <p>Archivo cargado: <strong>{archivoNombre}</strong></p>}
    </div>
  );
};

export default CargaCSV;
