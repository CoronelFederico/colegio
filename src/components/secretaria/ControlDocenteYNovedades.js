"use client";

import { useState } from "react";

export default function ControlDocenteYNovedades() {
  const [subPestana, setSubPestana] = useState("novedades"); // 'novedades' | 'planificaciones' | 'cartelera' | 'historial'

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-base font-black text-[#1e295d] uppercase tracking-wider">
            👨‍🏫 Control Docente & Novedades
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión en tiempo real de licencias, entregas de planificaciones, alertas y cartelera institucional.
          </p>
        </div>
      </div>

      {/* Sub-navegación del Módulo */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubPestana("novedades")}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            subPestana === "novedades" ? "bg-[#1e295d] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          ⏱️ Licencias & Partes Diarios
        </button>
        <button
          onClick={() => setSubPestana("planificaciones")}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            subPestana === "planificaciones" ? "bg-[#1e295d] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📑 Planificaciones & Fechas Límite
        </button>
        <button
          onClick={() => setSubPestana("cartelera")}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            subPestana === "cartelera" ? "bg-[#1e295d] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📌 Cartelera & Comunicados
        </button>
        <button
          onClick={() => setSubPestana("historial")}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            subPestana === "historial" ? "bg-[#1e295d] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📜 Historial Docente
        </button>
      </div>

      {/* Vista Previa de Estado */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
        <div className="font-extrabold text-slate-700">
          📍 Sub-sección activa: <span className="uppercase text-[#1e295d]">{subPestana}</span>
        </div>
        <p className="text-slate-500">
          Estructura configurada para comenzar la codificación completa mañana.
        </p>
      </div>
    </div>
  );
}