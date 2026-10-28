import React, { useState } from 'react';
import { db } from '@/firebase/config'; // <--- Ajusta tu ruta absoluta o relativa a tu config de Firebase
import { collection, getDocs } from 'firebase/firestore';

const COLECCIONES_CONOCIDAS = [
  'usuarios', 
  'configuracion', 
  'docentes', 
  'profesores', 
  'personal', 
  'materias_institucionales', 
  'horarios', 
  'mensajes_contacto', 
  'solicitudes', 
  'solicitudes_blanqueo'
];

export default function AuditorFirestore() {
  const [datos, setDatos] = useState({});
  const [loading, setLoading] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    let resultadoTemp = {};

    for (const colName of COLECCIONES_CONOCIDAS) {
      try {
        const querySnapshot = await getDocs(collection(db, colName));
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (docs.length > 0) {
          resultadoTemp[colName] = docs;
        }
      } catch (e) {
        // Ignora colecciones que no existan o no tengan permisos
      }
    }

    setDatos(resultadoTemp);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800">🔍 Auditor de Colecciones Firebase</h2>
          <p className="text-xs text-slate-500 mt-1">Inspecciona y limpia datos de tu base de datos en tiempo real.</p>
        </div>
        <button 
          onClick={cargarDatos}
          disabled={loading}
          className="px-4 py-2.5 bg-[#1e295d] hover:bg-[#161f43] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? 'Escaneando bases...' : '🚀 Escanear Colecciones'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.keys(datos).length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-medium">Haz clic en "Escanear Colecciones" para ver el contenido actual.</p>
          </div>
        )}

        {Object.keys(datos).map((colName) => (
          <div key={colName} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-[#1e295d] flex items-center gap-2">
                📁 Colección: <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">{colName}</span>
              </h3>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                {datos[colName].length} documentos
              </span>
            </div>
            
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {datos[colName].map((doc, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-mono">
                  <div className="text-slate-700 font-bold mb-1">ID: {doc.id}</div>
                  <pre className="text-slate-500 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(doc, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}