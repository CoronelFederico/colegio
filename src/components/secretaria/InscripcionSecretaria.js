"use client";

import { useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generarFichaPDF } from "@/lib/generarFichaPDF";

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
  const [datosAlumno, setDatosAlumno] = useState(ESTADO_INICIAL_ALUMNO);
  const [checklist, setChecklist] = useState(ESTADO_INICIAL_CHECKLIST);

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

        // 🟢 Marcamos que la Ficha de Inscripción física fue entregada al dar el alta
        fichaInscripcionCompletada: true,

        documentacionInscripcion: {
          ...checklist,
          fichaInscripcion: true, // Clave para el semáforo de la Secretaría
          estado: estadoInscripcion,
          fechaInscripcion: new Date().toISOString(),
        },
        creadoEn: new Date().toISOString(),
      };

      await setDoc(docRef, paqueteInscripcion);

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

      await generarFichaPDF(datosAlumno, checklist);

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
    <div className="space-y-6 text-xs text-slate-800">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-lg font-black text-[#1e295d] uppercase tracking-tight">
            📝 Secretaría Escolar • Alta de Estudiantes
          </h2>
          <p className="text-slate-500 font-medium">
            Colegio Provincial Presbítero Virgilio Carlos Ferreyra • Anillaco, La Rioja
          </p>
        </div>
        <span className="badge badge-primary font-bold uppercase tracking-wider">
          Módulo Inscripciones
        </span>
      </div>

      <form onSubmit={handleGuardarInscripcion} className="space-y-8">
        {/* 1. Datos Alumno */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="font-extrabold text-[#1e295d] uppercase tracking-wider text-sm flex items-center gap-2">
            <span>👤</span> 1. Datos del Solicitante (Alumno/a)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                DNI Alumno *
              </label>
              <input
                type="text"
                value={
                  datosAlumno.dni
                    ? Number(datosAlumno.dni).toLocaleString("es-AR")
                    : ""
                }
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, "");
                  setDatosAlumno({ ...datosAlumno, dni: soloNumeros });
                }}
                placeholder="Ej: 52.513.208"
                maxLength={12}
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
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
                placeholder="Apellido del alumno"
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
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
                placeholder="Nombre del alumno"
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Curso Asignado *
              </label>
              <select
                value={datosAlumno.curso}
                onChange={(e) =>
                  setDatosAlumno({ ...datosAlumno, curso: e.target.value })
                }
                className="select select-bordered w-full h-10 bg-white font-bold text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
              >
                <option value="1° Primera (Ciclo Básico)">1° Primera (Ciclo Básico)</option>
                <option value="1° Segunda (Ciclo Básico)">1° Segunda (Ciclo Básico)</option>
                <option value="2° Primera (Ciclo Básico)">2° Primera (Ciclo Básico)</option>
                <option value="3° Primera (Ciclo Orientado)">3° Primera (Ciclo Orientado)</option>
                <option value="4° Única (Ciclo Orientado)">4° Única (Ciclo Orientado)</option>
                <option value="5° Única (Finalización)">5° Única (Finalización)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Edad (Automática)
              </label>
              <input
                type="text"
                value={datosAlumno.edad}
                readOnly
                placeholder="Autocalculada"
                className="input input-bordered w-full h-10 bg-slate-100 font-extrabold text-slate-700 border-slate-300 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Fecha Nacimiento
              </label>
              <input
                type="date"
                value={datosAlumno.fechaNacimiento}
                onChange={(e) => {
                  const nuevaFecha = e.target.value;
                  const edadCalc = calcularEdad(nuevaFecha);
                  setDatosAlumno({
                    ...datosAlumno,
                    fechaNacimiento: nuevaFecha,
                    edad: edadCalc,
                  });
                }}
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
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
                  setDatosAlumno({ ...datosAlumno, lugarNacimiento: e.target.value })
                }
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
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
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
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
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
              />
            </div>
          </div>
        </div>

        {/* 2. Datos del Padre/Tutor */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="font-extrabold text-[#1e295d] uppercase tracking-wider text-sm flex items-center gap-2">
            <span>👨‍👩‍👦</span> 2. Datos del Padre, Madre o Tutor Legal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nombre y Apellido Tutor
              </label>
              <input
                type="text"
                value={datosAlumno.nombreTutor}
                onChange={(e) =>
                  setDatosAlumno({ ...datosAlumno, nombreTutor: e.target.value })
                }
                placeholder="Ej: Yanina Griselda Moreno"
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
              />
            </div>

        <div>
              <label className="block font-bold text-slate-700 mb-1">
                DNI / CUIL Tutor
              </label>
              <input
                type="text"
                value={
                  datosAlumno.dniTutor
                    ? datosAlumno.dniTutor.length >= 10
                      ? datosAlumno.dniTutor // Si parece un CUIL largo, lo dejamos tal cual o lo formateamos
                      : Number(datosAlumno.dniTutor).toLocaleString("es-AR") // Si es DNI, le pone puntos
                    : ""
                }
                onChange={(e) => {
                  // Extraemos únicamente los números para guardar el dato limpio
                  const soloNumeros = e.target.value.replace(/\D/g, "");
                  setDatosAlumno({ ...datosAlumno, dniTutor: soloNumeros });
                }}
                placeholder="Ej: 27381234564"
                maxLength={15}
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
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
                  setDatosAlumno({ ...datosAlumno, correoTutor: e.target.value })
                }
                placeholder="tu_mail@ejemplo.com"
                className="input input-bordered w-full h-10 bg-white font-medium text-slate-900 border-slate-300 focus:border-[#1e295d] text-xs"
              />
            </div>
          </div>
        </div>

        {/* 3. Checklist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
          <h3 className="font-extrabold text-[#1e295d] uppercase tracking-wider text-sm flex items-center gap-2">
            <span>📋</span> 3. Checklist Documentación Física (Mesa de Entrada)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-medium">
            {Object.keys(ESTADO_INICIAL_CHECKLIST).map((key) => {
              const labels = {
                fotocopiaDniAlumno: "Fotocopia D.N.I. Alumno",
                partidaNacimiento: "Fotocopia Partida de Nacimiento",
                constanciaCuilAlumno: "Constancia CUIL Alumno",
                informePedagogico: "Informe Pedagógico 7° Grado",
                certificadoAnalitico: "Certificado Analítico 7° Grado",
                aptoFisico: "Apto Físico (Buena Salud)",
                certificadoDomicilio: "Certificado de Domicilio",
                carpetaEspiral: "Carpeta tipo Espiral",
                cuadernoComunicacion: "Cuaderno Comunicación (24/48hs)",
                foliosOficio: "4 Folios Oficio",
                fotosCarnet: "2 Fotos Carnet",
                fotocopiaDniTutor: "Fotocopia D.N.I. Tutor/a",
                constanciaCuilTutor: "Constancia CUIL Tutor/a",
              };

              return (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={checklist[key]}
                    onChange={() => handleToggle(key)}
                    className="checkbox checkbox-xs checkbox-primary rounded-xs"
                  />
                  <span className="text-slate-700 font-semibold">
                    {labels[key]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={procesando}
          className="w-full h-12 bg-[#1e295d] hover:bg-[#151e42] text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-md transition-all disabled:opacity-50"
        >
          {procesando
            ? "Guardando inscripción en Firestore..."
            : "💾 Registrar Inscripción y Enviar Credenciales"}
        </button>
      </form>
    </div>
  );
}