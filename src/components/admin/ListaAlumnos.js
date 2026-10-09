"use client";

import { useState } from "react";

export default function ListaAlumnos({ alumnosList, cursosDisponibles }) {
  const [filtroCurso, setFiltroCurso] = useState("TODOS");

  const alumnosFiltrados = filtroCurso === "TODOS" 
    ? alumnosList 
    : alumnosList.filter((a) => a.curso === filtroCurso);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">🎒 Módulo Alumnos & Cursos</h2>
          <p className="text-xs text-slate-500">Listado de matriculados por año y división.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Curso:</span>
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white"
          >
            <option value="TODOS">Todos los cursos</option>
            {cursosDisponibles.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {alumnosFiltrados.length === 0 ? (
          <p className="p-8 text-xs text-slate-400 text-center font-medium">
            No hay alumnos registrados para este curso.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {alumnosFiltrados.map((al) => (
              <div key={al.id} className="p-4 flex justify-between items-center text-xs hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-900">{al.apellido}, {al.nombre}</p>
                  <p className="text-slate-400 text-[11px]">DNI: {al.dni}</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-black rounded-xl text-[10px]">
                  {al.curso || "Sin curso"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}