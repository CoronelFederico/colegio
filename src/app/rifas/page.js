// src/app/rifas/page.js
"use client";

import { useState, useEffect } from "react";
import { obtenerEstadoRifas, registrarVentaRifa } from "@/services/rifasService";

export default function RifasPublicasPage() {
  const [rifas, setRifas] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos" | "disponibles" | "vendidos"
  const [loading, setLoading] = useState(true);

  // Modal de registro de venta (para alumnos/profesores)
  const [numeroSeleccionado, setNumeroSeleccionado] = useState(null);
  const [comprador, setComprador] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vendedorNombre, setVendedorNombre] = useState(""); // Ej: Federico Coronel

  const cargarRifas = async () => {
    setLoading(true);
    const data = await obtenerEstadoRifas();
    setRifas(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarRifas();
  }, []);

  // Generar array de 000 a 999
  const numerosTotales = Array.from({ length: 1000 }, (_, i) => 
    String(i).padStart(3, "0")
  );

  const totalVendidos = Object.values(rifas).filter((r) => r.estado === "vendido").length;
  const totalDisponibles = 1000 - totalVendidos;

  // Filtrar números
  const numerosFiltrados = numerosTotales.filter((num) => {
    const esVendido = rifas[num]?.estado === "vendido";
    const coincideBusqueda = num.includes(busqueda) || 
      (rifas[num]?.vendedorNombre || "").toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;
    if (filtroEstado === "disponibles") return !esVendido;
    if (filtroEstado === "vendidos") return esVendido;
    return true;
  });

  const handleVender = async (e) => {
    e.preventDefault();
    if (!comprador || !vendedorNombre) {
      alert("Completá los campos obligatorios (Vendedor y Comprador)");
      return;
    }

    const res = await registrarVentaRifa(numeroSeleccionado, {
      vendedorId: vendedorNombre.toLowerCase().replace(/\s+/g, '_'),
      vendedorNombre,
      compradorNombre: comprador,
      telefonoComprador: telefono || "Sin teléfono",
      precio: 3000 // Precio de referencia por número
    });

    if (res.success) {
      alert(`¡Número #${numeroSeleccionado} registrado con éxito para ${vendedorNombre}!`);
      setNumeroSeleccionado(null);
      setComprador("");
      setTelefono("");
      setVendedorNombre("");
      cargarRifas();
    } else {
      alert(res.error);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera Institucional */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Gran Rifa Institucional
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Talonario Digital <span className="text-indigo-600">(000 - 999)</span>
            </h1>
            <p className="text-slate-500 text-sm">
              Consultá los números disponibles, los premios y registrá las ventas realizadas por alumnos y docentes.
            </p>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-32 bg-emerald-50 border border-emerald-200/60 p-3.5 rounded-2xl text-center">
              <span className="block text-2xl font-black text-emerald-700">{totalDisponibles}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/70">Libres</span>
            </div>
            <div className="flex-1 md:w-32 bg-rose-50 border border-rose-200/60 p-3.5 rounded-2xl text-center">
              <span className="block text-2xl font-black text-rose-700">{totalVendidos}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800/70">Vendidos</span>
            </div>
            <button 
              onClick={cargarRifas}
              className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl transition flex items-center justify-center self-stretch"
              title="Actualizar datos"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Sección de Premios Destacados */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Premios en Juego 🏆
            </span>
            <h2 className="text-2xl font-black">¡Participá por increíbles premios!</h2>
            <p className="text-slate-300 text-sm max-w-xl">
              1° Premio: Orden de compra / 2° Premio: Kit tecnológico / 3° Premio: Canasta institucional. ¡Vendé tus números y ganá vos también!
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-xs uppercase tracking-wider text-amber-300 font-bold">Valor del Número</span>
            <span className="text-3xl font-black text-white">$3.000</span>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="🔍 Buscar número (ej: 042) o vendedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-96 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
          />

          <div className="flex gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFiltroEstado("todos")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${filtroEstado === "todos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFiltroEstado("disponibles")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${filtroEstado === "disponibles" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"}`}
            >
              Disponibles
            </button>
            <button 
              onClick={() => setFiltroEstado("vendidos")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${filtroEstado === "vendidos" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600"}`}
            >
              Vendidos
            </button>
          </div>
        </div>

        {/* Grilla de Números con Fondo Claro */}
        {loading ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium animate-pulse">
            Cargando talonario digital...
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
            {numerosFiltrados.map((num) => {
              const venta = rifas[num];
              const esVendido = venta?.estado === "vendido";

              return (
                <button
                  key={num}
                  onClick={() => !esVendido && setNumeroSeleccionado(num)}
                  disabled={esVendido}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                    esVendido 
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60" 
                      : "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 text-slate-900 cursor-pointer"
                  }`}
                >
                  <span className={`text-base md:text-lg font-black tracking-tight ${esVendido ? "line-through text-slate-400" : "text-slate-900"}`}>
                    {num}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esVendido ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {esVendido ? "Vendido" : "Libre"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal para Registrar Venta (Alumnos / Profesores) */}
        {numeroSeleccionado && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    Número #{numeroSeleccionado}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">Registrar Venta</h3>
                </div>
                <button 
                  onClick={() => setNumeroSeleccionado(null)} 
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleVender} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ¿Quién vende? (Alumno o Docente)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Federico Coronel (3° 1ª)"
                    value={vendedorNombre}
                    onChange={(e) => setVendedorNombre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre del Comprador
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={comprador}
                    onChange={(e) => setComprador(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: 3794123456"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNumeroSeleccionado(null)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition"
                  >
                    Guardar Venta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}