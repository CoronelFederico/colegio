"use client";

import { useState } from "react";
import ControlLicencias from "./ControlLicencias";
import GestionPlanificaciones from "./GestionPlanificaciones";
import CarteleraInstitucional from "./CarteleraInstitucional";
import HistorialDocente from "./HistorialDocente";
import AltasYBajasPersonal from "./AltasYBajasPersonal";
import EstructuraCurricular from "./EstructuraCurricular"; 
import GestionDocentesPadron from "./GestionDocentesPadron";

export default function ControlDocenteYNovedades() {
  const [moduloActivo, setModuloActivo] = useState(null);

  // Vistas según el módulo activo
  if (moduloActivo === "licencias") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Docente
        </button>
        <ControlLicencias />
      </div>
    );
  }

  if (moduloActivo === "planificaciones") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Docente
        </button>
        <GestionPlanificaciones />
      </div>
    );
  }

  if (moduloActivo === "altas_bajas") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Docente
        </button>
        <AltasYBajasPersonal />
      </div>
    );
  }

  {/*  
  if (moduloActivo === "curricular") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Docente
        </button>
        <EstructuraCurricular />
      </div>
    );
  }*/}

  if (moduloActivo === "cartelera") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Docente
        </button>
        <CarteleraInstitucional />
      </div>
    );
  }

  if (moduloActivo === "historial") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Docente
        </button>
        <HistorialDocente />
      </div>
    );
  }


  if (moduloActivo === "padron_docentes") {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setModuloActivo(null)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
        >
          ← Volver al Panel Principal
        </button>
        <GestionDocentesPadron />
      </div>
    );
  }
  // MENÚ PRINCIPAL (DASHBOARD DE TARJETAS)
  return (
    <div className="space-y-6 text-xs text-slate-800">
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-1">
        <h2 className="text-lg font-black text-[#1e295d] uppercase tracking-wider">
          👨‍🏫 Gestión Institucional & Control Docente
        </h2>
        <p className="text-slate-500 text-xs">
          Seleccioná un módulo para gestionar licencias, entregas, avisos, historiales, altas/bajas o la estructura curricular.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        
        {/* Tarjeta 1: Licencias */}
        <div 
          onClick={() => setModuloActivo("licencias")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            ⏱️
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Licencias & Partes Diarios</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Registro de licencias médicas, personales y partes diarios a secretaría.
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Planificaciones */}
        <div 
          onClick={() => setModuloActivo("planificaciones")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            📑
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Planificaciones & Fechas Límite</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Asignación de deadlines, control de entregas y gestión de prórrogas.
            </p>
          </div>
        </div>

        {/* Tarjeta 3: Altas y Bajas */}
        <div 
          onClick={() => setModuloActivo("altas_bajas")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            👤
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Altas & Bajas de Personal</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Designación de nuevos docentes, registros de cese, cargos y suplencias.
            </p>
          </div>
        </div>

        {/* Tarjeta 4: Estructura Curricular (¡NUEVO!) 
        <div 
          onClick={() => setModuloActivo("curricular")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            📚
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Estructura Curricular & Materias</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Planes de estudio de 1° a 5° año, divisiones y asignación de docentes.
            </p>
          </div>
        </div>*/}


 {/* Tarjeta 5: padron docente */}
        <div 
          onClick={() => setModuloActivo("padron_docentes")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            📂
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Padrón & Legajos del Personal</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Listado general, importación por Excel, búsqueda por DNI y perfiles autogestionables.
            </p>
          </div>
        </div>

        
        {/* Tarjeta 5: Cartelera */}
        <div 
          onClick={() => setModuloActivo("cartelera")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            📌
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Cartelera & Comunicados</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Publicación de avisos oficiales con confirmación de lectura.
            </p>
          </div>
        </div>

        {/* Tarjeta 6: Historial */}
        <div 
          onClick={() => setModuloActivo("historial")}
          className="p-6 bg-white hover:border-blue-400 border border-slate-200 rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform">
            📜
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">Historial Docente</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Trazabilidad de puntualidad, asistencias y antecedentes de profesores.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}