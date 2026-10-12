"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ModuloMatriculaAlumnos() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroCurso, setFiltroCurso] = useState("todos");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const lista = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setUsuarios(lista);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setCargando(false);
    }
  };

  // Contadores para las métricas rápidas
  const totalAlumnos = usuarios.filter((u) => u.rol === "alumno" || !u.rol).length;
  const totalDocentes = usuarios.filter((u) => u.rol === "docente").length;
  const totalPreceptores = usuarios.filter((u) => u.rol === "preceptor").length;
  const totalGeneral = usuarios.length;

  // Filtrado de usuarios
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const textoMatch =
      `${usuario.nombre || ""} ${usuario.apellido || ""} ${usuario.dni || ""}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());

    const rolMatch =
      filtroRol === "todos"
        ? true
        : filtroRol === "alumno"
        ? usuario.rol === "alumno" || !usuario.rol
        : usuario.rol === filtroRol;

    const cursoMatch =
      filtroCurso === "todos"
        ? true
        : usuario.curso === filtroCurso;

    return textoMatch && rolMatch && cursoMatch;
  });

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-lg font-black text-[#1e295d] uppercase tracking-tight">
            📊 Matrícula y Padrón de Usuarios
          </h2>
          <p className="text-slate-500 font-medium">
            Gestión de estudiantes, docentes y personal institucional
          </p>
        </div>
        <button
          onClick={cargarUsuarios}
          className="btn btn-sm bg-slate-200 hover:bg-slate-300 border-none font-bold text-slate-700"
        >
          🔄 Actualizar Datos
        </button>
      </div>

      {/* Tarjetas de Estadísticas / Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Alumnos</span>
          <h3 className="text-2xl font-black text-blue-600">{totalAlumnos}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Docentes Registrados</span>
          <h3 className="text-2xl font-black text-emerald-600">{totalDocentes}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Preceptores</span>
          <h3 className="text-2xl font-black text-amber-600">{totalPreceptores}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total General</span>
          <h3 className="text-2xl font-black text-[#1e295d]">{totalGeneral}</h3>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Buscar por Nombre o DNI</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: 42500100 o Pérez..."
            className="input input-bordered w-full h-10 bg-slate-50 font-medium text-xs"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">Filtrar por Rol</label>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="select select-bordered w-full h-10 bg-slate-50 font-bold text-xs"
          >
            <option value="todos">Todos los roles</option>
            <option value="alumno">Alumnos</option>
            <option value="docente">Docentes</option>
            <option value="preceptor">Preceptores</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">Filtrar por Curso</label>
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="select select-bordered w-full h-10 bg-slate-50 font-bold text-xs"
          >
            <option value="todos">Todos los cursos</option>
            <option value="1° Primera (Ciclo Básico)">1° Primera (Ciclo Básico)</option>
            <option value="1° Segunda (Ciclo Básico)">1° Segunda (Ciclo Básico)</option>
            <option value="2° Primera (Ciclo Básico)">2° Primera (Ciclo Básico)</option>
            <option value="3° Primera (Ciclo Orientado)">3° Primera (Ciclo Orientado)</option>
            <option value="4° Única (Ciclo Orientado)">4° Única (Ciclo Orientado)</option>
            <option value="5° Única (Finalización)">5° Única (Finalización)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase">
                <th>DNI</th>
                <th>Apellido y Nombre</th>
                <th>Rol</th>
                <th>Curso / Asignación</th>
                <th>Contacto / Tutor</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                    Cargando padrón desde Firestore...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover">
                    <font className="font-bold font-mono">{u.dni || u.id}</font>
                    <td className="font-bold text-slate-900">
                      {u.apellido ? `${u.apellido}, ${u.nombre}` : u.nombre || "Sin nombre"}
                    </td>
                    <td>
                      <span
                        className={`badge badge-xs font-bold uppercase ${
                          u.rol === "docente"
                            ? "badge-success"
                            : u.rol === "preceptor"
                            ? "badge-warning"
                            : u.rol === "admin"
                            ? "badge-error"
                            : "badge-info"
                        }`}
                      >
                        {u.rol || "alumno"}
                      </span>
                    </td>
                    <td>{u.curso || "---"}</td>
                    <td>{u.telefono || u.correoTutor || "Sin datos"}</td>
                    <td className="text-center space-x-1">
                      <button
                        onClick={() => alert(`Ver legajo de: ${u.nombre || u.dni}`)}
                        className="btn btn-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border-none font-bold"
                      >
                        📂 Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}