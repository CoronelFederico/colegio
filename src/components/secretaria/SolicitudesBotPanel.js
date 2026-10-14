"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // Asegúrate de que esta sea la ruta de tu firebase en lib/
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";

export default function SolicitudesBotPanel() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "solicitudes"), 
      orderBy("fechaCreacion", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        fechaTexto: d.data().fechaCreacion?.toDate
          ? d.data().fechaCreacion.toDate().toLocaleString("es-AR")
          : "Reciente"
      }));
      setSolicitudes(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error al escuchar solicitudes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const solicitudRef = doc(db, "solicitudes", id);
      await updateDoc(solicitudRef, {
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("No se pudo actualizar el estado.");
    }
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (filtroEstado === "todos") return true;
    return s.estado === filtroEstado;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            🤖 Solicitudes y Consultas de WhatsApp
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Gestión en tiempo real de los reportes generados por el bot del colegio.
          </p>
        </div>

        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          {["todos", "pendiente", "completado", "rechazado"].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                filtroEstado === est
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {est === "todos" ? "Todas" : est}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Cargando solicitudes...</div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 text-sm">
          No hay solicitudes en esta categoría.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Usuario / Estudiante</th>
                  <th className="p-4">Curso</th>
                  <th className="p-4">Motivo del Reporte</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {solicitudesFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">
                        {item.nombreUsuario} {item.apellidoUsuario}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        DNI: {item.dni} | Tel: {item.telefono}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-700">
                      {item.curso || "N/D"}
                    </td>

                    <td className="p-4 max-w-xs truncate text-slate-600" title={item.motivo}>
                      "{item.motivo}"
                    </td>

                    <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                      {item.fechaTexto}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          item.estado === "pendiente"
                            ? "bg-amber-50 text-amber-600 border border-amber-200/50"
                            : item.estado === "completado"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                            : "bg-rose-50 text-rose-600 border border-rose-200/50"
                        }`}
                      >
                        {item.estado}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1.5">
                        {item.estado !== "completado" && (
                          <button
                            onClick={() => cambiarEstado(item.id, "completado")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold transition-colors shadow-sm"
                          >
                            ✓ Resolver
                          </button>
                        )}
                        {item.estado !== "rechazado" && (
                          <button
                            onClick={() => cambiarEstado(item.id, "rechazado")}
                            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-2.5 py-1 rounded-lg font-bold transition-colors"
                          >
                            ✕ Rechazar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}