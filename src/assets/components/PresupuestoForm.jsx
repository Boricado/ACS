import React, { useState } from 'react';
import axios from 'axios';

const PresupuestoForm = () => {
  const [presupuesto, setPresupuesto] = useState({
    numero: '',
    cliente: '',
    obra: '',
    torre: '',
    piso: '',
    modelo: '',
    departamento: '',
    direccion: '',
    observacion: '',
  });

  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({
    item: '',
    recinto: '',
    ancho: '',
    alto: '',
    apertura: '',
    gradaBuque: false,
    especial: false,
    cantidad: '',
    precio: '',
  });

  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePresupuestoChange = (e) => {
    const { name, value } = e.target;
    setPresupuesto({ ...presupuesto, [name]: value });
  };

  const handleItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoItem({
      ...nuevoItem,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const limpiarItem = () => {
    setNuevoItem({
      item: '',
      recinto: '',
      ancho: '',
      alto: '',
      apertura: '',
      gradaBuque: false,
      especial: false,
      cantidad: '',
      precio: '',
    });
    setEditIndex(null);
  };

  const agregarItem = () => {
    if (editIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editIndex] = nuevoItem;
      setItems(updatedItems);
    } else {
      setItems([...items, nuevoItem]);
    }
    limpiarItem();
  };

  const eliminarItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const editarItem = (index) => {
    setNuevoItem(items[index]);
    setEditIndex(index);
  };

  const clonarItem = (index) => {
    setItems([...items, { ...items[index] }]);
  };

  const guardarPresupuesto = async () => {
    if (!presupuesto.numero || !presupuesto.cliente) {
      setMessage({ type: 'error', text: 'Número de presupuesto y cliente son obligatorios.' });
      return;
    }
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Agrega al menos un ítem.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post('http://localhost:4000/api/presupuestos', {
        presupuesto,
        items,
      });
      setMessage({ type: 'success', text: 'Presupuesto guardado correctamente.' });
      setPresupuesto({
        numero: '', cliente: '', obra: '', torre: '', piso: '', modelo: '', departamento: '', direccion: '', observacion: ''
      });
      setItems([]);
      limpiarItem();
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar el presupuesto.' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Ingreso de Presupuesto</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <input name="numero" placeholder="Número de Presupuesto *" value={presupuesto.numero} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="cliente" placeholder="Nombre del Cliente *" value={presupuesto.cliente} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="obra" placeholder="Nombre de la obra" value={presupuesto.obra} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="torre" placeholder="Torre" value={presupuesto.torre} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="piso" placeholder="Piso" value={presupuesto.piso} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="modelo" placeholder="Modelo" value={presupuesto.modelo} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="departamento" placeholder="N° Departamento" value={presupuesto.departamento} onChange={handlePresupuestoChange} className="border p-2" />
        <input name="direccion" placeholder="Dirección" value={presupuesto.direccion} onChange={handlePresupuestoChange} className="border p-2" />
        <textarea name="observacion" placeholder="Observación" value={presupuesto.observacion} onChange={handlePresupuestoChange} className="border p-2 col-span-2" />
      </div>

      <h3 className="text-xl font-semibold mb-2">Agregar Ítem</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input name="item" placeholder="Ítem" value={nuevoItem.item} onChange={handleItemChange} className="border p-2" />
        <input name="recinto" placeholder="Recinto" value={nuevoItem.recinto} onChange={handleItemChange} className="border p-2" />
        <input name="ancho" placeholder="Medida Ancho" value={nuevoItem.ancho} onChange={handleItemChange} className="border p-2" />
        <input name="alto" placeholder="Medida Alto" value={nuevoItem.alto} onChange={handleItemChange} className="border p-2" />
        <input name="apertura" placeholder="Apertura" value={nuevoItem.apertura} onChange={handleItemChange} className="border p-2" />
        <input name="cantidad" placeholder="Cantidad" value={nuevoItem.cantidad} onChange={handleItemChange} className="border p-2" />
        <input name="precio" placeholder="Precio Unitario" value={nuevoItem.precio} onChange={handleItemChange} className="border p-2" />
        <div className="flex items-center">
          <input type="checkbox" name="gradaBuque" checked={nuevoItem.gradaBuque} onChange={handleItemChange} className="mr-2" />
          <label>Grada Buque</label>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="especial" checked={nuevoItem.especial} onChange={handleItemChange} className="mr-2" />
          <label>Especial</label>
        </div>
      </div>

      <button onClick={agregarItem} className="bg-blue-600 text-white px-4 py-2 rounded mb-6">
        {editIndex !== null ? 'Actualizar Ítem' : 'Agregar Ítem'}
      </button>

      <h3 className="text-xl font-semibold mb-2">Ítems agregados</h3>
      {items.map((item, index) => (
        <div key={index} className="border p-2 mb-2 rounded bg-gray-100">
          <p><strong>Ítem:</strong> {item.item} | <strong>Recinto:</strong> {item.recinto}</p>
          <p><strong>Medidas:</strong> {item.ancho} x {item.alto} | <strong>Apertura:</strong> {item.apertura}</p>
          <p><strong>Cantidad:</strong> {item.cantidad} | <strong>Precio Unitario:</strong> ${item.precio}</p>
          <p><strong>Grada Buque:</strong> {item.gradaBuque ? 'Sí' : 'No'} | <strong>Especial:</strong> {item.especial ? 'Sí' : 'No'}</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => editarItem(index)} className="bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
            <button onClick={() => eliminarItem(index)} className="bg-red-600 text-white px-2 py-1 rounded">Eliminar</button>
            <button onClick={() => clonarItem(index)} className="bg-green-600 text-white px-2 py-1 rounded">Clonar</button>
          </div>
        </div>
      ))}

      {message && (
        <p className={`mt-4 p-2 rounded ${message.type === 'error' ? 'bg-red-300 text-red-800' : 'bg-green-300 text-green-800'}`}>
          {message.text}
        </p>
      )}

      <button
        onClick={guardarPresupuesto}
        disabled={loading}
        className="mt-6 bg-purple-700 text-white px-6 py-3 rounded hover:bg-purple-800 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Presupuesto'}
      </button>
    </div>
  );
};

export default PresupuestoForm;
