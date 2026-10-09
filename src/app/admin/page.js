// src/app/admin/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

// Importación de Módulos Separados
import VistaGeneral from "@/components/admin/VistaGeneral";
import CrearUsuario from "@/components/admin/CrearUsuario";
import ListaAlumnos from "@/components/admin/ListaAlumnos";
import Preceptoria from "@/components/admin/Preceptoria";
import Biblioteca from "@/components/admin/Biblioteca";
import SolicitudesClave from "@/components/admin/SolicitudesClave";

export default function AdminDashboardPage() {
  const [moduloActivo, setModuloActivo] = useState("general");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Estados Globales
  const [usuarios, setUsuarios] = useState([]);
  const [solicitudesBlanqueo, setSolicitudesBlanqueo] = useState([]);
  const [libros, setLibros] = useState([]);
  const [prestamos, setPrestamos] = useState([]);

const cursosDisponibles = [
  "1° Primera (Ciclo Básico)",
  "1° Segunda (Ciclo Básico)",
  "2° Primera (Ciclo Básico)",
  "2° Segunda (Ciclo Básico)",
  "3° Primera (Ciclo Orientado)",
  "3° Segunda (Ciclo Orientado)",
  "4° Única (Ciclo Orientado)",
  "5° Única (Finalización de Nivel)"
];

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar Usuarios
      const querySnap = await getDocs(collection(db, "usuarios"));
      const listaUsuarios = [];
      querySnap.forEach((d) => listaUsuarios.push({ id: d.id, ...d.data() }));
      setUsuarios(listaUsuarios);

      // 2. Cargar Solicitudes de Blanqueo Pendientes
      const qBlanqueo = query(collection(db, "solicitudes_blanqueo"), where("estado", "==", "pendiente"));
      const snapBlanqueo = await getDocs(qBlanqueo);
      const listaBlanqueos = [];
      snapBlanqueo.forEach((d) => listaBlanqueos.push({ id: d.id, ...d.data() }));
      setSolicitudesBlanqueo(listaBlanqueos);

      // 3. Cargar Libros
      const snapLibros = await getDocs(collection(db, "biblioteca_libros"));
      const listaLibros = [];
      snapLibros.forEach((d) => listaLibros.push({ id: d.id, ...d.data() }));
      setLibros(listaLibros);

      // 4. Cargar Préstamos
      const snapPrestamos = await getDocs(collection(db, "biblioteca_prestamos"));
      const listaPrestamos = [];
      snapPrestamos.forEach((d) => listaPrestamos.push({ id: d.id, ...d.data() }));
      setPrestamos(listaPrestamos);

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtros por rol
  const alumnosList = usuarios.filter((u) => (u.rol || "").toLowerCase() === "alumno");
  const docentesList = usuarios.filter((u) => (u.rol || "").toLowerCase() === "docente");
  const preceptoresList = usuarios.filter((u) => (u.rol || "").toLowerCase() === "preceptor");
  const prestamosActivos = prestamos.filter((p) => p.estado === "activo");

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 space-y-6">
      <div className="px-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Portal Administrador
        </h2>
        <p className="text-sm font-black text-amber-400">Pbro. Virgilio Ferreyra</p>
      </div>

      <nav className="space-y-1 text-xs font-bold">
        {/* Panel General */}
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span>⚙️</span>
          <span>Panel de Administración</span>
        </Link>

        {/* 🏫 MÓDULO SECRETARÍA ESCOLAR */}
        <Link
          href="/secretaria"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-blue-600 hover:text-white transition-all"
        >
          <span>📝</span>
          <span>Secretaría & Inscripciones</span>
        </Link>

        {/* 👥 MÓDULO PRECEPTORÍA */}
        <Link
          href="/preceptor"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span>📋</span>
          <span>Preceptoría & Asistencia</span>
        </Link>

        {/* 📚 MÓDULO BIBLIOTECA */}
        <Link
          href="/biblioteca"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span>📚</span>
          <span>Biblioteca Escolar</span>
        </Link>

        {/* 👨‍👩‍👧 PORTAL FAMILIAS */}
        <Link
          href="/familia"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span>🏠</span>
          <span>Relevamiento SINIDE</span>
        </Link>
      </nav>
    </aside>
  );
}