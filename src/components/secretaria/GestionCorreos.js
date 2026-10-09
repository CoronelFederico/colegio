"use client";

import { useState } from "react";

export default function GestionCorreos() {
  const [destinatarioEmail, setDestinatarioEmail] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleEnviarMail = (e) => {
    e.preventDefault();
    if (!destinatarioEmail || !asunto) return alert("Completá correo y asunto.");

    // Abre el cliente de correo predeterminado del sistema con los datos precargados
    window.location.href = `mailto:${destinatarioEmail}?subject=${encodeURIComponent(
      asunto
    )}&body=${encodeURIComponent(
      mensaje + "\n\n---\nSecretaría Escolar - Colegio Secundario Provincial Presbítero Virgilio Carlos Ferreyra"
    )}`;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
      <div>
        <h2 className="text-base font-black text-slate-900">📧 Envío de Correos Institucionales</h2>
        <p className="text-xs text-slate-500">
          Notificá directamente a los correos electrónicos registrados durante el proceso de ingreso.
        </p>
      </div>

      <form onSubmit={handleEnviarMail} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico del Destinatario *</label>
          <input
            type="email"
            value={destinatarioEmail}
            onChange={(e) => setDestinatarioEmail(e.target.value)}
            placeholder="tutor@gmail.com"
            className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Asunto del Correo *</label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Ej: Notificación sobre Requisitos Pendientes - SINIDE"
            className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Cuerpo del Mensaje</label>
          <textarea
            rows={5}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Estimado Tutor/a, nos comunicamos desde la Secretaría para..."
            className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          ✉️ Redactar en Cliente de Correo
        </button>
      </form>
    </div>
  );
}