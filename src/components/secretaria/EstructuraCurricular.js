"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PLAN_ESTUDIOS_OFICIAL = [
  {
    anio: "1er Año",
    divisiones: ["1ro Primera", "1ro Segunda"],
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Geografía",
      "Formación Ética y Ciudadana",
      "Educación Física",
      "Biología",
      "Historia",
      "Lengua Extranjera",
      "Física y Química",
      "Educación Tecnológica",
      "Educación Artística",
    ],
  },
  {
    anio: "2do Año",
    divisiones: ["2do Primera", "2do Segunda"],
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Geografía",
      "Formación Ética y Ciudadana",
      "Educación Física",
      "Biología",
      "Historia",
      "Lengua Extranjera",
      "Física y Química",
      "Educación Tecnológica",
      "Educación Artística",
    ],
  },
  {
    anio: "3er Año",
    divisiones: ["3ro Primera", "3ro Segunda"],
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Geografía",
      "Construcción de Ciudadanía",
      "Educación Física",
      "Biología",
      "Historia",
      "Lengua Extranjera",
      "Física",
      "Psicología",
      "Educación Artística",
      "Comunicación, Cultura y Sociedad",
    ],
  },
  {
    anio: "4to Año",
    divisiones: ["4to Única"],
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Geografía",
      "Construcción de Ciudadanía",
      "Educación Física",
      "Química",
      "Historia",
      "Lengua Extranjera",
      "Ciencia, Tecnología y Sociedad",
      "Ciencias Políticas",
      "Espacio Opcional*",
      "Economía",
    ],
  },
  {
    anio: "5to Año",
    divisiones: ["5to Única"],
    asignaturas: [
      "Lengua y Literatura",
      "Matemática",
      "Política y Gestión Ambiental",
      "Construcción de Ciudadanía",
      "Educación Física",
      "Proyecto de Investigación e Intervención socio-comunitaria",
      "Filosofía",
      "Lengua Extranjera",
      "Ciencia, Tecnología y Sociedad",
      "Sociología",
      "Espacio Opcional*",
      "Antropología",
    ],
  },
];

export default function EstructuraCurricular() {
  const [anioSeleccionado, setAnioSeleccionado] = useState("1er Año");
  const [cargandoFirestore, setCargandoFirestore] = useState(false);

  const cursoActual = PLAN_ESTUDIOS_OFICIAL.find((c) => c.anio === anioSeleccionado);

  // Función privada para enviar toda la estructura maestro a Firestore
  const handleGuardarColeccionTotal = async () => {
    if (!confirm("¿Deseas subir y sincronizar toda la estructura de materias y divisiones a Firebase?")) return;

    setCargandoFirestore(true);
    try {
      for (const item of PLAN_ESTUDIOS_OFICIAL) {
        for (const division of item.divisiones) {
          for (const materia of item.asignaturas) {
            const idGenerado = `${item.anio.toLowerCase().replace(/\s+/g, "_")}_${division.toLowerCase().replace(/\s+/g, "_")}_${materia.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
            
            // Guardamos cada combinación en la colección "materias_institucionales"
            await addDoc(collection(db, "materias_institucionales"), {
              idUnico: idGenerado,
              anio: item.anio,
              division: division,
              asignatura: materia,
              docenteAsignado: "",
              actualizadoEn: new Date().toISOString(),
            });
          }
        }
      }
      alert("✅ ¡Estructura curricular completa subida y registrada con éxito en Firestore!");
    } catch (error) {
      console.error("Error al subir estructura:", error);
      alert("⚠️ Hubo un error al registrar las materias en la base de datos.");
    } finally {
      setCargandoFirestore(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Encabezado y Botón de Sincronización Privada */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-black text-[#1e295d] uppercase tracking-wider">
            📚 Estructura Curricular & Asignaturas por Curso
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Plan de estudios oficial con sus respectivas divisiones y asignación de ID para control docente.
          </p>
        </div>

        <button
          type="button"
          disabled={cargandoFirestore}
          onClick={handleGuardarColeccionTotal}
          className="px-5 py-2.5 bg-[#1e295d] hover:bg-[#151e42] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {cargandoFirestore ? "⏳ Sincronizando..." : "☁️ Sincronizar Colección Total a Firestore"}
        </button>
      </div>

      {/* Selector de Años */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl font-bold">
        {PLAN_ESTUDIOS_OFICIAL.map((item) => (
          <button
            key={item.anio}
            onClick={() => setAnioSeleccionado(item.anio)}
            className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition-all cursor-pointer ${
              anioSeleccionado === item.anio
                ? "bg-white text-[#1e295d] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.anio}
          </button>
        ))}
      </div>

      {/* Detalle de Asignaturas y Divisiones del Curso Seleccionado */}
      {cursoActual && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
          
          {/* Divisiones habilitadas */}
          <div className="flex items-center gap-2 border-b pb-4">
            <span className="font-extrabold text-slate-400 uppercase text-[10px]">Divisiones Habilitadas:</span>
            <div className="flex gap-2">
              {cursoActual.divisiones.map((div, idx) => (
                <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg font-bold text-xs">
                  {div}
                </span>
              ))}
            </div>
          </div>

          {/* Listado de Asignaturas con su ID único */}
          <div>
            <h3 className="font-black text-[#1e295d] text-sm uppercase mb-3">
              Asignaturas Oficiales ({cursoActual.asignaturas.length} materias)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cursoActual.asignaturas.map((materia, index) => {
                const idGenerado = `${cursoActual.anio.toLowerCase().replace(/\s+/g, "_")}_${materia.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

                return (
                  <div
                    key={index}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 text-xs">
                        {index + 1}. {materia}
                      </span>
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-mono text-[9px]">
                        ID: {idGenerado}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium">Docente a cargo: <strong className="text-[#1e295d]">Sin asignar</strong></span>
                      <button
                        type="button"
                        onClick={() => alert(`Asignar docente para: ${materia} (${cursoActual.anio})`)}
                        className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        + Asignar Docente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}