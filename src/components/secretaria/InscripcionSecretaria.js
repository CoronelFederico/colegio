"use client";

import { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generarFichaPDF } from "@/lib/generarFichaPDF";

// 1. Declaramos las constantes iniciales fuera del componente
const ESTADO_INICIAL_ALUMNO = {
  dni: "",
  nombre: "",
  apellido: "",
  edad: "",
  fechaNacimiento: "",
  lugarNacimiento: "Anillaco, La Rioja",
  domicilio: "Pública S/N",
  telefono: "3804649880",
  nacionalidad: "Argentina",
  escuelaProcedencia: 'ESC. N° 103 "Coronel Nicolás Barros"',
  curso: "1° Primera (Ciclo Básico)",
  nombreTutor: "",
  dniTutor: "",
  domicilioTutor: "Pública S/N",
  correoTutor: "",
};

const ESTADO_INICIAL_CHECKLIST = {
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

export default function InscripcionSecretaria({ alCompletar }) {
  const [procesando, setProcesando] = useState(false);

  // Inicializamos con las constantes globales
  const [datosAlumno, setDatosAlumno] = useState(ESTADO_INICIAL_ALUMNO);
  const [checklist, setChecklist] = useState(ESTADO_INICIAL_CHECKLIST);

  const handleToggle = (campo) => {
    setChecklist((prev) => ({ ...prev, [campo]: !prev[campo] }));
  };

  const handleGuardarInscripcion = async (e) => {
    e.preventDefault();
    const dniLimpio = datosAlumno.dni.trim().replace(/\D/g, "");

    if (!dniLimpio || !datosAlumno.nombre || !datosAlumno.apellido) {
      alert("Por favor completá al menos DNI, Nombre y Apellido.");
      return;
    }

    setProcesando(true);
    try {
      const docRef = doc(db, "usuarios", dniLimpio);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert("⚠️ Este DNI ya se encuentra registrado.");
        setProcesando(false);
        return;
      }

      const totalPapeles = Object.keys(checklist).length;
      const entregados = Object.values(checklist).filter(Boolean).length;
      const estadoInscripcion =
        entregados === totalPapeles ? "Completa" : "Pendiente de Documentación";

      const paqueteInscripcion = {
        ...datosAlumno,
        dni: dniLimpio,
        nombre: datosAlumno.nombre.trim(),
        apellido: datosAlumno.apellido.trim(),
        rol: "alumno",
        password: dniLimpio,
        primerIngreso: true,
        sinideCompletado: false,
        documentacionInscripcion: {
          ...checklist,
          estado: estadoInscripcion,
          fechaInscripcion: new Date().toISOString(),
        },
        creadoEn: new Date().toISOString(),
      };

      // 1. Guardar en Firebase
      await setDoc(docRef, paqueteInscripcion);

      // 2. Enviar correo al tutor si colocó un email
      if (datosAlumno.correoTutor && datosAlumno.correoTutor.trim()) {
        try {
          await fetch("/api/enviar-mail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              correoTutor: datosAlumno.correoTutor.trim(),
              nombreTutor: datosAlumno.nombreTutor || "Padre / Tutor",
              nombreAlumno: `${datosAlumno.nombre.trim()} ${datosAlumno.apellido.trim()}`,
              dniAlumno: dniLimpio,
            }),
          });
        } catch (mailErr) {
          console.error("Error al enviar el correo:", mailErr);
        }
      }

      alert(
        `✅ Inscripción registrada correctamente (${entregados}/${totalPapeles} requisitos).`
      );

      // 3. Generar PDF
      await generarFichaPDF(datosAlumno, checklist);

      // 4. RESETEAR EL FORMULARIO
      setDatosAlumno(ESTADO_INICIAL_ALUMNO);
      setChecklist(ESTADO_INICIAL_CHECKLIST);

      if (alCompletar) alCompletar();
    } catch (err) {
      console.error("Error al registrar inscripción:", err);
      alert("⚠️ Error al guardar la inscripción.");
    } finally {
      setProcesando(false);
    }
  };

  return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900">
                    📝 Carga Breve de Inscripción - Secretaría
                </h2>
                <p className="text-slate-500 font-medium">
                    Anillaco - Castro Barros - La Rioja
                </p>
            </div>

            <form onSubmit={handleGuardarInscripcion} className="space-y-6">
                {/* 1. Datos Alumno */}
                <div className="space-y-3">
                    <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">
                        1. Datos del Solicitante (Alumno/a)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                DNI Alumno *
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.dni}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, dni: e.target.value })
                                }
                                placeholder="Ej: 52513208"
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Apellido *
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.apellido}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, apellido: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.nombre}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, nombre: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Curso Asignado *
                            </label>
                            <select
                                value={datosAlumno.curso}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, curso: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-bold outline-none"
                            >
                                <option value="1° Primera (Ciclo Básico)">
                                    1° Primera (Ciclo Básico)
                                </option>
                                <option value="1° Segunda (Ciclo Básico)">
                                    1° Segunda (Ciclo Básico)
                                </option>
                                <option value="2° Primera (Ciclo Básico)">
                                    2° Primera (Ciclo Básico)
                                </option>
                                <option value="3° Primera (Ciclo Orientado)">
                                    3° Primera (Ciclo Orientado)
                                </option>
                                <option value="4° Única (Ciclo Orientado)">
                                    4° Única (Ciclo Orientado)
                                </option>
                                <option value="5° Única (Finalización)">
                                    5° Única (Finalización)
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Edad
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.edad}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, edad: e.target.value })
                                }
                                placeholder="Ej: 12"
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Fecha Nacimiento
                            </label>
                            <input
                                type="date"
                                value={datosAlumno.fechaNacimiento}
                                onChange={(e) =>
                                    setDatosAlumno({
                                        ...datosAlumno,
                                        fechaNacimiento: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Lugar Nacimiento
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.lugarNacimiento}
                                onChange={(e) =>
                                    setDatosAlumno({
                                        ...datosAlumno,
                                        lugarNacimiento: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Domicilio Alumno
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.domicilio}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, domicilio: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Teléfono Contacto
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.telefono}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, telefono: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Escuela Procedencia
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.escuelaProcedencia}
                                onChange={(e) =>
                                    setDatosAlumno({
                                        ...datosAlumno,
                                        escuelaProcedencia: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Datos del Padre/Tutor */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">
                        2. Datos del Padre, Madre o Tutor Legal
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Nombre y Apellido Tutor
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.nombreTutor}
                                onChange={(e) =>
                                    setDatosAlumno({
                                        ...datosAlumno,
                                        nombreTutor: e.target.value,
                                    })
                                }
                                placeholder="Ej: Yanina Griselda Moreno"
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                DNI / CUIL Tutor
                            </label>
                            <input
                                type="text"
                                value={datosAlumno.dniTutor}
                                onChange={(e) =>
                                    setDatosAlumno({ ...datosAlumno, dniTutor: e.target.value })
                                }
                                placeholder="Ej: 27381234564"
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Correo Electrónico Tutor
                            </label>
                            <input
                                type="email"
                                value={datosAlumno.correoTutor}
                                onChange={(e) =>
                                    setDatosAlumno({
                                        ...datosAlumno,
                                        correoTutor: e.target.value,
                                    })
                                }
                                placeholder="tu_mail@ejemplo.com"
                                className="w-full px-3 py-2 border rounded-xl font-medium outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Checklist */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-extrabold text-slate-800 uppercase tracking-wide">
                        3. Checklist Documentación Física (Mesa de Entrada)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.fotocopiaDniAlumno}
                                onChange={() => handleToggle("fotocopiaDniAlumno")}
                                className="rounded text-blue-600"
                            />
                            <span>Fotocopia D.N.I. Alumno</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.partidaNacimiento}
                                onChange={() => handleToggle("partidaNacimiento")}
                                className="rounded text-blue-600"
                            />
                            <span>Fotocopia Partida de Nacimiento</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.constanciaCuilAlumno}
                                onChange={() => handleToggle("constanciaCuilAlumno")}
                                className="rounded text-blue-600"
                            />
                            <span>Constancia CUIL Alumno</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.informePedagogico}
                                onChange={() => handleToggle("informePedagogico")}
                                className="rounded text-blue-600"
                            />
                            <span>Informe Pedagógico 7° Grado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.certificadoAnalitico}
                                onChange={() => handleToggle("certificadoAnalitico")}
                                className="rounded text-blue-600"
                            />
                            <span>Certificado Analítico 7° Grado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.aptoFisico}
                                onChange={() => handleToggle("aptoFisico")}
                                className="rounded text-blue-600"
                            />
                            <span>Apto Físico (Buena Salud)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.certificadoDomicilio}
                                onChange={() => handleToggle("certificadoDomicilio")}
                                className="rounded text-blue-600"
                            />
                            <span>Certificado de Domicilio</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.carpetaEspiral}
                                onChange={() => handleToggle("carpetaEspiral")}
                                className="rounded text-blue-600"
                            />
                            <span>Carpeta tipo Espiral</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.cuadernoComunicacion}
                                onChange={() => handleToggle("cuadernoComunicacion")}
                                className="rounded text-blue-600"
                            />
                            <span>Cuaderno Comunicación (24/48hs)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.foliosOficio}
                                onChange={() => handleToggle("foliosOficio")}
                                className="rounded text-blue-600"
                            />
                            <span>4 Folios Oficio</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.fotosCarnet}
                                onChange={() => handleToggle("fotosCarnet")}
                                className="rounded text-blue-600"
                            />
                            <span>2 Fotos Carnet</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.fotocopiaDniTutor}
                                onChange={() => handleToggle("fotocopiaDniTutor")}
                                className="rounded text-blue-600"
                            />
                            <span>Fotocopia D.N.I. Tutor/a</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={checklist.constanciaCuilTutor}
                                onChange={() => handleToggle("constanciaCuilTutor")}
                                className="rounded text-blue-600"
                            />
                            <span>Constancia CUIL Tutor/a</span>
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={procesando}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                    {procesando
                        ? "Guardando y enviando..."
                        : "💾 Registrar Inscripción y Enviar Correo"}
                </button>
            </form>
        </div>
    );
}