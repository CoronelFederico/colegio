"use client";

import { useState } from "react";

export default function AltasYBajasPersonal() {
  const [modo, setModo] = useState("lista"); // 'lista' | 'alta'
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // 'todos' | 'activo' | 'baja'

  const [nuevoDocente, setNuevoDocente] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    cuil: "",
    email: "",
    telefono: "",
    cargo: "Profesor de Cátedra",
    situacionRevista: "Titular",
    fechaAlta: new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  const handleGuardarAlta = (e) => {
    e.preventDefault();
    alert(`✅ Alta registrada para ${nuevoDocente.apellido}, ${nuevoDocente.nombre}`);
    setModo("lista");
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200">
        <div>
          <h2 className="text-base font-black text-[#1e295d] uppercase tracking-wider">
            👤 Altas & Bajas de Personal Docente
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Gestión de alta institucional, designación de cargos, bajas y estado de revista.
          </p>
        </div>
        {modo === "lista" ? (
          <button
            onClick={() => setModo("alta")}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            ➕ Registrar Nuevo Personal
          </button>
        ) : (
          <button
            onClick={() => setModo("lista")}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Ver Plantilla General
          </button>
        )}
      </div>

      {/* FORMULARIO DE ALTA */}
      {modo === "alta" && (
        <form onSubmit={handleGuardarAlta} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 max-w-2xl mx-auto shadow-xs">
          <h3 className="font-extrabold text-[#1e295d] text-sm uppercase border-b pb-2">
            📝 Datos de Alta e Incorporación
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={nuevoDocente.apellido}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellido: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                required
                value={nuevoDocente.nombre}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">DNI *</label>
              <input
                type="text"
                required
                value={nuevoDocente.dni}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, dni: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">CUIL *</label>
              <input
                type="text"
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
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cargo / Función</label>
              <select
                value={nuevoDocente.cargo}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, cargo: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden bg-white font-bold"
              >
                <option value="Profesor de Cátedra">Profesor de Cátedra</option>
                <option value="Preceptor">Preceptor</option>
                <option value="Directivo">Directivo</option>
                <option value="Secretario">Secretario</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Situación de Revista</label>
              <select
                value={nuevoDocente.situacionRevista}
                onChange={(e) => setNuevoDocente({ ...nuevoDocente, situacionRevista: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-hidden bg-white font-bold"
              >
                <option value="Titular">Titular</option>
                <option value="Interino">Interino</option>
                <option value="Suplente">Suplente</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModo("lista")}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
            >
              💾 Confirmar Alta de Personal
            </button>
          </div>
        </form>
      )}

      {/* VISTA DE PLANTILLA Y FILTROS */}
      {modo === "lista" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-[#1e295d] text-sm uppercase">
              📋 Plantilla Oficial de Personal
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
              <button
                onClick={() => setEstadoFiltro("baja")}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                  estadoFiltro === "baja" ? "bg-rose-600 text-white" : "text-slate-500"
                }`}
              >
                Bajas / Ceses
              </button>
            </div>
          </div>

          {/* Tabla de Personal */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                  <th className="py-2 px-3">Agente / Docente</th>
                  <th className="py-2 px-3">DNI / CUIL</th>
                  <th className="py-2 px-3">Cargo</th>
                  <th className="py-2 px-3">Revista</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">Gómez, María Elena</td>
                  <td className="py-3 px-3 text-slate-500">28.452.112</td>
                  <td className="py-3 px-3 font-bold text-slate-700">Prof. Informática</td>
                  <td className="py-3 px-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      Titular
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      ✅ Activo
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => alert("Registrar baja o cese para Gómez María Elena")}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-[10px] transition-colors"
                    >
                      🔻 Registrar Cese / Baja
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