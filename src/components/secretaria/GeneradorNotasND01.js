"use client";

import { useState } from "react";
import { generarNotaND01PDF } from "@/lib/generarNotaND01";

export default function GeneradorNotasND01() {
  const [tipoTramite, setTipoTramite] = useState("alta");
  const [formData, setFormData] = useState({
    numeroNota: "85/2026",
    fechaEmision: new Date().toISOString().split("T")[0],
    supervisora: "Lic. Martha Viviana Herrera",
    zona: "Zona III",
    apellidoNombreAgente: "HERRERA, ANDREA DEL VALLE",
    dniAgente: "32.933.840",
    cuilAgente: "27-32933840-7",
    espacioCurricular: "Física-Química",
    cursoDivision: "2° Año 2ra Div.",
    cantidadHoras: "03 hs suplentes",
    caracter: "Suplente",
    docenteReemplazado: "NAVARRO, MALVINA ANTONIETA",
    motivoLicencia: "Licencia Médica",
    articuloLegal: "Art. 7.2 Ley 9911",
    fechaInicioLicencia: "19/05/2026",
    fechaFinLicencia: "13/08/2026",
    codigoLicencia: "710 0 0",
  });

  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);

  const handleCargarImagenes = (e) => {
    const files = Array.from(e.target.files);
    const nuevasImgs = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        nuevasImgs.push(uploadEvent.target.result);
        if (nuevasImgs.length === files.length) {
          setImagenesAdjuntas((prev) => [...prev, ...nuevasImgs]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDescargarPDF = async () => {
    try {
      const docPdf = await generarNotaND01PDF(formData, tipoTramite, imagenesAdjuntas);
      docPdf.save(`Nota_ND01_${tipoTramite}_${formData.dniAgente.replace(/\./g, "")}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF institucional:", error);
      alert("⚠️ Hubo un error al compilar el archivo PDF.");
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-black text-[#1e295d] uppercase tracking-wider">
            📑 Generador Oficial de Nota ND-01 y Trámites Ministeriales
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Confección formal de Notas de elevación para Supervisión con anexos de imágenes en la librería.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl font-bold">
          <button
            type="button"
            onClick={() => setTipoTramite("alta")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              tipoTramite === "alta" ? "bg-white text-[#1e295d] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ➕ Alta Inicial (ND-01)
          </button>
          <button
            type="button"
            onClick={() => setTipoTramite("continuidad")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              tipoTramite === "continuidad" ? "bg-white text-[#1e295d] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔄 Continuidad de Suplente
          </button>
          <button
            type="button"
            onClick={() => setTipoTramite("baja")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              tipoTramite === "baja" ? "bg-white text-[#1e295d] shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔻 Baja / Cese
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
        <h3 className="font-extrabold text-[#1e295d] text-sm uppercase border-b pb-2">
          📝 Parámetros del Trámite ({tipoTramite.toUpperCase()})
        </h3>

        {/* Inputs del formulario igual que antes... */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">N.° de Nota Institucional</label>
            <input
              type="text"
              value={formData.numeroNota}
              onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Fecha de Emisión</label>
            <input
              type="date"
              value={formData.fechaEmision}
              onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Supervisora Destino</label>
            <input
              type="text"
              value={formData.supervisora}
              onChange={(e) => setFormData({ ...formData, supervisora: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Apellidos y Nombres del Docente</label>
            <input
              type="text"
              value={formData.apellidoNombreAgente}
              onChange={(e) => setFormData({ ...formData, apellidoNombreAgente: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden uppercase font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">DNI del Docente</label>
            <input
              type="text"
              value={formData.dniAgente}
              onChange={(e) => setFormData({ ...formData, dniAgente: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <label className="block font-extrabold text-[#1e295d] uppercase">
            📎 Adjuntar Fichas de Designación o Certificados Médicos
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleCargarImagenes}
            className="w-full p-2 border rounded-xl text-xs bg-slate-50 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            {imagenesAdjuntas.length} archivo(s) adjunto(s) listo(s) para los anexos.
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleDescargarPDF}
            className="px-6 py-3 bg-[#1e295d] hover:bg-[#151e42] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 text-xs"
          >
            🖨️ Generar y Descargar Nota ND-01 en PDF
          </button>
        </div>
      </div>
    </div>
  );
}