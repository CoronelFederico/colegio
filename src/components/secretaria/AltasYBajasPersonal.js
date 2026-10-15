"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AltasYBajasPersonal() {
  const [modo, setModo] = useState("lista"); // 'lista' | 'alta'
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // 'todos' | 'activo' | 'baja'

  // Formulario completo alineado con la normativa ministerial (ND-01 y Declaración Jurada F-2)
  const [nuevoDocente, setNuevoDocente] = useState({
    apellido: "",
    nombre: "",
    dni: "",
    cuil: "",
    telefono: "",
    espacioCurricular: "",
    cursoDivision: "2° Año 1ra Div.",
    cantidadHoras: "3",
    caracter: "Suplente", // Suplente | Interino | Titular
    fechaAlta: new Date().toISOString().split("T")[0],
    motivoOrigen: "Licencia Médica", // Licencia Médica | Renuncia | Cito Vacante
    docenteReemplazado: "", // 👈 ¡Nuevo campo para marcar a quién reemplaza en el horario!
    articuloLegal: "Art. 7.2 Ley 9911",
  });

  const handleGuardarAlta = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "personal"), {
        ...nuevoDocente,
        estado: "activo",
        creadoEn: new Date().toISOString(),
      });

      alert(`✅ Alta registrada correctamente para ${nuevoDocente.apellido}, ${nuevoDocente.nombre}. Se vinculó el reemplazo de ${nuevoDocente.docenteReemplazado || "---"}.`);
      setModo("lista");
    } catch (error) {
      console.error("Error al guardar alta:", error);
      alert("⚠️ Hubo un error al registrar el alta en la base de datos.");
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-[#1e295d] uppercase tracking-wider">
            👤 Altas, Bajas & Designaciones de Personal
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Registro oficial de horas cátedra, situación de revista y control de docentes reemplazados.
          </p>
        </div>
        {modo === "lista" ? (
          <button
            onClick={() => setModo("alta")}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            ➕ Registrar Nueva Alta (Planilla ND-01)
          </button>
        ) : (
          <button
            onClick={() => setModo("lista")}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            ← Volver a la Plantilla General
          </button>
        )}
      </div>

      {/* FORMULARIO DE ALTA DETALLADO */}
      {modo === "alta" && (
        <form onSubmit={handleGuardarAlta} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 max-w-3xl mx-auto shadow-xs">
          <h3 className="font-extrabold text-[#1e295d] text-sm uppercase border-b pb-2">
            📝 Datos de Incorporación y Planilla ND-01
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                required
                placeholder="Ej: HERRERA"
                value={nuevoDocente.apellido}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellido: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden uppercase font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                required
                placeholder="Ej: ANDREA DEL VALLE"
                value={nuevoDocente.nombre}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden uppercase font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">DNI *</label>
              <input
                type="text"
                required
                placeholder="32.933.840"
                value={nuevoDocente.dni}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, dni: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">CUIL *</label>
              <input
                type="text"
                placeholder="27-32933840-7"
                value={nuevoDocente.cuil}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, cuil: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de Alta *</label>
              <input
                type="date"
                value={nuevoDocente.fechaAlta}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, fechaAlta: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Espacio Curricular / Asignatura</label>
              <input
                type="text"
                placeholder="Ej: Física-Química"
                value={nuevoDocente.espacioCurricular}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, espacioCurricular: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Curso y División</label>
              <input
                type="text"
                placeholder="Ej: 2° Año 2ra Div."
                value={nuevoDocente.cursoDivision}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, cursoDivision: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cantidad de Horas</label>
              <input
                type="text"
                placeholder="Ej: 03"
                value={nuevoDocente.cantidadHoras}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, cantidadHoras: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Carácter de Designación</label>
              <select
                value={nuevoDocente.caracter}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, caracter: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden bg-white font-bold text-[#1e295d]"
              >
                <option value="Suplente">Suplente</option>
                <option value="Interino">Interino</option>
                <option value="Titular">Titular</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-rose-700 mb-1">En Reemplazo de (Titular / Agente anterior)</label>
              <input
                type="text"
                placeholder="Ej: Prof. Navarro, Malvina Antonieta"
                value={nuevoDocente.docenteReemplazado}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, docenteReemplazado: e.target.value })}
                className="w-full px-3 py-2 border border-rose-200 bg-rose-50/50 rounded-xl text-xs outline-hidden font-bold text-rose-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModo("lista")}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              💾 Guardar Alta e Integrar a Secretaría
            </button>
          </div>
        </form>
      )}

      {/* VISTA DE PLANTILLA Y FILTROS */}
      {modo === "lista" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-[#1e295d] text-sm uppercase">
              📋 Plantilla Institucional de Personal & Reemplazos
            </h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setEstadoFiltro("todos")}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                  estadoFiltro === "todos" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setEstadoFiltro("activo")}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                  estadoFiltro === "activo" ? "bg-emerald-600 text-white" : "text-slate-500"
                }`}
              >
                Activos
              </button>
            </div>
          </div>

          {/* Tabla de Personal con indicación de Reemplazo */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                  <th className="py-2 px-3">Agente / Docente</th>
                  <th className="py-2 px-3">Espacio / Curso</th>
                  <th className="py-2 px-3">Carácter</th>
                  <th className="py-2 px-3 text-rose-700">En Reemplazo de:</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    HERRERA, Andrea del Valle <span className="block text-[10px] font-normal text-slate-500">DNI: 32.933.840</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    Física-Química <span className="block text-[10px] text-slate-400">2° Año 2ra Div. (03 hs)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-[10px] font-bold">Suplente</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-rose-800 bg-rose-50/40 rounded-lg">
                    Prof. Navarro, Malvina Antonieta <span className="block text-[9px] font-normal text-rose-600">Por Licencia Médica</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold">✅ Activo</span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button 
                      onClick={() => alert("Registrar baja o cese")}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                    >
                      🔻 Registrar Cese
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}