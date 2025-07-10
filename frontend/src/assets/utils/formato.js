export function formatearPrecio(valor) {
  const numero = Number(valor);
  if (isNaN(numero)) return valor;

  const partes = numero.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return partes;
}
