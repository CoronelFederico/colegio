import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function generarFichaPDF(datosAlumno, checklist) {
  const doc = new jsPDF();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://portal-virgilioferreyra.edu.ar";
  const urlValidacion = `${baseUrl}/dashboard?seccion=portal_familia&dni=${datosAlumno.dni}`;

  // 1. Código QR
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(urlValidacion, { margin: 1, width: 100 });
  } catch (e) {
    console.error("Error al generar QR:", e);
  }

  // 2. Logo institucional desde public/logo.png
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
  doc.text("SOLICITUD DE MATRÍCULA E INSCRIPCIÓN", 38, 25);

  // Folio / Libro / Matrícula
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Folio: _________   Libro: _________   Matrícula N°: _________`, 115, 32);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 160, 37);

  doc.setLineWidth(0.4);
  doc.line(10, 39, 200, 39);

  // Encabezado a la Dirección
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("A la Sra. Directora / Secretaría Escolar - Lic. Sandra de la Fuente", 10, 45);
  doc.setFont("helvetica", "normal");
  doc.text("Quien suscribe, solicita disponer la inscripción de matrícula según los siguientes datos registrados:", 10, 50);

  // --- SECCIÓN 1: DATOS DEL SOLICITANTE (ALUMNO/A) ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 54, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("DATOS DEL SOLICITANTE (ALUMNO/A)", 12, 58.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let y = 65;

  const nombreCompleto = `${datosAlumno.apellido ? datosAlumno.apellido.toUpperCase() : ""}, ${datosAlumno.nombre || ""}`;
  doc.text(`Nombre y Apellido: ${nombreCompleto}`, 12, y);
  doc.text(`D.N.I. N°: ${datosAlumno.dni || "---"}`, 130, y);
  y += 5;

  doc.text(`Curso Asignado: ${datosAlumno.curso || "---"}`, 12, y);
  doc.text(`Edad: ${datosAlumno.edad ? datosAlumno.edad + " años" : "---"}`, 95, y);
  doc.text(`Nacimiento: ${datosAlumno.fechaNacimiento || "---"} (${datosAlumno.lugarNacimiento || "Anillaco, La Rioja"})`, 130, y);
  y += 5;

  doc.text(`Domicilio: ${datosAlumno.domicilio || "Pública S/N"}`, 12, y);
  doc.text(`Teléfono: ${datosAlumno.telefono || "3804649880"}`, 110, y);
  doc.text(`Nacionalidad: ${datosAlumno.nacionalidad || "Argentina"}`, 160, y);
  y += 5;

  doc.text(`Escuela de Procedencia: ${datosAlumno.escuelaProcedencia || 'ESC. N° 103 "Coronel Nicolás Barros"'}`, 12, y);
  y += 6;

  // --- SECCIÓN 2: DATOS DEL PADRE, MADRE O TUTOR ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL PADRE, MADRE, TUTOR O ENCARGADO", 12, y + 4.5);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.text(`Nombre y Apellido: ${datosAlumno.nombreTutor || "---"}`, 12, y);
  doc.text(`D.N.I. / CUIL Tutor: ${datosAlumno.dniTutor || "---"}`, 120, y);
  y += 5;

  doc.text(`Domicilio: ${datosAlumno.domicilioTutor || datosAlumno.domicilio || "Pública S/N"}`, 12, y);
  doc.text(`Correo Electrónico: ${datosAlumno.correoTutor || "colegioanillaco2021@gmail.com"}`, 110, y);
  y += 7;

  // --- SECCIÓN 3: CONTROL DE REQUISITOS (CHECKLIST PRESENTADO) ---
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.text("DOCUMENTACIÓN FÍSICA INGRESADA (MESA DE ENTRADA)", 12, y + 4.5);
  y += 9;

  const listaRequisitos = [
    { key: "fotocopiaDniAlumno", label: "Fotocopia D.N.I. Alumno" },
    { key: "partidaNacimiento", label: "Fotocopia Partida Nacimiento" },
    { key: "constanciaCuilAlumno", label: "Constancia CUIL Alumno" },
    { key: "informePedagogico", label: "Informe Pedagógico 7° Grado" },
    { key: "certificadoAnalitico", label: "Certificado Analítico 7° Grado" },
    { key: "aptoFisico", label: "Apto Físico (Buena Salud)" },
    { key: "certificadoDomicilio", label: "Certificado de Domicilio" },
    { key: "carpetaEspiral", label: "Carpeta tipo Espiral" },
    { key: "cuadernoComunicacion", label: "Cuaderno Comunicación (24/48hs)" },
    { key: "foliosOficio", label: "4 Folios Oficio" },
    { key: "fotosCarnet", label: "2 Fotos Carnet" },
    { key: "fotocopiaDniTutor", label: "Fotocopia D.N.I. Tutor/a" },
    { key: "constanciaCuilTutor", label: "Constancia CUIL Tutor/a" },
  ];

  let col = 12;
  doc.setFontSize(7.5);

  listaRequisitos.forEach((item, index) => {
    const entregado = checklist[item.key];
    const casilla = entregado ? "[ X ]" : "[   ]";
    doc.setFont("helvetica", entregado ? "bold" : "normal");
    doc.text(`${casilla} ${item.label}`, col, y);

    if ((index + 1) % 2 === 0) {
      y += 4.5;
      col = 12;
    } else {
      col = 105;
    }
  });

  y += 4;
  doc.setLineWidth(0.3);
  doc.line(10, y, 200, y);
  y += 6;

  // --- SECCIÓN 4: CÓDIGO QR Y FIRMAS OFICIALES ---
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", 12, y, 26, 26);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("ESCANEÁ PARA VER LA FICHA", 10, y + 29);
    doc.text("O COMPLETAR DATOS SINIDE", 10, y + 32);
  }

  // Firmas
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  // Firma 1: Solicitante
  doc.line(48, y + 20, 88, y + 20);
  doc.text("Firma del Solicitante", 52, y + 24);

  // Firma 2: Tutor Legal
  doc.line(96, y + 20, 138, y + 20);
  doc.text("Firma Padre / Tutor Legal", 100, y + 24);

  // Firma 3: Autoridad del Colegio
  doc.line(146, y + 20, 198, y + 20);
  doc.text("Firma Autoridad Colegio Provincial", 147, y + 24);
  doc.text("Pbro. Virgilio Carlos Ferreyra", 152, y + 27);

  doc.save(`Solicitud_Matricula_${datosAlumno.dni}.pdf`);
}