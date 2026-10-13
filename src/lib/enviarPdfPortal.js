// src/lib/enviarPdfPortal.js

export const enviarNotificacionWhatsApp = (telefonoDestino, nombreAlumno, tipoDocumento = "Ficha Escolar") => {
  const telefonoLimpio = String(telefonoDestino || "").replace(/\D/g, "");

  if (!telefonoLimpio || telefonoLimpio.length < 8) {
    alert("⚠️ Por favor, ingresá un número de teléfono válido con característica para enviar por WhatsApp.");
    return false;
  }

  // Mensaje optimizado aclarando que los PDFs ya se descargaron
  const mensaje = encodeURIComponent(
    `*COLEGIO PROVINCIAL PBRO. VIRGILIO CARLOS FERREYRA*\n` +
    `Anillaco, La Rioja\n\n` +
    `Estimada familia /\n` +
    `Se han generado y descargado correctamente los siguientes documentos de *${nombreAlumno}*:\n\n` +
    `📄 1. Comprobante SInIDE Digital\n` +
    `📄 2. Ficha de Inscripción y Checklist\n\n` +
    `*(Los archivos PDF se encuentran disponibles en su dispositivo para ser adjuntados en este chat).*`
  );

  const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${mensaje}`;
  window.open(urlWhatsApp, "_blank");
  
  return true;
};