// app/horarios/page.js
"use client";

import { useState, useEffect } from "react";
import { db, app } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import Link from "next/link";

const MODULOS = [
  { id: 1, hora: "8:00 - 8:40", esRecreo: false },
  { id: 2, hora: "8:40 - 9:20", esRecreo: false },
  { id: 3, hora: "9:20 - 9:30", esRecreo: true, nombre: "Recreo" },
  { id: 4, hora: "9:30 - 10:10", esRecreo: false },
  { id: 5, hora: "10:10 - 10:50", esRecreo: false },
  { id: 6, hora: "10:50 - 11:00", esRecreo: true, nombre: "Recreo" },
  { id: 7, hora: "11:00 - 11:40", esRecreo: false },
  { id: 8, hora: "11:40 - 12:20", esRecreo: false },
  { id: 9, hora: "12:20 - 13:00", esRecreo: false },
  { id: 10, hora: "13:00 - 13:40", esRecreo: false },
];

const CURSOS = [
  "1er Año Primera",
  "1er Año Segunda",
  "2do Año Primera",
  "2do Año Segunda",
  "3er Año Primera",
  "3er Año Segunda",
  "4to Año Única",
  "5to Año Única",
];

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const CLAVE_ADMIN = "admin123";

export default function HorariosPage() {
  const [esAdmin, setEsAdmin] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState("Lunes");
  const [horarios, setHorarios] = useState({});
  const [profesores, setProfesores] = useState([]);

  // Login Modal
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorLogin, setErrorLogin] = useState(false);

  // Modales Gestión
  const [bloqueEditar, setBloqueEditar] = useState(null);
  const [casillaNuevoBloque, setCasillaNuevoBloque] = useState(null);
  const [bloqueAMover, setBloqueAMover] = useState(null);

  // Formulario Asignación
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const [materiasDisponiblesDocente, setMateriasDisponiblesDocente] = useState([]);

  // Estado para Mover
  const [nuevoModuloDestino, setNuevoModuloDestino] = useState("");

  // Cargar lista de profesores
  useEffect(() => {
    const unsubProfs = onSnapshot(collection(db, "profesores"), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProfesores(lista);
    });
    return () => unsubProfs();
  }, []);

  // Cargar horarios según día
  useEffect(() => {
    const q = query(
      collection(db, "horarios"),
      where("dia", "==", diaSeleccionado)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapaHorarios = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const clave = `${data.modulo}-${data.curso}`;
        mapaHorarios[clave] = { id: docSnap.id, ...data };
      });
      setHorarios(mapaHorarios);
    });

    return () => unsubscribe();
  }, [diaSeleccionado]);

  // Pedir permiso e inscribirse a Notificaciones Push
  const solicitarPermisoNotificaciones = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const messaging = getMessaging(app);
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
          console.error(
            "Falta definir NEXT_PUBLIC_VAPID_PUBLIC_KEY en tus variables de entorno."
          );
          return;
        }

        const token = await getToken(messaging, {
          vapidKey: vapidPublicKey,
        });

        await fetch("/api/suscribir-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, topic: "alertas-generales" }),
        });

        alert("¡Notificaciones Push activadas en este dispositivo!");
      } else {
        alert("Permiso de notificaciones denegado.");
      }
    } catch (error) {
      console.error("Error al activar notificaciones:", error);
    }
  };

  // Disparar alertas a la API cuando se detecte/marque ausencia
  const enviarAlerta = async (docente, curso, materia) => {
    try {
      const res = await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docente, curso, materia }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Alerta enviada correctamente por push");
      }
    } catch (error) {
      console.error("Error al llamar a la API:", error);
    }
  };

  const handleSeleccionarDocente = (e) => {
    const nombreDocente = e.target.value;
    setDocenteSeleccionado(nombreDocente);

    const prof = profesores.find((p) => p.nombre === nombreDocente);
    if (prof) {
      if (Array.isArray(prof.materias) && prof.materias.length > 0) {
        setMateriasDisponiblesDocente(prof.materias);
        setNuevaMateria(prof.materias[0]);
      } else if (prof.especialidad) {
        setMateriasDisponiblesDocente([prof.especialidad]);
        setNuevaMateria(prof.especialidad);
      }
    } else {
      setMateriasDisponiblesDocente([]);
      setNuevaMateria("");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === CLAVE_ADMIN) {
      setEsAdmin(true);
      setMostrarModalLogin(false);
      setPasswordInput("");
      setErrorLogin(false);
    } else {
      setErrorLogin(true);
    }
  };

  const guardarNuevaClase = async (e) => {
    e.preventDefault();
    if (!esAdmin || !nuevaMateria || !docenteSeleccionado || !casillaNuevoBloque) return;

    const profObj = profesores.find((p) => p.nombre === docenteSeleccionado);
    const idDocumento = `${diaSeleccionado.toLowerCase()}_${casillaNuevoBloque.modulo}_${casillaNuevoBloque.curso.replace(/\s+/g, "_")}`;

    await setDoc(doc(db, "horarios", idDocumento), {
      dia: diaSeleccionado,
      modulo: casillaNuevoBloque.modulo,
      curso: casillaNuevoBloque.curso,
      materia: nuevaMateria,
      docente: docenteSeleccionado,
      color: profObj?.color || null,
      estado: "normal",
    });

    setCasillaNuevoBloque(null);
    setNuevaMateria("");
    setDocenteSeleccionado("");
    setMateriasDisponiblesDocente([]);
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    if (!esAdmin) return;
    const docRef = doc(db, "horarios", id);
    await updateDoc(docRef, { estado: nuevoEstado });

    // Si cambió a ausente, dispara la notificación
    if (nuevoEstado === "ausente" && bloqueEditar) {
      await enviarAlerta(bloqueEditar.docente, bloqueEditar.curso, bloqueEditar.materia);
    }

    setBloqueEditar(null);
  };

  const liberarCasillero = async (id) => {
    if (!esAdmin) return;
    if (confirm("¿Deseas quitar esta materia y dejar la hora libre?")) {
      await deleteDoc(doc(db, "horarios", id));
      setBloqueEditar(null);
    }
  };

  const moverModulo = async (e) => {
    e.preventDefault();
    if (!bloqueAMover || !nuevoModuloDestino) return;

    const moduloDestinoNum = parseInt(nuevoModuloDestino);
    const idNuevoDoc = `${diaSeleccionado.toLowerCase()}_${moduloDestinoNum}_${bloqueAMover.curso.replace(/\s+/g, "_")}`;

    await setDoc(doc(db, "horarios", idNuevoDoc), {
      dia: diaSeleccionado,
      modulo: moduloDestinoNum,
      curso: bloqueAMover.curso,
      materia: bloqueAMover.materia,
      docente: bloqueAMover.docente,
      color: bloqueAMover.color || null,
      estado: "normal",
    });

    await deleteDoc(doc(db, "horarios", bloqueAMover.id));

    setBloqueAMover(null);
    setBloqueEditar(null);
    setNuevoModuloDestino("");
  };

  return (
    <div className="p-3 sm:p-6 w-full max-w-[98vw] mx-auto space-y-4">
      {/* Botón superior de volver y notificaciones */}
      <div className="flex justify-between items-center gap-2">
        <Link
          href="/"
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all"
        >
          ← Volver al Inicio
        </Link>
        <button
          onClick={solicitarPermisoNotificaciones}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          🔔 Probar / Activar Alertas Push
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Gestión de Horarios Escolar
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                esAdmin
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              {esAdmin ? "Modo Administrador" : "Modo Visitante"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {esAdmin
              ? "Edita horarios, marca ausencias y adelanta módulos."
              : "Vista pública de consulta."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {esAdmin && (
            <Link
              href="/docentes"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-all shadow-sm text-center flex items-center justify-center gap-1"
            >
              👨‍🏫 Gestionar Docentes
            </Link>
          )}

          {!esAdmin ? (
            <button
              onClick={() => setMostrarModalLogin(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-xs transition-all shadow-sm"
            >
              🔐 Ingresar como Admin
            </button>
          ) : (
            <button
              onClick={() => setEsAdmin(false)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs transition-all border"
            >
              🚪 Cerrar Sesión
            </button>
          )}

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border overflow-x-auto max-w-full">
            {DIAS.map((dia) => (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(dia)}
                className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all whitespace-nowrap ${
                  diaSeleccionado === dia
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200 w-full">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px] lg:min-w-full">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="p-2 sm:p-3 border-r w-28 sm:w-36 text-center font-semibold text-xs sm:text-sm sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Módulo / Hora
              </th>
              {CURSOS.map((curso) => (
                <th
                  key={curso}
                  className="p-2 sm:p-3 border-r text-center font-semibold text-xs sm:text-sm min-w-[140px] lg:min-w-[0px]"
                >
                  {curso}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULOS.map((modulo) => {
              if (modulo.esRecreo) {
                return (
                  <tr key={modulo.id} className="bg-amber-50/60 border-b">
                    <td className="p-2 border-r text-center font-medium text-amber-800 bg-amber-100/50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="text-xs font-bold">{modulo.nombre}</div>
                    </td>
                    <td
                      colSpan={CURSOS.length}
                      className="p-2 text-center text-amber-700 font-semibold uppercase tracking-wider text-xs"
                    >
                      ☕ Descanso ({modulo.hora})
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={modulo.id} className="border-b hover:bg-gray-50/30">
                  <td className="p-2 sm:p-3 border-r text-center font-medium text-gray-600 bg-gray-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="font-bold text-gray-800 text-xs sm:text-sm">
                      Mód. {modulo.id}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                      {modulo.hora}
                    </div>
                  </td>

                  {CURSOS.map((curso) => {
                    const clave = `${modulo.id}-${curso}`;
                    const bloque = horarios[clave];

                    return (
                      <td key={curso} className="p-1.5 sm:p-2 border-r align-top">
                        {bloque ? (
                          <div
                            onClick={() => {
                              if (esAdmin) setBloqueEditar(bloque);
                            }}
                            className={`p-2 sm:p-3 rounded-lg border transition-all ${
                              esAdmin ? "cursor-pointer hover:shadow-md" : "cursor-default"
                            } ${
                              bloque.estado === "ausente"
                                ? "bg-red-50 border-red-300 text-red-900"
                                : bloque.color
                                ? `${bloque.color.bg} ${bloque.color.border}${bloque.color.text}`
                                : "bg-emerald-50 border-emerald-200 text-emerald-900"
                            }`}
                          >
                            <div className="font-semibold text-xs sm:text-sm leading-tight">
                              {bloque.materia}
                            </div>
                            <div className="text-[11px] sm:text-xs opacity-80 mt-1 truncate">
                              👤 {bloque.docente}
                            </div>
                            {bloque.estado === "ausente" && (
                              <span className="inline-block mt-1 text-[9px] sm:text-[10px] bg-red-200 text-red-800 font-bold px-1.5 py-0.5 rounded">
                                AUSENTE
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            disabled={!esAdmin}
                            onClick={() =>
                              setCasillaNuevoBloque({ modulo: modulo.id, curso })
                            }
                            className={`w-full h-14 sm:h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-[11px] sm:text-xs ${
                              esAdmin
                                ? "border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer"
                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                            }`}
                          >
                            {esAdmin ? "+ Asignar" : "Libre"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Login */}
      {mostrarModalLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800">Acceso Administrador</h3>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setErrorLogin(false);
              }}
              placeholder="Contraseña"
              className="w-full p-2 border rounded-lg text-sm"
            />
            {errorLogin && (
              <p className="text-xs text-red-600">Contraseña incorrecta.</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalLogin(false)}
                className="py-2 px-4 border rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Asignar clase */}
      {casillaNuevoBloque && esAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={guardarNuevaClase}
            className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800">
              Asignar Módulo {casillaNuevoBloque.modulo}
            </h3>
            <p className="text-xs text-gray-500">{casillaNuevoBloque.curso}</p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Seleccionar Docente
              </label>
              <select
                required
                value={docenteSeleccionado}
                onChange={handleSeleccionarDocente}
                className="w-full p-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Elige un docente --</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Materia Asignada
              </label>
              <select
                required
                disabled={!docenteSeleccionado}
                value={nuevaMateria}
                onChange={(e) => setNuevaMateria(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {materiasDisponiblesDocente.length === 0 ? (
                  <option value="">-- Selecciona primero un docente --</option>
                ) : (
                  materiasDisponiblesDocente.map((m, idx) => (
                    <option key={idx} value={m}>
                      {m}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCasillaNuevoBloque(null);
                  setMateriasDisponiblesDocente([]);
                }}
                className="py-2 px-4 border text-gray-600 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Editar Estado / Adelantar / Liberar */}
      {bloqueEditar && esAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800">
              {bloqueEditar.materia}
            </h3>
            <p className="text-xs text-gray-500">
              {bloqueEditar.curso} — Módulo {bloqueEditar.modulo} (Docente: {bloqueEditar.docente})
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => cambiarEstado(bloqueEditar.id, "ausente")}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-xs text-left px-3 border border-red-200"
              >
                🚨 Marcar Ausente
              </button>

              <button
                onClick={() => cambiarEstado(bloqueEditar.id, "normal")}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium text-xs text-left px-3 border border-emerald-200"
              >
                ✅ Estado Normal
              </button>

              <button
                onClick={() => {
                  setBloqueAMover(bloqueEditar);
                  setBloqueEditar(null);
                }}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-xs text-left px-3 border border-blue-200"
              >
                🔄 Adelantar / Mover de Módulo
              </button>

              <button
                onClick={() => liberarCasillero(bloqueEditar.id)}
                className="p-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-lg font-medium text-xs text-left px-3 border"
              >
                🗑️ Vaciar / Dejar hora libre
              </button>
            </div>

            <button
              onClick={() => setBloqueEditar(null)}
              className="w-full mt-2 py-2 border text-gray-600 rounded-lg text-xs font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Mover / Adelantar Hora */}
      {bloqueAMover && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={moverModulo}
            className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800">
              Mover {bloqueAMover.materia}
            </h3>
            <p className="text-xs text-gray-500">
              Curso: <strong>{bloqueAMover.curso}</strong>
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Selecciona el Módulo Destino
              </label>
              <select
                required
                value={nuevoModuloDestino}
                onChange={(e) => setNuevoModuloDestino(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Elige un módulo --</option>
                {MODULOS.filter((m) => !m.esRecreo && m.id !== bloqueAMover.modulo).map(
                  (m) => (
                    <option key={m.id} value={m.id}>
                      Módulo {m.id} ({m.hora})
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium"
              >
                Confirmar Cambio
              </button>
              <button
                type="button"
                onClick={() => setBloqueAMover(null)}
                className="py-2 px-4 border rounded-lg text-xs font-medium text-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}