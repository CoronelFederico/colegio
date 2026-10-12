import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function generarPDFSinide(datosAlumno) {
  const doc = new jsPDF();
  const dniLimpio = String(datosAlumno.dni || "").replace(/\D/g, "");
  
  // Contenido certificado que contendrá el QR del SInIDE (Datos de validación del sistema)
  const textoValidacionQR = `ESTADO: VALIDADO Y COMPLETADO\nSISTEMA SInIDE - VCF\nALUMNO: ${(datosAlumno.apellido || "").toUpperCase()}, ${datosAlumno.nombre || ""}\nDNI: ${datosAlumno.dni || "---"}\nFECHA: ${new Date().toLocaleDateString("es-AR")}\nESTABLECIMIENTO: Colegio Provincial Pbro. Virgilio Carlos Ferreyra`;

  // 1. Código QR con el texto de validación del sistema
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(textoValidacionQR, { margin: 1, width: 100 });
  } catch (e) {
    console.error("Error al generar QR SInIDE:", e);
  }

  // 2. Logo institucional
  try {
    const img = new Image();
    img.src = "/logo.png";
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    if (img.complete && img.naturalWidth !== 0) {
      doc.addImage(img, "PNG", 12, 8, 22, 22);
    }
  } catch (e) {
    console.warn("Logo no cargado:", e);
  }

  // Encabezado Oficial
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("COLEGIO SECUNDARIO PROVINCIAL PBRO. VIRGILIO CARLOS FERREYRA", 38, 13);
  
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Anillaco - Castro Barros - La Rioja | Tel: 3804202030 | Email: colegioanillaco2021@gmail.com", 38, 18);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("COMPROBANTE DE LEGAJO DIGITAL SInIDE - VALIDADO", 38, 25);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de Emisión y Validación: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}`, 120, 32);

  doc.setLineWidth(0.4);
  doc.line(10, 35, 200, 35);

  let y = 42;

  // --- SECCIÓN 1: DATOS DEL ESTUDIANTE ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("1. DATOS PERSONALES DEL ESTUDIANTE (SInIDE)", 12, y + 4.5);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const nombreCompleto = `${datosAlumno.apellido ? datosAlumno.apellido.toUpperCase() : ""}, ${datosAlumno.nombre || ""}`;
  doc.text(`Apellido y Nombre: ${nombreCompleto}`, 12, y);
  doc.text(`D.N.I. N°: ${datosAlumno.dni || "---"}`, 130, y);
  y += 5;

  doc.text(`CUIL Estudiante: ${datosAlumno.cuil || "---"}`, 12, y);
  doc.text(`Fecha Nacimiento: ${datosAlumno.fechaNacimiento || "---"}`, 85, y);
  doc.text(`Sexo: ${datosAlumno.sexo || "---"}`, 150, y);
  y += 5;

  doc.text(`País / Prov. / Loc. Nac.: ${datosAlumno.paisNacimiento || "Argentina"}, ${datosAlumno.provinciaNacimiento || "La Rioja"}, ${datosAlumno.localidadNacimiento || "La Rioja"}`, 12, y);
  y += 5;

  doc.text(`Teléfono Estudiante: ${datosAlumno.telefonoEstudiante || "---"} (${datosAlumno.tipoTelefono || "Celular"})`, 12, y);
  y += 7;

  // --- SECCIÓN 2: DOMICILIO ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.text("2. DOMICILIO Y RESIDENCIA HABITUAL", 12, y + 4.5);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.text(`Tipo de Domicilio: ${datosAlumno.tipoDomicilio || "Urbano"} | C.P.: ${datosAlumno.codigoPostal || "---"}`, 12, y);
  doc.text(`Barrio: ${datosAlumno.domicilioBarrio || "---"}`, 120, y);
  y += 5;

  doc.text(`Calle y Número: ${datosAlumno.domicilioCalleNumero || "---"}`, 12, y);
  doc.text(`Localidad / Prov.: ${datosAlumno.domicilioLocalidad || "La Rioja"}, ${datosAlumno.domicilioProvincia || "La Rioja"}`, 120, y);
  y += 7;

  // --- SECCIÓN 3: SALUD Y DATOS ANTROPOMÉTRICOS ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.text("3. SALUD Y DATOS ANTROPOMÉTRICOS", 12, y + 4.5);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.text(`Obra Social: ${datosAlumno.obraSocialPosee || "Posee"} (${datosAlumno.obraSocialNombre || "---"})`, 12, y);
  doc.text(`N° Afiliado: ${datosAlumno.numeroAfiliado || "---"}`, 120, y);
  y += 5;

  doc.text(`Teléfono Emergencia: ${datosAlumno.telefonoEmergencia || "---"}`, 12, y);
  doc.text(`Presión: ${datosAlumno.presionArterial || "---"} | Antropom.: ${datosAlumno.datosAntropometricos || "---"}`, 90, y);
  y += 7;

  // --- SECCIÓN 4: TUTOR LEGAL ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.text("4. DATOS DEL TUTOR / RESPONSABLE LEGAL", 12, y + 4.5);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.text(`Nombre y Apellido: ${datosAlumno.tutorApellido || ""}, ${datosAlumno.tutorNombre || ""}`, 12, y);
  doc.text(`CUIL / DNI Tutor: ${datosAlumno.tutorCuil || "---"}`, 120, y);
  y += 5;

  doc.text(`Parentesco: ${datosAlumno.tutorParentesco || "---"} | Nivel Educativo: ${datosAlumno.tutorNivelEducativo || "---"}`, 12, y);
  y += 5;

  doc.text(`Teléfono: ${datosAlumno.tutorTelefono || "---"} (WhatsApp: ${datosAlumno.recibeWhatsapp || "SI"})`, 12, y);
  doc.text(`Correo Electrónico: ${datosAlumno.tutorEmail || "---"}`, 115, y);
  y += 7;

  // --- SECCIÓN 5: INCLUSIÓN Y EXTRAS ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.text("5. DATOS COMPLEMENTARIOS E INCLUSIÓN", 12, y + 4.5);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.text(`Discapacidad (CUD): ${datosAlumno.discapacidad || "No"} ${datosAlumno.tipoDiscapacidadCUD ? `(${datosAlumno.tipoDiscapacidadCUD})` : ""}`, 12, y);
  doc.text(`Docente Integrador: ${datosAlumno.docenteIntegrador || "NO"}`, 120, y);
  y += 5;

  doc.text(`Pueblo Indígena: ${datosAlumno.puebloIndigena || "NO"} | Encierro: ${datosAlumno.contextoEncierro || "No"} | Becas: ${datosAlumno.beneficiosBecas || "No"}`, 12, y);
  y += 8;

  // Declaración Jurada
  doc.setFillColor(254, 243, 199);
  doc.rect(10, y, 190, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("DECLARACIÓN JURADA DE VERACIDAD DE DATOS (SInIDE) - VALIDADO:", 12, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("El presente documento posee validez oficial con firma digital/QR certificando que el legajo digital SInIDE se encuentra", 12, y + 8);
  doc.text("completado, validado y aprobado en el Sistema del Colegio Provincial Pbro. Virgilio Carlos Ferreyra.", 12, y + 12);

  y += 18;

  // --- QR Y FIRMAS ---
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 12, y, 26, 26);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("QR DE VALIDACIÓN SInIDE", 11, y + 29);
    doc.text("ESTADO: APROBADO", 12, y + 32);
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  doc.line(55, y + 18, 105, y + 18);
  doc.text("Firma del Padre / Tutor Legal", 60, y + 22);

  doc.line(135, y + 18, 185, y + 18);
  doc.text("Firma y Sello Secretaría Escolar", 137, y + 22);

  doc.save(`Comprobante_SInIDE_Validado_${dniLimpio}.pdf`);
}