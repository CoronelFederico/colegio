"use client";

export default function Preceptoria({ preceptoresList }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">📋 Módulo Preceptoría</h2>
        <p className="text-xs text-slate-500">Preceptores dados de alta para partes diarios.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {preceptoresList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No hay preceptores asignados. Podés sumar uno desde el módulo "Crear Nuevo Usuario".
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {preceptoresList.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-slate-900">{p.apellido}, {p.nombre}</p>
                <p className="text-[11px] text-slate-500">DNI: {p.dni}</p>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px] uppercase">
                  Preceptor
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}