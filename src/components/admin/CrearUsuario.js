"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";

const CURSOS_DEFAULT = [
  "1° Primera (Ciclo Básico)",
  "1° Segunda (Ciclo Básico)",
  "2° Primera (Ciclo Básico)",
  "2° Segunda (Ciclo Básico)",
  "3° Primera (Ciclo Orientado)",
  "3° Segunda (Ciclo Orientado)",
  "4° Única (Ciclo Orientado)",
  "5° Única (Finalización de Nivel)"
];

const formatearValor = (valor) => {
  if (!valor) return "-";
  if (typeof valor === "object") {
    const { dia, mes, anio } = valor;
    if (dia || mes || anio) {
      return `${dia || ""}/${mes || ""}/${anio || ""}`.replace(/^\/|\/$/g, "");
    }
    return JSON.stringify(valor);
  }
  return String(valor);
};

export default function CrearUsuario({ usuarios = [], cursosDisponibles = CURSOS_DEFAULT, cargarDatos }) {
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const listaCursos = cursosDisponibles.length > 0 ? cursosDisponibles : CURSOS_DEFAULT;

  const [nuevoUsuario, setNuevoUsuario] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    rol: "alumno",
    curso: listaCursos[0],
    fechaNacimiento: "",
    lugarNacimiento: "",
    domicilio: "",
    telefonoContacto: "",
    tutorNombre: "",
  });

  // 🔑 NUEVA ACCIÓN: Blanquear Contraseña desde el Panel de Admin
  const handleBlanquearClave = async (u) => {
    const confirmacion = window.confirm(
      `¿Seguro que querés blanquear la contraseña de ${u.apellido}, ${u.nombre}?\n\n` +
      `La clave volverá a ser su DNI (${u.dni}) y se le solicitará cambiarla en su próximo ingreso.`
    );

    if (!confirmacion) return;

    setProcesando(true);
    try {
      const userRef = doc(db, "usuarios", u.id);
      await updateDoc(userRef, {
        password: u.dni,
        primerIngreso: true,
      });

      alert(`✅ Contraseña de ${u.nombre} ${u.apellido} restablecida a su DNI (${u.dni}).`);
      if (cargarDatos) cargarDatos();
    } catch (error) {
      console.error("Error al blanquear la contraseña:", error);
      alert("⚠️ Ocurrió un error al intentar restablecer la contraseña.");
    } finally {
      setProcesando(false);
    }
  };

  // Alta Individual
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    const dniLimpio = nuevoUsuario.dni.trim().replace(/\./g, "");

    if (!dniLimpio || !nuevoUsuario.nombre || !nuevoUsuario.apellido) {
      alert("Por favor completá DNI, Nombre y Apellido.");
      return;
    }

    setProcesando(true);
    try {
      const nuevoDoc = {
        dni: dniLimpio,
        nombre: nuevoUsuario.nombre.trim(),
        apellido: nuevoUsuario.apellido.trim(),
        rol: nuevoUsuario.rol,
        curso: nuevoUsuario.rol === "alumno" ? nuevoUsuario.curso : "N/A",
        fechaNacimiento: nuevoUsuario.fechaNacimiento || "",
        lugarNacimiento: nuevoUsuario.lugarNacimiento.trim() || "",
        domicilio: nuevoUsuario.domicilio.trim() || "",
        telefonoContacto: nuevoUsuario.telefonoContacto.trim() || "",
        tutorNombre: nuevoUsuario.rol === "alumno" ? nuevoUsuario.tutorNombre.trim() : "",
        password: dniLimpio,
        primerIngreso: true,
        creadoEn: new Date().toISOString(),
      };

      await addDoc(collection(db, "usuarios"), nuevoDoc);
      alert(`✅ Usuario (${nuevoUsuario.rol.toUpperCase()}) registrado con éxito.`);

      setNuevoUsuario({
        dni: "",
        nombre: "",
        apellido: "",
        rol: "alumno",
        curso: listaCursos[0],
        fechaNacimiento: "",
        lugarNacimiento: "",
        domicilio: "",
        telefonoContacto: "",
        tutorNombre: "",
      });

      if (cargarDatos) cargarDatos();
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("⚠️ Error al guardar en la base de datos.");
    } finally {
      setProcesando(false);
    }
  };

  // Carga Masiva
  const handleCargaMasivaExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcesando(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const bstr = event.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("⚠️ El archivo Excel está vacío.");
          setProcesando(false);
          return;
        }

        let batch = writeBatch(db);
        let contadorOps = 0;
        let totalCargados = 0;

        for (const fila of data) {
          const dni = String(fila.DNI || fila.dni || "").trim().replace(/\./g, "");
          const nombre = String(fila.Nombre || fila.nombre || "").trim();
          const apellido = String(fila.Apellido || fila.apellido || "").trim();
          const rol = String(fila.Rol || fila.rol || "alumno").toLowerCase().trim();
          const curso = String(fila.Curso || fila.curso || listaCursos[0]).trim();

          if (!dni || !nombre || !apellido) continue;

          const docRef = doc(collection(db, "usuarios"));
          batch.set(docRef, {
            dni,
            nombre,
            apellido,
            rol,
            curso: rol === "alumno" ? curso : "N/A",
            fechaNacimiento: String(fila.FechaNacimiento || fila.fechaNacimiento || ""),
            lugarNacimiento: String(fila.LugarNacimiento || fila.lugarNacimiento || ""),
            domicilio: String(fila.Domicilio || fila.domicilio || ""),
            telefonoContacto: String(fila.Telefono || fila.telefonoContacto || ""),
            tutorNombre: String(fila.Tutor || fila.tutorNombre || ""),
            password: dni,
            primerIngreso: true,
            creadoEn: new Date().toISOString(),
          });

          contadorOps++;
          totalCargados++;

          if (contadorOps === 450) {
            await batch.commit();
            batch = writeBatch(db);
            contadorOps = 0;
          }
        }

        if (contadorOps > 0) {
          await batch.commit();
        }

        alert(`✅ Carga masiva completada: ${totalCargados} usuarios procesados.`);
        if (cargarDatos) cargarDatos();
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        alert("⚠️ Error al procesar el archivo Excel. Verificá el formato de las columnas.");
      } finally {
        setProcesando(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  // Vaciar Base de Datos
  const handleVaciarBaseDeDatos = async () => {
    const confirmacion1 = window.confirm(
      "⚠️ ¿ESTÁS ABSOLUTAMENTE SEGURO DE ELIMINAR TODOS LOS USUARIOS?\nEsta acción no se puede deshacer."
    );
    if (!confirmacion1) return;

    const confirmacion2 = window.prompt(
      'Escribí "BORRAR TODO" para confirmar la eliminación completa de los legajos:'
    );
    if (confirmacion2 !== "BORRAR TODO") {
      alert("Operación cancelada.");
      return;
    }

    setProcesando(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      let batch = writeBatch(db);
      let contadorOps = 0;

      for (const documento of querySnapshot.docs) {
        batch.delete(doc(db, "usuarios", documento.id));
        contadorOps++;

        if (contadorOps === 450) {
          await batch.commit();
          batch = writeBatch(db);
          contadorOps = 0;
        }
      }

      if (contadorOps > 0) {
        await batch.commit();
      }

      alert("🗑️ Se eliminaron todos los registros de la base de datos.");
      if (cargarDatos) cargarDatos();
    } catch (error) {
      console.error("Error al vaciar la base de datos:", error);
      alert("⚠️ Hubo un error al intentar vaciar la base de datos.");
    } finally {
      setProcesando(false);
    }
  };

  // Guardar Edición
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setProcesando(true);
    try {
      const userRef = doc(db, "usuarios", usuarioEditando.id);
      await updateDoc(userRef, {
        nombre: usuarioEditando.nombre.trim(),
        apellido: usuarioEditando.apellido.trim(),
        rol: usuarioEditando.rol,
        curso: usuarioEditando.rol === "alumno" ? usuarioEditando.curso : "N/A",
        fechaNacimiento: typeof usuarioEditando.fechaNacimiento === "object"
          ? formatearValor(usuarioEditando.fechaNacimiento)
          : (usuarioEditando.fechaNacimiento || ""),
        lugarNacimiento: (usuarioEditando.lugarNacimiento || "").trim(),
        domicilio: (usuarioEditando.domicilio || "").trim(),
        telefonoContacto: (usuarioEditando.telefonoContacto || "").trim(),
        tutorNombre: (usuarioEditando.tutorNombre || "").trim(),
        primerIngreso: usuarioEditando.primerIngreso,
      });

      alert("✅ Legajo actualizado correctamente.");
      setUsuarioEditando(null);
      if (cargarDatos) cargarDatos();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      alert("⚠️ Ocurrió un error al guardar los cambios.");
    } finally {
      setProcesando(false);
    }
  };

  // Eliminar Un Usuario
  const handleEliminarUsuario = async (u) => {
    if (!window.confirm(`¿Seguro que querés eliminar a ${u.apellido}, ${u.nombre} (DNI: ${u.dni})?`)) return;

    setProcesando(true);
    try {
      await deleteDoc(doc(db, "usuarios", u.id));
      alert("🗑️ Usuario eliminado.");
      if (cargarDatos) cargarDatos();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("⚠️ Ocurrió un error al borrar el usuario.");
    } finally {
      setProcesando(false);
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter((u) => {
    const termino = busqueda.toLowerCase();
    const dni = String(u.dni || "");
    const nombreCompleto = `${u.apellido || ""} ${u.nombre || ""}`.toLowerCase();
    const curso = String(u.curso || "").toLowerCase();
    return dni.includes(termino) || nombreCompleto.includes(termino) || curso.includes(termino);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* HERRAMIENTAS DE CARGA Y VACIADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
            📊 Carga Masiva desde Excel (.xlsx / .csv)
          </h3>
          <p className="text-xs text-emerald-700">
            Columnas soportadas: <code className="font-bold">DNI, Nombre, Apellido, Rol, Curso, FechaNacimiento, Domicilio, Tutor, Telefono</code>.
          </p>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleCargaMasivaExcel}
            disabled={procesando}
            className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
          />
        </div>

        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
              🚨 Mantenimiento Crítico
            </h3>
            <p className="text-xs text-rose-700">
              Permite vaciar por completo la colección de usuarios en Firestore para reiniciar el ciclo lectivo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleVaciarBaseDeDatos}
            disabled={procesando}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            🗑️ Vaciar Base de Datos Completa
          </button>
        </div>
      </div>

      {/* 1️⃣ FORMULARIO DE ALTA INDIVIDUAL */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-900">➕ Registrar Nuevo Usuario / Legajo</h2>
          <p className="text-xs text-slate-500">
            Ingresá los datos del estudiante o personal administrativo/docente/biblioteca.
          </p>
        </div>

        <form onSubmit={handleCrearUsuario} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol Institucional</label>
              <select
                value={nuevoUsuario.rol}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="alumno">Alumno / Familia</option>
                <option value="docente">Docente</option>
                <option value="preceptor">Preceptor</option>
                <option value="secretaria">Secretaria</option>
                <option value="biblioteca">Bibliotecario / Biblioteca</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">DNI (Usuario/Clave)</label>
              <input
                type="text"
                value={nuevoUsuario.dni}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, dni: e.target.value })}
                placeholder="Ej: 45123456"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            {nuevoUsuario.rol === "alumno" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Curso Asignado</label>
                <select
                  value={nuevoUsuario.curso}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, curso: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {listaCursos.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                placeholder="Nombre"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellido</label>
              <input
                type="text"
                value={nuevoUsuario.apellido}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
                placeholder="Apellido"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={nuevoUsuario.fechaNacimiento}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, fechaNacimiento: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lugar de Nacimiento</label>
              <input
                type="text"
                value={nuevoUsuario.lugarNacimiento}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, lugarNacimiento: e.target.value })}
                placeholder="Ej: Córdoba, Argentina"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domicilio</label>
              <input
                type="text"
                value={nuevoUsuario.domicilio}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, domicilio: e.target.value })}
                placeholder="Calle y Número"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {nuevoUsuario.rol === "alumno" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Vínculo del Tutor</label>
                <input
                  type="text"
                  value={nuevoUsuario.tutorNombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, tutorNombre: e.target.value })}
                  placeholder="Ej: María Pérez (Madre)"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={nuevoUsuario.telefonoContacto}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefonoContacto: e.target.value })}
                  placeholder="Ej: 351 153456789"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={procesando}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {procesando ? "Guardando..." : "Guardar Registro en Legajo"}
            </button>
          </div>
        </form>
      </div>

      {/* 2️⃣ MODAL DE EDICIÓN */}
      {usuarioEditando && (
        <div className="bg-amber-50 p-6 sm:p-8 rounded-3xl border border-amber-200 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-amber-200 pb-3">
            <div>
              <h3 className="text-sm font-black text-amber-900">
                ✏️ Editar Legajo: {formatearValor(usuarioEditando.apellido)}, {formatearValor(usuarioEditando.nombre)}
              </h3>
              <p className="text-[11px] text-amber-700">DNI: {formatearValor(usuarioEditando.dni)}</p>
            </div>
            <button
              onClick={() => setUsuarioEditando(null)}
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              ✖ Cancelar
            </button>
          </div>

          <form onSubmit={handleGuardarEdicion} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Nombre</label>
                <input
                  type="text"
                  value={usuarioEditando.nombre || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Apellido</label>
                <input
                  type="text"
                  value={usuarioEditando.apellido || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, apellido: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Rol</label>
                <select
                  value={usuarioEditando.rol || "alumno"}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, rol: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="alumno">Alumno</option>
                  <option value="docente">Docente</option>
                  <option value="preceptor">Preceptor</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="biblioteca">Bibliotecario / Biblioteca</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {usuarioEditando.rol === "alumno" && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Curso (Promoción / Repitencia)
                  </label>
                  <select
                    value={usuarioEditando.curso || ""}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, curso: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    {listaCursos.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Estado Primer Ingreso
                </label>
                <select
                  value={usuarioEditando.primerIngreso ? "true" : "false"}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, primerIngreso: e.target.value === "true" })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="true">⚠️ Pendiente (Clave por defecto)</option>
                  <option value="false">✅ Contraseña Cambiada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Fecha de Nacimiento</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={typeof usuarioEditando.fechaNacimiento === "object" ? formatearValor(usuarioEditando.fechaNacimiento) : (usuarioEditando.fechaNacimiento || "")}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, fechaNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Lugar de Nacimiento</label>
                <input
                  type="text"
                  value={usuarioEditando.lugarNacimiento || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, lugarNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Domicilio</label>
                <input
                  type="text"
                  value={usuarioEditando.domicilio || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, domicilio: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Tutor / Familiar</label>
                <input
                  type="text"
                  value={usuarioEditando.tutorNombre || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, tutorNombre: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={usuarioEditando.telefonoContacto || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, telefonoContacto: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="submit"
                disabled={procesando}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {procesando ? "Guardando..." : "💾 Guardar Cambios"}
              </button>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3️⃣ TABLA DE USUARIOS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              👥 Legajos Escolares y Usuarios ({usuariosFiltrados.length})
            </h3>
            <p className="text-xs text-slate-500">
              Podés consultar todos los datos del alumno, tutor, domicilio y estado de clave.
            </p>
          </div>

          <input
            type="text"
            placeholder="🔍 Buscar DNI, Nombre, Curso..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {usuariosFiltrados.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center font-medium">
            No se encontraron usuarios registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Estudiante / Usuario</th>
                  <th className="py-3 px-3">DNI</th>
                  <th className="py-3 px-3">Curso / Rol</th>
                  <th className="py-3 px-3">Fec. Nac / Lugar</th>
                  <th className="py-3 px-3">Tutor / Contacto</th>
                  <th className="py-3 px-3">Primer Ingreso</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const esAlumno = (u.rol || "").toLowerCase() === "alumno";
                  const estadoPrimerIngreso = u.primerIngreso ?? true;
                  const rolLimpio = (u.rol || "").toLowerCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {formatearValor(u.apellido)}, {formatearValor(u.nombre)}
                        </div>
                        {u.domicilio && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            📍 {formatearValor(u.domicilio)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {formatearValor(u.dni)}
                      </td>

                      <td className="py-3 px-3">
                        {esAlumno ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded">
                            {formatearValor(u.curso)}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${rolLimpio === "biblioteca"
                            ? "bg-purple-100 text-purple-800"
                            : rolLimpio === "docente"
                              ? "bg-emerald-100 text-emerald-800"
                              : rolLimpio === "preceptor"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                            {formatearValor(u.rol)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div>{formatearValor(u.fechaNacimiento)}</div>
                        {u.lugarNacimiento && (
                          <div className="text-[10px] text-slate-400">{formatearValor(u.lugarNacimiento)}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div>{formatearValor(u.tutorNombre)}</div>
                        {u.telefonoContacto && (
                          <div className="text-[10px] text-slate-500 font-mono">📞 {formatearValor(u.telefonoContacto)}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {estadoPrimerIngreso ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                            ⚠️ Pendiente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                            ✅ Registrada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right space-x-1">
                        {/* 🔑 Botón para Blanquear Clave directamente */}
                        <button
                          onClick={() => handleBlanquearClave(u)}
                          title="Restablecer clave al DNI"
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
                        >
                          🔑 Blanquear
                        </button>
                        <button
                          onClick={() => setUsuarioEditando(u)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleEliminarUsuario(u)}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] rounded-lg transition-all"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}