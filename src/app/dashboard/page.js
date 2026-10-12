"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Importación de Módulos
import VistaGeneral from "@/components/admin/VistaGeneral";
import CrearUsuario from "@/components/admin/CrearUsuario";
import ListaAlumnos from "@/components/admin/ListaAlumnos";
import Preceptoria from "@/components/admin/Preceptoria";
import SolicitudesClave from "@/components/admin/SolicitudesClave";
import Biblioteca from "@/components/admin/Biblioteca";

import ControlDocenteYNovedades from "@/components/secretaria/ControlDocenteYNovedades";
import GestionCorreos from "@/components/secretaria/GestionCorreos";
import InscripcionSecretaria from "@/components/secretaria/InscripcionSecretaria";
import LibroEntradaSalida from "@/components/secretaria/LibroEntradaSalida";

import FormularioPortalFamilia from "@/components/familia/FormularioPortalFamilia";

export default function DashboardPage() {
  const [usuario, setUsuario] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState("vista_general");
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // Estados Globales de Firebase
  const [usuarios, setUsuarios] = useState([]);
  const [solicitudesBlanqueo, setSolicitudesBlanqueo] = useState([]);
  const [libros, setLibros] = useState([]);
  const [prestamos, setPrestamos] = useState([]);

  const router = useRouter();

  const cursosDisponibles = [
    "1° Primera (Ciclo Básico)",
    "1° Segunda (Ciclo Básico)",
    "2° Primera (Ciclo Básico)",
    "2° Segunda (Ciclo Básico)",
    "3° Primera (Ciclo Orientado)",
    "3° Segunda (Ciclo Orientado)",
    "4° Única (Ciclo Orientado)",
    "5° Única (Finalización de Nivel)",
  ];

  // Carga de datos de Firestore
  const cargarDatosFirebase = async () => {
    setLoadingDatos(true);
    try {
      // 1. Usuarios
      const snapUsuarios = await getDocs(collection(db, "usuarios"));
      const listaUsuarios = [];
      snapUsuarios.forEach((d) => listaUsuarios.push({ id: d.id, ...d.data() }));
      setUsuarios(listaUsuarios);

      // 2. Solicitudes de Blanqueo Pendientes
      const qBlanqueo = query(
        collection(db, "solicitudes_blanqueo"),
        where("estado", "==", "pendiente")
      );
      const snapBlanqueo = await getDocs(qBlanqueo);
      const listaBlanqueos = [];
      snapBlanqueo.forEach((d) => listaBlanqueos.push({ id: d.id, ...d.data() }));
      setSolicitudesBlanqueo(listaBlanqueos);

      // 3. Libros
      const snapLibros = await getDocs(collection(db, "biblioteca_libros"));
      const listaLibros = [];
      snapLibros.forEach((d) => listaLibros.push({ id: d.id, ...d.data() }));
      setLibros(listaLibros);

      // 4. Préstamos
      const snapPrestamos = await getDocs(collection(db, "biblioteca_prestamos"));
      const listaPrestamos = [];
      snapPrestamos.forEach((d) => listaPrestamos.push({ id: d.id, ...d.data() }));
      setPrestamos(listaPrestamos);
    } catch (error) {
      console.error("Error al cargar datos globales:", error);
    } finally {
      setLoadingDatos(false);
    }
  };

  useEffect(() => {
    const sesionData = localStorage.getItem("usuario_sesion");
    if (!sesionData) {
      router.push("/");
      return;
    }
    const user = JSON.parse(sesionData);
    setUsuario(user);

    // Definir sección por defecto según rol
    if (user.rol === "admin") setSeccionActiva("vista_general");
    else if (user.rol === "secretaria") setSeccionActiva("control_docente");
    else if (user.rol === "alumno" || user.rol === "familia") setSeccionActiva("portal_familia");
    else if (user.rol === "biblioteca") setSeccionActiva("biblioteca");
    else setSeccionActiva("vista_general");

    // Cargar datos
    cargarDatosFirebase();
  }, [router]);

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="loading loading-spinner loading-lg text-blue-900"></span>
      </div>
    );
  }

const cerrarSesion = () => {
    localStorage.removeItem("usuario_sesion");
    localStorage.removeItem("dni"); 
    router.push("/");
  };

  // Filtros derivados
  const alumnosList = usuarios.filter((u) => (u.rol || "").toLowerCase() === "alumno");
  const docentesList = usuarios.filter((u) => (u.rol || "").toLowerCase() === "docente");
  const preceptoresList = usuarios.filter((u) => (u.rol || "").toLowerCase() === "preceptor");
  const prestamosActivos = prestamos.filter((p) => p.estado === "activo");

  return (
    <div data-theme="light" className="h-screen w-screen bg-slate-100 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      {/* Topbar Institucional Superior */}
      <header className="bg-[#1e295d] text-white h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="btn btn-ghost btn-square btn-sm text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative hidden sm:block">
              <Image src="/logo.png" alt="Logo" fill unoptimized className="object-contain" />
            </div>
            <div>
              <h1 className="font-black text-xs sm:text-sm tracking-wide uppercase text-blue-100">
                PORTAL ESCOLAR 
              </h1>
              <p className="text-[10px] text-blue-300 font-medium hidden sm:block">
                Colegio Provincial Presbítero Virgilio Carlos Ferreyra
              </p>
            </div>
          </div>
        </div>

        {/* Perfil de Usuario */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{usuario.nombre} {usuario.apellido}</p>
            <span className="badge badge-sm bg-cyan-500 text-blue-950 font-black border-none uppercase text-[9px]">
              {usuario.rol}
            </span>
          </div>
          <button 
            onClick={cerrarSesion}
            className="btn bg-rose-600 hover:bg-rose-700 btn-xs text-white font-bold rounded-lg uppercase tracking-wider border-none px-3"
          >
            SALIR 🚪
          </button>
        </div>
      </header>

      {/* Estructura Principal */}
      <div className="flex flex-1 overflow-hidden w-full">
        
        {/* Sidebar Lateral */}
        <aside className={`${sidebarAbierto ? "w-64" : "w-0 sm:w-16"} bg-white border-r border-slate-200 transition-all duration-300 overflow-y-auto flex flex-col justify-between shrink-0 z-30`}>
          <div className="p-3 space-y-1">
            
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
              Navegación
            </p>

            {/* Opciones ADMINISTRADOR */}
            {usuario.rol === "admin" && (
              <>
                <button 
                  onClick={() => setSeccionActiva("vista_general")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "vista_general" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  📊 Vista General
                </button>
                <button 
                  onClick={() => setSeccionActiva("crear_usuario")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "crear_usuario" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  👤 Crear Usuario
                </button>
                <button 
                  onClick={() => setSeccionActiva("lista_alumnos")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "lista_alumnos" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  👨‍🎓 Matrícula Alumnos
                </button>
                <button 
                  onClick={() => setSeccionActiva("preceptoria")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "preceptoria" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  📋 Preceptoría
                </button>
                <button 
                  onClick={() => setSeccionActiva("solicitudes_clave")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "solicitudes_clave" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  🔑 Solicitudes Clave ({solicitudesBlanqueo.length})
                </button>
              </>
            )}

            {/* Opciones SECRETARÍA */}
            {(usuario.rol === "secretaria" || usuario.rol === "admin") && (
              <>
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3">
                  Secretaría
                </p>
                <button 
                  onClick={() => setSeccionActiva("control_docente")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "control_docente" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  📝 Control Docente
                </button>
                <button 
                  onClick={() => setSeccionActiva("inscripcion_secretaria")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "inscripcion_secretaria" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  ✍️ Inscripciones
                </button>
                <button 
                  onClick={() => setSeccionActiva("libro_entrada_salida")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "libro_entrada_salida" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  📖 Libro de Pases
                </button>
                <button 
                  onClick={() => setSeccionActiva("gestion_correos")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "gestion_correos" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  ✉️ Correos
                </button>
              </>
            )}

            {/* Opciones FAMILIA / ALUMNO */}
            {(usuario.rol === "alumno" || usuario.rol === "familia" || usuario.rol === "admin") && (
              <>
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3">
                  Alumno / Familia
                </p>
                <button 
                  onClick={() => setSeccionActiva("portal_familia")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "portal_familia" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  🏫 Portal Familia
                </button>
              </>
            )}

            {/* BIBLIOTECA */}
            {(usuario.rol === "biblioteca" || usuario.rol === "admin") && (
              <button 
                onClick={() => setSeccionActiva("biblioteca")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${seccionActiva === "biblioteca" ? "bg-[#1e295d] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                📚 Biblioteca
              </button>
            )}

          </div>

          <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-center">
            VCF v1.0.0
          </div>
        </aside>

        {/* ÁREA DE TRABAJO AL 100% */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full h-full bg-slate-100">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs w-full min-h-full">
            
            {loadingDatos ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <span className="loading loading-spinner loading-lg text-[#1e295d]"></span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando datos del sistema...</p>
              </div>
            ) : (
              <>
                {seccionActiva === "vista_general" && (
                  <VistaGeneral 
                    alumnosCount={alumnosList.length}
                    docentesCount={docentesList.length}
                    librosCount={libros.length}
                    prestamosCount={prestamosActivos.length}
                    solicitudesBlanqueo={solicitudesBlanqueo}
                    setSeccionActiva={setSeccionActiva}
                  />
                )}
                {seccionActiva === "crear_usuario" && (
                  <CrearUsuario cursosDisponibles={cursosDisponibles} onUsuarioCreado={cargarDatosFirebase} />
                )}
                {seccionActiva === "lista_alumnos" && (
                  <ListaAlumnos usuarios={usuarios} onUpdate={cargarDatosFirebase} />
                )}
                {seccionActiva === "preceptoria" && (
                  <Preceptoria preceptores={preceptoresList} cursosDisponibles={cursosDisponibles} />
                )}
                {seccionActiva === "solicitudes_clave" && (
                  <SolicitudesClave solicitudes={solicitudesBlanqueo} onUpdate={cargarDatosFirebase} />
                )}
                {seccionActiva === "biblioteca" && (
                  <Biblioteca libros={libros} prestamos={prestamos} onUpdate={cargarDatosFirebase} />
                )}

                {seccionActiva === "control_docente" && <ControlDocenteYNovedades />}
                {seccionActiva === "inscripcion_secretaria" && <InscripcionSecretaria />}
                {seccionActiva === "libro_entrada_salida" && <LibroEntradaSalida />}
                {seccionActiva === "gestion_correos" && <GestionCorreos />}

                {seccionActiva === "portal_familia" && <FormularioPortalFamilia usuario={usuario} />}
              </>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}