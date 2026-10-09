"use client";

import { useState } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Biblioteca({ libros, prestamos, usuarios, cargarDatos }) {
  const [subModulo, setSubModulo] = useState("catalogo"); // 'catalogo' | 'prestamos' | 'nuevo-libro'
  const [procesando, setProcesando] = useState(false);

  const [nuevoLibro, setNuevoLibro] = useState({
    titulo: "",
    autor: "",
    isbn: "",
    categoria: "Literatura",
    stock: 1,
  });

  const [nuevoPrestamo, setNuevoPrestamo] = useState({
    libroId: "",
    usuarioDni: "",
    fechaDevolucion: "",
  });

  const prestamosActivos = prestamos.filter((p) => p.estado === "activo");

  const handleCrearLibro = async (e) => {
    e.preventDefault();
    if (!nuevoLibro.titulo || !nuevoLibro.autor) {
      alert("Ingresá al menos el título y el autor del libro.");
      return;
    }

    setProcesando(true);
    try {
      const docData = {
        titulo: nuevoLibro.titulo.trim(),
        autor: nuevoLibro.autor.trim(),
        isbn: nuevoLibro.isbn.trim() || "N/A",
        categoria: nuevoLibro.categoria,
        stock: parseInt(nuevoLibro.stock) || 1,
        disponibles: parseInt(nuevoLibro.stock) || 1,
        creadoEn: new Date().toISOString(),
      };

      await addDoc(collection(db, "biblioteca_libros"), docData);
      alert("📚 Libro agregado al catálogo correctamente.");
      setNuevoLibro({ titulo: "", autor: "", isbn: "", categoria: "Literatura", stock: 1 });
      cargarDatos();
      setSubModulo("catalogo");
    } catch (error) {
      console.error("Error al crear libro:", error);
      alert("Error al registrar el libro.");
    } finally {
      setProcesando(false);
    }
  };

  const handleCrearPrestamo = async (e) => {
    e.preventDefault();
    if (!nuevoPrestamo.libroId || !nuevoPrestamo.usuarioDni || !nuevoPrestamo.fechaDevolucion) {
      alert("Completá todos los datos del préstamo.");
      return;
    }

    const libroSeleccionado = libros.find((l) => l.id === nuevoPrestamo.libroId);
    if (!libroSeleccionado || libroSeleccionado.disponibles <= 0) {
      alert("Este libro no tiene ejemplares disponibles para préstamo.");
      return;
    }

    const usuarioPrestamista = usuarios.find((u) => u.dni === nuevoPrestamo.usuarioDni);
    if (!usuarioPrestamista) {
      alert("No se encontró ningún usuario registrado con ese DNI.");
      return;
    }

    setProcesando(true);
    try {
      await addDoc(collection(db, "biblioteca_prestamos"), {
        libroId: libroSeleccionado.id,
        libroTitulo: libroSeleccionado.titulo,
        usuarioDni: usuarioPrestamista.dni,
        usuarioNombre: `${usuarioPrestamista.apellido}, ${usuarioPrestamista.nombre}`,
        fechaPrestamo: new Date().toISOString(),
        fechaDevolucionEstimada: nuevoPrestamo.fechaDevolucion,
        estado: "activo",
      });

      const libroRef = doc(db, "biblioteca_libros", libroSeleccionado.id);
      await updateDoc(libroRef, {
        disponibles: libroSeleccionado.disponibles - 1,
      });

      alert("✅ Préstamo registrado correctamente.");
      setNuevoPrestamo({ libroId: "", usuarioDni: "", fechaDevolucion: "" });
      cargarDatos();
      setSubModulo("prestamos");
    } catch (error) {
      console.error("Error al registrar préstamo:", error);
      alert("No se pudo registrar el préstamo.");
    } finally {
      setProcesando(false);
    }
  };

  const handleDevolverLibro = async (prestamo) => {
    if (!window.confirm(`¿Confirmar devolución del libro "${prestamo.libroTitulo}"?`)) return;

    setProcesando(true);
    try {
      await updateDoc(doc(db, "biblioteca_prestamos", prestamo.id), {
        estado: "devuelto",
        fechaDevolucionReal: new Date().toISOString(),
      });

      const libroRel = libros.find((l) => l.id === prestamo.libroId);
      if (libroRel) {
        await updateDoc(doc(db, "biblioteca_libros", libroRel.id), {
          disponibles: (libroRel.disponibles || 0) + 1,
        });
      }

      alert("✅ Libro devuelto y reingresado al stock.");
      cargarDatos();
    } catch (error) {
      console.error("Error al devolver libro:", error);
      alert("Ocurrió un error al procesar la devolución.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">📚 Módulo Biblioteca Escolar</h2>
          <p className="text-xs text-slate-500">Gestión del catálogo de libros, préstamos y devoluciones.</p>
        </div>

        <div className="flex gap-2 bg-slate-200 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSubModulo("catalogo")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subModulo === "catalogo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            📖 Catálogo ({libros.length})
          </button>
          <button
            onClick={() => setSubModulo("prestamos")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subModulo === "prestamos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            🔄 Préstamos ({prestamosActivos.length})
          </button>
          <button
            onClick={() => setSubModulo("nuevo-libro")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subModulo === "nuevo-libro" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
            }`}
          >
            ➕ Nuevo Libro
          </button>
        </div>
      </div>

      {subModulo === "catalogo" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {libros.length === 0 ? (
            <p className="p-8 text-xs text-slate-400 text-center font-medium">
              No hay libros registrados en la biblioteca aún.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {libros.map((libro) => (
                <div key={libro.id} className="p-4 flex justify-between items-center text-xs hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">{libro.titulo}</p>
                    <p className="text-slate-500 text-[11px]">Autor: {libro.autor} | ISBN/Código: {libro.isbn}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-slate-100 font-bold rounded-lg text-[10px] text-slate-700">
                      Disponibles: {libro.disponibles} / {libro.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subModulo === "prestamos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Registrar Nuevo Préstamo</h3>
            <form onSubmit={handleCrearPrestamo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seleccionar Libro</label>
                <select
                  value={nuevoPrestamo.libroId}
                  onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, libroId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {libros.filter((l) => l.disponibles > 0).map((l) => (
                    <option key={l.id} value={l.id}>{l.titulo} ({l.disponibles} disps.)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI del Alumno/Docente</label>
                <input
                  type="text"
                  placeholder="DNI del usuario"
                  value={nuevoPrestamo.usuarioDni}
                  onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, usuarioDni: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Devolución Estimada</label>
                <input
                  type="date"
                  value={nuevoPrestamo.fechaDevolucion}
                  onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, fechaDevolucion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={procesando}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                Confirmar Préstamo
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Préstamos Activos ({prestamosActivos.length})</h3>
            {prestamosActivos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hay préstamos pendientes de devolución.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {prestamosActivos.map((p) => (
                  <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{p.libroTitulo}</p>
                      <p className="text-slate-500 text-[11px]">Prestado a: {p.usuarioNombre} (DNI: {p.usuarioDni})</p>
                      <p className="text-slate-400 text-[10px]">Devolución estim.: {p.fechaDevolucionEstimada}</p>
                    </div>
                    <button
                      onClick={() => handleDevolverLibro(p)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-[11px] transition-all"
                    >
                      Marcar Devolución
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subModulo === "nuevo-libro" && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cargar Libro al Catálogo</h3>
          <form onSubmit={handleCrearLibro} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título del Libro</label>
              <input
                type="text"
                placeholder="Ej: Cien años de soledad"
                value={nuevoLibro.titulo}
                onChange={(e) => setNuevoLibro({ ...nuevoLibro, titulo: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Autor</label>
                <input
                  type="text"
                  placeholder="Ej: Gabriel García Márquez"
                  value={nuevoLibro.autor}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, autor: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ISBN / Código</label>
                <input
                  type="text"
                  placeholder="Código único"
                  value={nuevoLibro.isbn}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, isbn: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={nuevoLibro.categoria}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, categoria: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="Literatura">Literatura</option>
                  <option value="Historia">Historia</option>
                  <option value="Ciencias Exactas">Ciencias Exactas</option>
                  <option value="Manuales">Manuales Escolares</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad de Ejemplares</label>
                <input
                  type="number"
                  min="1"
                  value={nuevoLibro.stock}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, stock: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              {procesando ? "Guardando..." : "Guardar Libro en Biblioteca"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}