"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "@/lib/firebase"; 
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function GestionDocentesPadron() {
  const [docentes, setDocentes] = useState([]);
  const [busquedaDni, setBusquedaDni] = useState("");
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar docentes desde Firestore al iniciar
  useEffect(() => {
    async function cargarDocentesDeFirebase() {
      try {
        const querySnapshot = await getDocs(collection(db, "docentes"));
        const lista = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (lista.length > 0) {
          setDocentes(lista);
        }
      } catch (error) {
        console.error("Error al cargar desde Firebase:", error);
      }
    }
    cargarDocentesDeFirebase();
  }, []);

  // Carga Masiva desde el Excel institucional
  const handleImportarExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        let nuevosDocentes = [];
        // Asumiendo que los datos comienzan a partir de la fila 4 o 5 de tu planilla
        for (let i = 4; i < data.length; i++) {
          const row = data[i];
          if (row[2] && row[1]) {
            const dniVal = String(row[2]).trim();
            const docenteObj = {
              dni: dniVal,
              apellidoNombre: String(row[1]).trim(),
              titulo: String(row[9] || "Sin especificar"),
              sitRevista: String(row[7] || "Titular"),
              estadoAcceso: "Activo",
              fotoUrl: "",
              telefono: String(row[5] || ""),
              email: String(row[4] || ""),
              fechaNacimiento: "",
              domicilio: "Anillaco, La Rioja",
              legajoCompleto: false,
              actualizadoEn: new Date().toISOString()
            };

            // Guardar masivamente en Firestore
            const docRef = doc(db, "docentes", dniVal);
            await setDoc(docRef, docenteObj, { merge: true });
            nuevosDocentes.push({ id: dniVal, ...docenteObj });
          }
        }

        if (nuevosDocentes.length > 0) {
          setDocentes(nuevosDocentes);
          alert(`✅ ¡Se importaron y guardaron ${nuevosDocentes.length} docentes en Firebase correctamente!`);
        } else {
          alert("⚠️ No se encontraron registros válidos en el archivo.");
        }
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        alert("❌ Error al leer o guardar el archivo en Firebase.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filtrado por DNI o Apellidos
  const docentesFiltrados = docentes.filter(
    (doc) =>
      String(doc.dni || "").includes(busquedaDni.trim()) ||
      String(doc.apellidoNombre || "").toLowerCase().includes(busquedaDni.toLowerCase().trim())
  );

  // Guardar cambios y subir foto a Firebase Storage + Firestore
const handleGuardarEnFirebase = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      let fotoUrlFinal = docenteSeleccionado.fotoUrl || "";

      // 1. Verificar si hay archivo nuevo para subir a Storage
      if (docenteSeleccionado.archivoFoto) {
        console.log("Iniciando subida de foto a Storage para DNI:", docenteSeleccionado.dni);
        const storageRef = ref(storage, `fotos_perfil/${docenteSeleccionado.dni}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, docenteSeleccionado.archivoFoto);
        console.log("Foto subida con éxito a Storage:", snapshot);

        // Obtener URL pública
        fotoUrlFinal = await getDownloadURL(storageRef);
        console.log("URL de descarga obtenida:", fotoUrlFinal);
      }

      // 2. Preparamos el objeto actualizado
      const datosActualizados = {
        dni: docenteSeleccionado.dni,
        apellidoNombre: docenteSeleccionado.apellidoNombre,
        titulo: docenteSeleccionado.titulo || "",
        sitRevista: docenteSeleccionado.sitRevista || "",
        estadoAcceso: docenteSeleccionado.estadoAcceso || "Activo",
        telefono: docenteSeleccionado.telefono || "",
        email: docenteSeleccionado.email || "",
        fechaNacimiento: docenteSeleccionado.fechaNacimiento || "",
        domicilio: docenteSeleccionado.domicilio || "",
        fotoUrl: fotoUrlFinal,
        legajoCompleto: true,
        actualizadoEn: new Date().toISOString()
      };

      console.log("Guardando datos en Firestore...");
      const docRef = doc(db, "docentes", String(docenteSeleccionado.dni));
      await setDoc(docRef, datosActualizados, { merge: true });
      console.log("Datos guardados en Firestore con éxito.");

      // Actualizar estado local
      setDocentes((prev) =>
        prev.map((d) => (d.dni === docenteSeleccionado.dni ? { ...d, ...datosActualizados } : d))
      );

      alert("✅ ¡Legajo y foto guardados correctamente en Firebase!");
      setDocenteSeleccionado(null);
    } catch (error) {
      console.error("Error detallado al guardar en Firebase:", error);
      alert(`❌ Error al guardar: ${error.message || "Verificá la consola del navegador"}`);
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionarFoto = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const previewUrl = URL.createObjectURL(archivo);
    setDocenteSeleccionado((prev) => ({
      ...prev,
      fotoUrl: previewUrl,
      archivoFoto: archivo,
    }));
  };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-base font-black text-[#1e295d] uppercase tracking-wider">
              👨‍🏫 Padrón Docente & Importación Masiva
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Administración de personal. Buscá por DNI o subí la base completa por Excel una sola vez.
            </p>
          </div>

          {/* Botón de Carga Masiva por Excel */}
          <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto text-xs">
            📊 Importar Plantilla Excel a Firebase
            <input type="file" accept=".xlsx, .xls, .xlsm" onChange={handleImportarExcel} className="hidden" />
          </label>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar docente por número de DNI o Apellidos..."
            value={busquedaDni}
            onChange={(e) => setBusquedaDni(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-hidden focus:border-[#1e295d] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* GRILLA DE DOCENTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {docentesFiltrados.map((doc) => (
          <div
            key={doc.dni || doc.id}
            onClick={() => setDocenteSeleccionado(doc)}
            className="p-5 bg-white border border-slate-200 hover:border-[#1e295d] rounded-3xl shadow-2xs transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-500 text-sm overflow-hidden shrink-0">
                {doc.fotoUrl ? (
                  <img src={doc.fotoUrl} alt={doc.apellidoNombre} className="w-full h-full object-cover" />
                ) : (
                  doc.apellidoNombre?.charAt(0)
                )}
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  doc.estadoAcceso === "Activo" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {doc.estadoAcceso || "Activo"}
              </span>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xs line-clamp-1 group-hover:text-[#1e295d]">
                {doc.apellidoNombre}
              </h3>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">DNI: {doc.dni}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-medium">{doc.sitRevista}</span>
              <span className="font-bold text-[#1e295d] group-hover:underline">Ver Legajo en Nube →</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE EDICIÓN */}
      {docenteSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-[#1e295d] uppercase">{docenteSeleccionado.apellidoNombre}</h3>
                <p className="text-slate-400 text-[11px] font-mono">DNI: {docenteSeleccionado.dni}</p>
              </div>
              <button
                type="button"
                onClick={() => setDocenteSeleccionado(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEnFirebase} className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center font-black text-slate-600 text-xl overflow-hidden shrink-0">
                  {docenteSeleccionado.fotoUrl ? (
                    <img src={docenteSeleccionado.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    docenteSeleccionado.apellidoNombre?.charAt(0)
                  )}
                </div>
                <div className="space-y-1 text-[11px] w-full">
                  <label className="block font-bold text-slate-700">Foto de Perfil (Firebase Storage)</label>
                  <label className="inline-block px-3 py-1.5 bg-white border border-slate-300 hover:border-[#1e295d] text-slate-700 font-bold rounded-xl cursor-pointer transition-all">
                    📷 Cambiar foto...
                    <input type="file" accept="image/*" onChange={handleSeleccionarFoto} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-[#1e295d] text-xs uppercase border-b pb-1">
                  ✏️ Datos de Contacto y Personales
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={docenteSeleccionado.telefono || ""}
                      onChange={(e) => setDocenteSeleccionado({ ...docenteSeleccionado, telefono: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={docenteSeleccionado.fechaNacimiento || ""}
                      onChange={(e) => setDocenteSeleccionado({ ...docenteSeleccionado, fechaNacimiento: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={docenteSeleccionado.email || ""}
                    onChange={(e) => setDocenteSeleccionado({ ...docenteSeleccionado, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domicilio</label>
                  <input
                    type="text"
                    value={docenteSeleccionado.domicilio || ""}
                    onChange={(e) => setDocenteSeleccionado({ ...docenteSeleccionado, domicilio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setDocenteSeleccionado(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="px-5 py-2 bg-[#1e295d] hover:bg-[#151e42] text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {cargando ? "Guardando..." : "💾 Guardar en Firebase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}