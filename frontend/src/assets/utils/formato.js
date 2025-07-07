export function formatearPrecio(valor) {
  const numero = Number(valor);  // convierte a número por si viene como string
  if (isNaN(numero)) return valor;  // si no se puede convertir, devuelve tal cual
  return numero.toLocaleString('es-CL');
}

