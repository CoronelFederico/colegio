"use client";

import { useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SolicitudesClave({ solicitudes = [], onUpdate }) {
  const [procesando, setProcesando] = useState(false);

  const handleBlanquearPassword = async (solicitud) => {
    if (!window.confirm(`¿Blanquear contraseña de ${solicitud.nombre} a su DNI (${solicitud.dni})?`)) return;

    setProcesando(true);
    try {
      const qUser = query(collection(db, "usuarios"), where("dni", "==", solicitud.dni));
      const querySnapUser = await getDocs(qUser);

      if (!querySnapUser.empty) {
        const userRef = doc(db, "usuarios", querySnapUser.docs[0].id);
        await updateDoc(userRef, {
          password: solicitud.dni,
          primerIngreso: true,
          claveBlanqueadaEn: new Date().toISOString(),
        });
      }

      await updateDoc(doc(db, "solicitudes_blanqueo", solicitud.id), {
        estado: "resuelto",
        fechaResolucion: new Date().toISOString(),
      });

      if (onUpdate) onUpdate();
      alert("✅ Contraseña restablecida con éxito.");
    } catch (error) {
      console.error("Error al blanquear:", error);
      alert("⚠️ Ocurrió un error al restablecer.");
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarSolicitud = async (solicitud) => {
    if (!window.confirm(`¿Estás seguro de eliminar la solicitud de ${solicitud.nombre} (DNI: ${solicitud.dni})?`)) return;

    setProcesando(true);
    try {
      await deleteDoc(doc(db, "solicitudes_blanqueo", solicitud.id));

      if (onUpdate) onUpdate();
      alert("🗑️ Solicitud eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar solicitud:", error);
      alert("⚠️ Ocurrió un error al eliminar la solicitud.");
    } finally {
      setProcesando(false);
    }
  };

  const listaSegura = Array.isArray(solicitudes) ? solicitudes : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">🔑 Solicitudes de Blanqueo de Clave</h2>
        <p className="text-xs text-slate-500">Restablece la clave al DNI ante reclamos de olvido.</p>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        {listaSegura.length === 0 ? (
          <div className="p-8 text-xs font-semibold text-slate-500 text-center">
            ✅ No hay solicitudes pendientes.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {listaSegura.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50">
                <div>
                  <p className="text-xs font-black text-slate-900">DNI: {item.dni}</p>
                  <p className="text-xs text-slate-600">{item.nombre} ({item.rol})</p>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleBlanquearPassword(item)}
                    disabled={procesando}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    Blanquear a DNI
                  </button>
                  <button
                    onClick={() => handleEliminarSolicitud(item)}
                    disabled={procesando}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    title="Eliminar solicitud"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}