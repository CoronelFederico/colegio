"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ConfiguracionInstitucional() {
  const [radioEnVivo, setRadioEnVivo] = useState(false);
  const [urlRadio, setUrlRadio] = useState("");
  
  // 1. Nuevo estado para la historia
  const [historiaTexto, setHistoriaTexto] = useState("");
  
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoHistoria, setGuardandoHistoria] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Cargar configuración de la radio
      const configRef = doc(db, "configuracion", "radio");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        setRadioEnVivo(data.enVivo || false);
        setUrlRadio(data.urlStream || "");
      }

      // 2. Cargar Reseña Histórica desde Firestore
      const historiaSnap = await getDoc(doc(db, "configuracion", "historia"));
      if (historiaSnap.exists()) {
        setHistoriaTexto(historiaSnap.data().contenido || "");
      }

      // Cargar mensajes de contacto
      const snapMensajes = await getDocs(collection(db, "mensajes_contacto"));
      const listaMensajes = [];
      snapMensajes.forEach((d) => listaMensajes.push({ id: d.id, ...d.data() }));
      setMensajes(listaMensajes);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarRadio = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const configRef = doc(db, "configuracion", "radio");
      await setDoc(configRef, {
        enVivo: radioEnVivo,
        urlStream: urlRadio.trim(),
        actualizadoEn: new Date().toISOString()
      }, { merge: true });
      alert("¡Configuración de la radio guardada con éxito!");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
    } finally {
      setGuardando(false);
    }
  };

  // 3. Función para guardar la Reseña Histórica
  const handleGuardarHistoria = async (e) => {
    e.preventDefault();
    setGuardandoHistoria(true);
    try {
      await setDoc(doc(db, "configuracion", "historia"), {
        contenido: historiaTexto.trim(),
        actualizadoEn: new Date().toISOString()
      }, { merge: true });
      alert("¡Reseña histórica actualizada con éxito!");
    } catch (error) {
      console.error("Error al guardar la historia:", error);
      alert("Ocurrió un error al guardar.");
    } finally {
      setGuardandoHistoria(false);
    }
  };

  if (cargando) {
    return <div className="text-xs text-slate-500 p-4">Cargando panel de configuración...</div>;
  }

  return (
    <div className="space-y-8 text-left">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-black text-slate-900">Panel de Control & Configuración Institucional</h2>
        <p className="text-xs text-slate-500">Administra la radio, la reseña histórica y revisa las consultas web.</p>
      </div>

      {/* Formulario de Configuración de la Radio */}
      <form onSubmit={handleGuardarRadio} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">📻 Configuración de la Radio Escolar</h3>
        
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-700">Estado de Transmisión (En Vivo)</p>
            <p className="text-[11px] text-slate-500">Activa o desactiva el indicador en la Landing Page.</p>
          </div>
          <input 
            type="checkbox" 
            checked={radioEnVivo} 
            onChange={(e) => setRadioEnVivo(e.target.checked)}
            className="toggle toggle-primary" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Enlace de Streaming (URL del reproductor o web)
          </label>
          <input
            type="text"
            value={urlRadio}
            onChange={(e) => setUrlRadio(e.target.value)}
            placeholder="Ej: https://tuusuario.listen2myradio.com"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar Cambios de la Radio"}
        </button>
      </form>

      {/* 4. Formulario NUEVO para editar la Reseña Histórica */}
      <form onSubmit={handleGuardarHistoria} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🏛️ Editar Reseña Histórica (Landing Page)</h3>
        
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Contenido de la Reseña Histórica
          </label>
          <textarea
            value={historiaTexto}
            onChange={(e) => setHistoriaTexto(e.target.value)}
            rows="6"
            placeholder="Escribí la historia del colegio aquí..."
            className="w-full p-4 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 resize-y"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={guardandoHistoria}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
        >
          {guardandoHistoria ? "Guardando..." : "Guardar Reseña Histórica"}
        </button>
      </form>

      {/* Mensajes de Contacto Recibidos */}
      {/* ... (resto de tus mensajes de contacto que ya tenías) ... */}
    </div>
  );
}