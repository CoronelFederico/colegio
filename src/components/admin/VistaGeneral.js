"use client";

export default function VistaGeneral({ 
  alumnosCount, 
  docentesCount, 
  librosCount, 
  prestamosCount, 
  setModuloActivo, 
  solicitudesCount 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">Vista General del Sistema</h2>
        <p className="text-xs text-slate-500">Resumen global de usuarios y solicitudes del campus.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Alumnos</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{alumnosCount}</p>
          </div>
          <span className="text-2xl">🎓</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Docentes</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{docentesCount}</p>
          </div>
          <span className="text-2xl">👩‍🏫</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Libros Biblioteca</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{librosCount}</p>
          </div>
          <span className="text-2xl">📚</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Préstamos Activos</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{prestamosCount}</p>
          </div>
          <span className="text-2xl">📖</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Acceso Rápido</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setModuloActivo("nuevo-usuario")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            ➕ Registrar Usuario Nuevo
          </button>
          <button
            onClick={() => setModuloActivo("biblioteca")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            📚 Gestionar Biblioteca
          </button>
          <button
            onClick={() => setModuloActivo("blanqueos")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
          >
            🔑 Claves Pendientes ({solicitudesCount})
          </button>
        </div>
      </div>
    </div>
  );
}