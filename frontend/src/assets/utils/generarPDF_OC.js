import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../img/AlumceLogo.jpg'; // Ajusta el path si lo mueves

export const generarPDF_OC = ({ numeroOC, proveedor, fecha, realizadoPor, clienteNombre, presupuestoNumero, items, totales, comentario }) => {
  const doc = new jsPDF();
  const img = new Image();
  img.src = logo;

  img.onload = () => {
    doc.addImage(img, 'JPEG', 10, 10, 40, 20);

    doc.setFontSize(12);
    doc.text(`ORDEN DE COMPRA N° ${numeroOC}`, 150, 15, { align: 'right' });
    doc.text(`Fecha: ${fecha}`, 150, 22, { align: 'right' });

    doc.setFontSize(10);
    doc.text('ALUMCE - Ruta D-43 N°4815, Pan de Azúcar, Coquimbo', 10, 35);
    doc.text('RUT: 76.136.919-9', 10, 40);
    doc.text('Mail: adquisiciones@alumce.cl', 10, 45);

    doc.setFontSize(11);
    doc.text('PROVEEDOR', 10, 60);
    doc.setFontSize(10);
    doc.text(`Nombre: ${proveedor}`, 10, 65);
    doc.text(`Realizado por: ${realizadoPor}`, 10, 70);

    doc.text(`Cliente: ${clienteNombre}`, 10, 80);
    doc.text(`Presupuesto: ${presupuestoNumero}`, 10, 85);

    autoTable(doc, {
      startY: 95,
      head: [['Código', 'Producto', 'Cantidad', 'Precio Unitario', 'Total']],
      body: items.map(i => [
        i.codigo,
        i.producto,
        i.cantidad,
        `$${parseInt(i.precio_unitario).toLocaleString()}`,
        `$${(i.cantidad * i.precio_unitario).toLocaleString()}`
      ]),
    });

    const finalY = doc.previousAutoTable.finalY;

    doc.setFontSize(11);
    doc.text(`TOTAL NETO: $${totales.neto.toLocaleString()}`, 140, finalY + 10, { align: 'right' });
    doc.text(`IVA 19%: $${totales.iva.toLocaleString()}`, 140, finalY + 17, { align: 'right' });
    doc.text(`TOTAL: $${totales.total.toLocaleString()}`, 140, finalY + 24, { align: 'right' });

    if (comentario) {
      doc.text('Comentario:', 10, finalY + 35);
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(comentario, 180), 10, finalY + 40);
    }

    doc.setFontSize(10);
    doc.text('_________________________', 10, finalY + 60);
    doc.text('Realizado por', 10, finalY + 65);
    doc.text(realizadoPor, 10, finalY + 70);

    doc.text('_________________________', 140, finalY + 60);
    doc.text('Autorizado por', 140, finalY + 65);

    doc.save(`OC_${numeroOC}.pdf`);
  };
};
