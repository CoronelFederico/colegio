"use client";

import { useState } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generarFichaPDF } from "@/lib/generarFichaPDF";

const ORDEN_CURSOS_INSTITUCIONAL = [
  "1° Primera (Ciclo Básico)",
  "1° Segunda (Ciclo Básico)",
  "2° Primera (Ciclo Básico)",
  "2° Segunda (Ciclo Básico)",
  "3° Primera (Ciclo Orientado)",
  "3° Segunda (Ciclo Orientado)",
  "4° Única (Ciclo Orientado)",
  "5° Única (Finalización de Nivel)",
];

const CHECKLIST_INICIAL = {
  fotocopiaDniAlumno: false,
  partidaNacimiento: false,
  constanciaCuilAlumno: false,
  informePedagogico: false,
  certificadoAnalitico: false,
  aptoFisico: false,
  certificadoDomicilio: false,
  carpetaEspiral: false,
  cuadernoComunicacion: false,
  foliosOficio: false,
  fotosCarnet: false,
  fotocopiaDniTutor: false,
  constanciaCuilTutor: false,
};

export default function ListaAlumnos({ usuarios = [], onUpdate }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [modoCompletarFicha, setModoCompletarFicha] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const [formInscripcion, setFormInscripcion] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    edad: "",
    fechaNacimiento: "",
    lugarNacimiento: "Anillaco, La Rioja",
    domicilio: "",
    telefono: "",
    nacionalidad: "Argentina",
    escuelaProcedencia: "",
    curso: "1° Primera (Ciclo Básico)",
    nombreTutor: "",
    dniTutor: "",
    correoTutor: "",
  });

  const [checklist, setChecklist] = useState(CHECKLIST_INICIAL);

  const listaUsuarios = Array.isArray(usuarios) ? usuarios : [];
  const soloAlumnos = listaUsuarios.filter((u) => u.rol === "alumno" || !u.rol);

  const formatearDomicilio = (dom) => {
    if (!dom) return "Pública S/N";
    if (typeof dom === "string") return dom;
    if (typeof dom === "object") {
      const calleVal = dom.calleNumero;
      let calleTexto = "";
      if (typeof calleVal === "string") calleTexto = calleVal;
      else if (typeof calleVal === "object" && calleVal !== null) {
        calleTexto = calleVal.calle || calleVal.numero || "";
      }
      const partes = [calleTexto, dom.barrio, dom.localidad].filter(Boolean);
      return partes.length > 0 ? partes.join(", ") : "Pública S/N";
    }
    return "Pública S/N";
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad.toString() : "";
  };

  const handleAbrirFichaAlumno = (al) => {
    setAlumnoSeleccionado(al);
    setModoCompletarFicha(false);

    const docInscripcion = al.documentacionInscripcion || {};

    setFormInscripcion({
      nombre: al.nombre || "",
      apellido: al.apellido || "",
      dni: al.dni || al.id || "",
      edad: al.edad || "",
      fechaNacimiento: al.fechaNacimiento || "",
      lugarNacimiento: al.lugarNacimiento || "Anillaco, La Rioja",
      domicilio: typeof al.domicilio === "string" ? al.domicilio : formatearDomicilio(al.domicilio),
      telefono: al.telefonoEstudiante || al.telefonoContacto || al.telefono || "",
      nacionalidad: al.nacionalidad || "Argentina",
      escuelaProcedencia: al.escuelaProcedencia || "",
      curso: al.curso || "1° Primera (Ciclo Básico)",
      nombreTutor: al.tutor?.nombre ? `${al.tutor.apellido || ""}, ${al.tutor.nombre}` : al.nombreTutor || "",
      dniTutor: al.tutor?.cuil || al.dniTutor || "",
      correoTutor: al.tutor?.email || al.correoTutor || "",
    });

    setChecklist({
      ...CHECKLIST_INICIAL,
      ...docInscripcion,
    });
  };

  // Guardar datos en Firestore SIN descargar automáticamente el PDF
  const handleGuardarFichaCompleta = async (e) => {
    e.preventDefault();
    if (!alumnoSeleccionado) return;

    const idAlumno = alumnoSeleccionado.id || alumnoSeleccionado.dni;
    setProcesando(true);

    try {
      const docRef = doc(db, "usuarios", idAlumno);

      const totalPapeles = Object.keys(checklist).length;
      const entregados = Object.values(checklist).filter(Boolean).length;
      const estadoInscripcion = entregados === totalPapeles ? "Completa" : "Pendiente de Documentación";

      const datosActualizados = {
        ...formInscripcion,
        nombre: formInscripcion.nombre.trim(),
        apellido: formInscripcion.apellido.trim(),
        fichaInscripcionCompletada: true,
        documentacionInscripcion: {
          ...checklist,
          fichaInscripcion: true,
          estado: estadoInscripcion,
          fechaInscripcion: new Date().toISOString(),
        },
        actualizadoEn: new Date().toISOString(),
      };

      await updateDoc(docRef, datosActualizados);

      alert("✅ Ficha de Inscripción y Checklist físico guardados correctamente.");

      setAlumnoSeleccionado((prev) => ({
        ...prev,
        ...datosActualizados,
      }));

      setModoCompletarFicha(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error al guardar la ficha completa:", error);
      alert("❌ Ocurrió un error al guardar los datos.");
    } finally {
      setProcesando(false);
    }
  };

  // Función independiente para descargar el PDF cuando el usuario lo solicite
  const handleDescargarPDFManual = async () => {
    try {
      await generarFichaPDF(formInscripcion, checklist);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("⚠️ Ocurrió un error al generar la solicitud en PDF.");
    }
  };

  const handleEliminarAlumno = async (alumno) => {
    const idBorrar = alumno.id || alumno.dni;
    const nombreCompleto = `${alumno.apellido || ""} ${alumno.nombre || ""}`.trim() || idBorrar;

    const confirmado = window.confirm(`⚠️ ¿Estás seguro/a de eliminar a "${nombreCompleto}"?`);
    if (!confirmado) return;

    setEliminandoId(idBorrar);
    try {
      await deleteDoc(doc(db, "usuarios", idBorrar));
      alert(`✅ Estudiante eliminado correctamente.`);
      setAlumnoSeleccionado(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error al eliminar alumno:", error);
    } finally {
      setEliminandoId(null);
    }
  };

  const obtenerEstadoLegajo = (al) => {
    const docData = al.documentacionInscripcion || {};
    
    const sinideListo = 
      al.sinideCompletado === true || 
      al.sinideCompletado === "true" || 
      al.ddjjAceptada === true || 
      (al.sinide && Object.keys(al.sinide).length > 0);

    const fichaFisicaLista = docData.fichaInscripcion === true || al.fichaInscripcionCompletada === true;

    if (sinideListo && fichaFisicaLista) {
      return {
        label: "Legajo Completo (SInIDE + Ficha)",
        color: "bg-emerald-100 text-emerald-800 border-emerald-300",
        dot: "bg-emerald-500",
        codigo: "VERDE",
      };
    }

    if (sinideListo || fichaFisicaLista) {
      let faltantes = [];
      if (!sinideListo) faltantes.push("Falta SInIDE");
      if (!fichaFisicaLista) faltantes.push("Falta Ficha Física");

      return {
        label: faltantes.join(" | "),
        color: "bg-amber-100 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        codigo: "AMARILLO",
      };
    }

    return {
      label: "Sin Trámite Ni Documentación",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      dot: "bg-rose-500",
      codigo: "ROJO",
    };
  };

  const alumnosFiltrados = soloAlumnos.filter((al) => {
    const textoMatch = `${al.nombre || ""} ${al.apellido || ""} ${al.dni || al.id || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const cursoMatch = filtroCurso === "TODOS" ? true : al.curso === filtroCurso;
    const estado = obtenerEstadoLegajo(al);
    const estadoMatch = filtroEstado === "TODOS" ? true : estado.codigo === filtroEstado;

    return textoMatch && cursoMatch && estadoMatch;
  });

  return (
    <div className="space-y-6 text-xs text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-[#1e295d]">
            🎒 Módulo Alumnos & Control de Legajos
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Auditoría de los 85 estudiantes (SInIDE Digital y Ficha de Inscripción Física)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
        <div>
          <label className="block font-bold text-slate-600 mb-1">🔍 Buscador</label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="DNI, Nombre o Apellido..."
            className="input input-bordered w-full h-10 bg-slate-50 font-medium text-xs"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">📚 Curso / Año</label>
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="select select-bordered w-full h-10 bg-slate-50 font-bold text-xs"
          >
            <option value="TODOS">Todos los cursos</option>
            {ORDEN_CURSOS_INSTITUCIONAL.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">🚦 Estado de Legajo</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select select-bordered w-full h-10 bg-slate-50 font-bold text-xs"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="VERDE">🟢 Legajo Completo</option>
            <option value="AMARILLO">🟡 Faltantes Parciales</option>
            <option value="ROJO">🔴 Sin Trámite</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {alumnosFiltrados.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-slate-400 font-medium">No se encontraron registros.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alumnosFiltrados.map((al) => {
              const estado = obtenerEstadoLegajo(al);
              const idActual = al.id || al.dni;

              return (
                <div key={idActual} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {al.apellido ? `${al.apellido}, ${al.nombre}` : al.nombre || "Sin nombre"}
                      </p>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-lg text-[10px]">
                        {al.curso || "Sin curso"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-medium">
                      DNI: <span className="font-mono text-slate-600 font-bold">{al.dni || idActual}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-[10px] border ${estado.color}`}>
                      <span className={`w-2 h-2 rounded-full ${estado.dot}`}></span>
                      {estado.label}
                    </span>

                    <button
                      onClick={() => handleAbrirFichaAlumno(al)}
                      className="btn btn-xs bg-[#1e295d] hover:bg-[#151e42] text-white border-none font-bold rounded-xl px-3 cursor-pointer"
                    >
                      👁️ Ver Ficha
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL FICHA */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-xs border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Auditoría & Solicitud de Matrícula
                </span>
                <h3 className="text-base font-black text-[#1e295d]">
                  {alumnoSeleccionado.apellido}, {alumnoSeleccionado.nombre}
                </h3>
                <p className="text-slate-500 font-medium">
                  DNI: {alumnoSeleccionado.dni} • Curso: {alumnoSeleccionado.curso || "Sin asignar"}
                </p>
              </div>
              <button onClick={() => setAlumnoSeleccionado(null)} className="btn btn-sm btn-circle btn-ghost text-slate-400">
                ✕
              </button>
            </div>

            {!modoCompletarFicha ? (
              <>
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="font-extrabold text-[#1e295d] uppercase tracking-wider text-[11px]">
                    📋 Estado de Trámites
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">1. Formulario SInIDE (Digital)</span>
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        alumnoSeleccionado.sinideCompletado || alumnoSeleccionado.ddjjAceptada
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {alumnoSeleccionado.sinideCompletado || alumnoSeleccionado.ddjjAceptada ? "✅ Completado" : "⚠️ Pendiente"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">2. Ficha de Inscripción (Física)</span>
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        alumnoSeleccionado.documentacionInscripcion?.fichaInscripcion || alumnoSeleccionado.fichaInscripcionCompletada
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {alumnoSeleccionado.documentacionInscripcion?.fichaInscripcion || alumnoSeleccionado.fichaInscripcionCompletada ? "✅ Entregada" : "⚠️ Pendiente"}
                      </span>
                    </div>
                  </div>

                  {/* Apartado de acciones: Botón para editar y Botón separado para descargar PDF */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => setModoCompletarFicha(true)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      📝 Modificar / Completar Datos & Checklist
                    </button>
                    <button
                      onClick={handleDescargarPDFManual}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      📄 Descargar Solicitud (PDF)
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setAlumnoSeleccionado(null)}
                    className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                  <button
                    disabled={eliminandoId === (alumnoSeleccionado.id || alumnoSeleccionado.dni)}
                    onClick={() => handleEliminarAlumno(alumnoSeleccionado)}
                    className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </>
            ) : (
              /* FORMULARIO EDITABLE */
              <form onSubmit={handleGuardarFichaCompleta} className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-black text-[#1e295d] text-sm">
                    📝 Ficha de Matrícula & Checklist de Documentación
                  </h4>
                  <button
                    type="button"
                    onClick={() => setModoCompletarFicha(false)}
                    className="text-slate-500 font-bold hover:underline cursor-pointer"
                  >
                    ← Volver
                  </button>
                </div>

                {/* Datos Alumno */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border">
                  <p className="font-bold text-[#1e295d]">Datos del Alumno/a</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">DNI *</label>
                      <input
                        type="text"
                        value={formInscripcion.dni}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, dni: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Apellido *</label>
                      <input
                        type="text"
                        value={formInscripcion.apellido}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, apellido: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={formInscripcion.nombre}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, nombre: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Curso Asignado</label>
                      <select
                        value={formInscripcion.curso}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, curso: e.target.value })}
                        className="select select-bordered w-full h-9 text-xs font-bold bg-white"
                      >
                        {ORDEN_CURSOS_INSTITUCIONAL.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Fecha Nacimiento</label>
                      <input
                        type="date"
                        value={formInscripcion.fechaNacimiento}
                        onChange={(e) => {
                          const nuevaFecha = e.target.value;
                          setFormInscripcion({
                            ...formInscripcion,
                            fechaNacimiento: nuevaFecha,
                            edad: calcularEdad(nuevaFecha),
                          });
                        }}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formInscripcion.telefono}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, telefono: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Domicilio</label>
                      <input
                        type="text"
                        value={formInscripcion.domicilio}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, domicilio: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Escuela Procedencia</label>
                      <input
                        type="text"
                        value={formInscripcion.escuelaProcedencia}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, escuelaProcedencia: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos Tutor */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border">
                  <p className="font-bold text-[#1e295d]">Datos del Padre, Madre o Tutor</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nombre Tutor</label>
                      <input
                        type="text"
                        value={formInscripcion.nombreTutor}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, nombreTutor: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">DNI / CUIL Tutor</label>
                      <input
                        type="text"
                        value={formInscripcion.dniTutor}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, dniTutor: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={formInscripcion.correoTutor}
                        onChange={(e) => setFormInscripcion({ ...formInscripcion, correoTutor: e.target.value })}
                        className="input input-bordered w-full h-9 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist de Documentación Física */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border">
                  <p className="font-bold text-[#1e295d]">Checklist de Documentación Física</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(CHECKLIST_INICIAL).map((key) => {
                      const labels = {
                        fotocopiaDniAlumno: "Fotocopia D.N.I. Alumno",
                        partidaNacimiento: "Fotocopia Partida de Nacimiento",
                        constanciaCuilAlumno: "Constancia CUIL Alumno",
                        informePedagogico: "Informe Pedagógico 7° Grado",
                        certificadoAnalitico: "Certificado Analítico 7° Grado",
                        aptoFisico: "Apto Físico (Buena Salud)",
                        certificadoDomicilio: "Certificado de Domicilio",
                        carpetaEspiral: "Carpeta tipo Espiral",
                        cuadernoComunicacion: "Cuaderno Comunicación",
                        foliosOficio: "4 Folios Oficio",
                        fotosCarnet: "2 Fotos Carnet",
                        fotocopiaDniTutor: "Fotocopia D.N.I. Tutor/a",
                        constanciaCuilTutor: "Constancia CUIL Tutor/a",
                      };

                      return (
                        <label key={key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist[key]}
                            onChange={() => setChecklist({ ...checklist, [key]: !checklist[key] })}
                            className="checkbox checkbox-xs checkbox-primary"
                          />
                          <span className="font-medium text-slate-700">{labels[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModoCompletarFicha(false)}
                    className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {procesando ? "Guardando cambios..." : "💾 Guardar Ficha en Base de Datos"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}