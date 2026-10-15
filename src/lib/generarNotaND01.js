import jsPDF from "jspdf";

export async function generarNotaND01PDF(formData, tipoTramite, imagenesAdjuntas) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // --- ENCABEZADO INSTITUCIONAL ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MINISTERIO DE EDUCACIÓN", 15, y);
  y += 5;
  doc.text("DIRECCIÓN GENERAL DE EDUCACIÓN SECUNDARIA", 15, y);
  y += 5;
  doc.text("COLEGIO SECUNDARIO PROVINCIAL «PBRO. VIRGILIO CARLOS FERREYRA»", 15, y);
  doc.text("ANILLACO — LA RIOJA", pageWidth - 15, y, { align: "right" });
  
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);

  // --- DATOS DE LA NOTA DE ELEVACIÓN ---
  y += 10;
  doc.setFontSize(11);
  doc.text(`NOTA N.° ${formData.numeroNota}`, pageWidth - 15, y, { align: "right" });
  y += 6;
  doc.text(`ANILLACO, ${formData.fechaEmision.split("-").reverse().join("/")}`, pageWidth - 15, y, { align: "right" });

  y += 10;
  doc.text("SEÑORA", 15, y);
  y += 5;
  doc.text(`SUPERVISORA ${formData.zona}`, 15, y);
  y += 5;
  doc.text(formData.supervisora, 15, y);
  y += 5;
  doc.text("SU DESPACHO", 15, y);

  // --- CUERPO DEL TEXTO ---
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let textoMotivo = "";
  if (tipoTramite === "alta") {
    textoMotivo = `Tengo el agrado de dirigirme a Ud. a los fines de elevar adjunto ALTA de la Profesora suplente: ${formData.apellidoNombreAgente} - D.N.I: ${formData.dniAgente}. Se envía documentación para su registro correspondiente:\n\n` +
      `• ${formData.espacioCurricular} - ${formData.cursoDivision} - ${formData.cantidadHoras}.\n` +
      `• En reemplazo de: ${formData.docenteReemplazado} (${formData.motivoLicencia}).`;
  } else if (tipoTramite === "continuidad") {
    textoMotivo = `Tengo el agrado de dirigirme a Ud. a los fines de informar la CONTINUIDAD DE SUPLENTE del Profesor/a: ${formData.apellidoNombreAgente} D.N.I: ${formData.dniAgente}, desde el ${formData.fechaInicioLicencia} hasta el ${formData.fechaFinLicencia}, código ${formData.codigoLicencia}. Se envía documentación:\n\n` +
      `• ${formData.espacioCurricular} - ${formData.cursoDivision} - ${formData.cantidadHoras}.\n` +
      `• Suplente del agente: ${formData.docenteReemplazado}.`;
  } else {
    textoMotivo = `Tengo el agrado de dirigirme a Ud. a los fines de informar la BAJA / CESE de servicios del agente: ${formData.apellidoNombreAgente} - D.N.I: ${formData.dniAgente} en el cargo de ${formData.espacioCurricular}.`;
  }

  const splitText = doc.splitTextToSize(textoMotivo, pageWidth - 30);
  doc.text(splitText, 15, y);

  y += splitText.length * 6 + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Se adjunta planilla ND-01 y documentación respaldatoria.", 15, y);

  // --- FIRMA Y SELLO ---
  y += 30;
  doc.text("Lic. Sandra De La Fuente", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text("Rectora", pageWidth / 2, y, { align: "center" });

  // --- PÁGINAS ADJUNTAS (IMÁGENES DE RESPALDO) ---
  if (imagenesAdjuntas && imagenesAdjuntas.length > 0) {
    imagenesAdjuntas.forEach((imgBase64, index) => {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`ANEXO RESPALDATORIO N.° ${index + 1} - DOCUMENTACIÓN ADJUNTA`, 15, 20);
      
      try {
        doc.addImage(imgBase64, "JPEG", 15, 30, pageWidth - 30, 230);
      } catch (err) {
        console.error("Error al añadir imagen al PDF:", err);
      }
    });
  }

  // Devolver el objeto PDF listo para guardar o descargar
  return doc;
}