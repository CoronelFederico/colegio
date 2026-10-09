"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

const CONFIG_INICIAL = {
  nombreEscuela: "Escuela Secundaria N° 1",
  slogan: "Portal Institucional de Servicios Educativos",
  logoUrl: "/favicon.ico",
  resena:
    "Nuestra institución fue fundada con el propósito de ofrecer educación integral y de excelencia. A lo largo de los años, hemos incorporado tecnología y metodologías pedagógicas innovadoras para acompañar a nuestros estudiantes.",
  direccion: "Av. Educativa 1234, Barrio Centro",
  coordenadas: { lat: -34.6037, lng: -58.3816 }, // Reemplazar por las reales
};

export default function HomePage() {
  const router = useRouter();
  const [config, setConfig] = useState(CONFIG_INICIAL);
  
  // Login por DNI
  const [dniInput, setDniInput] = useState("");
  const [cargandoDni, setCargandoDni] = useState(false);
  const [errorDni, setErrorDni] = useState("");

  // Formulario de contacto
  const [formContacto, setFormContacto] = useState({
    nombre: "",
    email: "",
    dni: "",
    mensaje: "",
  });

  // Escuchar configuración de la landing desde Firestore
  useEffect(() => {
    const docRef = doc(db, "configuracion", "landing");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setConfig((prev) => ({ ...prev, ...snap.data() }));
      }
    });
    return () => unsub();
  }, []);

  // Lógica para validar DNI en Firestore y derivar según el ROL
  const handleIngresarDNI = async (e) => {
    e.preventDefault();
    setErrorDni("");
    const dniLimpio = dniInput.trim();

    if (!dniLimpio) {
      setErrorDni("Por favor ingresá un DNI válido.");
      return;
    }

    setCargandoDni(true);

    try {
      // Buscar usuario en la colección 'usuarios' donde el campo 'dni' coincida
      const q = query(collection(db, "usuarios"), where("dni", "==", dniLimpio));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        setErrorDni("DNI no encontrado en el sistema. Comunicate con administración.");
        setCargandoDni(false);
        return;
      }

      const userDoc = querySnap.docs[0];
      const userData = userDoc.data();

      // Redirección dinámica según el ROL guardado en Firestore
      switch (userData.rol) {
        case "alumno":
        case "familia":
          router.push(`/portal-familias?dni=${dniLimpio}`);
          break;
        case "docente":
          router.push(`/horarios?docente=${encodeURIComponent(userData.nombre || "")}`);
          break;
        case "admin":
          router.push("/admin");
          break;
        default:
          router.push("/horarios");
          break;
      }
    } catch (error) {
      console.error("Error al consultar DNI:", error);
      setErrorDni("Ocurrió un error al verificar el acceso. Intentalo de nuevo.");
    } finally {
      setCargandoDni(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      {/* Header Institucional estilo Medifam */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={config.logoUrl || "/favicon.ico"}
              alt="Logo Escuela"
              className="w-10 h-10 object-contain rounded-lg border p-1"
            />
            <div>
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {config.nombreEscuela}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">{config.slogan}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#inicio" className="hover:text-blue-700 transition-colors">
              Inicio
            </a>
            <a href="#historia" className="hover:text-blue-700 transition-colors">
              Reseña Histórica
            </a>
            <a href="#noticias" className="hover:text-blue-700 transition-colors">
              Noticias
            </a>
            <a href="#contacto" className="hover:text-blue-700 transition-colors">
              Contacto
            </a>
          </nav>

          <a
            href="#login-section"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Ingresar con DNI
          </a>
        </div>
      </header>

      {/* Hero: Ingreso por DNI */}
      <section
        id="login-section"
        className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-12 px-4 text-center"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-3 py-1 rounded-full font-semibold">
            Portal Oficial de Servicios
          </span>
          <h2 className="text-2xl sm:text-4xl font-black">
            Bienvenido al Portal Educativo
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Ingresá con tu documento para acceder a tu panel correspondiente.
          </p>

          {/* Formulario de Login por DNI */}
          <form
            onSubmit={handleIngresarDNI}
            className="bg-white p-6 rounded-2xl shadow-xl max-w-md mx-auto text-slate-800 space-y-3 border border-slate-100"
          >
            <h3 className="font-bold text-slate-900 text-base">Acceso al Portal</h3>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={dniInput}
                onChange={(e) => setDniInput(e.target.value)}
                placeholder="Ingresá tu DNI (ej. 38123456)"
                className="flex-1 p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={cargandoDni}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap"
              >
                {cargandoDni ? "Verificando..." : "Ingresar"}
              </button>
            </div>

            {errorDni && (
              <p className="text-xs text-red-600 font-medium text-left">{errorDni}</p>
            )}

            <p className="text-[11px] text-slate-400 text-left">
              El sistema detectará automáticamente si sos alumno, docente o administrador.
            </p>
          </form>
        </div>
      </section>

      {/* Qué hace el portal (Explicación por perfiles) */}
      <main id="inicio" className="max-w-6xl mx-auto px-4 py-12 space-y-12 w-full">
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-700 pl-3">
            ¿Qué podés hacer en el Portal?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-3xl">🎓</div>
              <h3 className="font-bold text-slate-900 text-base">Portal de Alumnos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultá tus calificaciones, registro de asistencia, horarios de clases, fechas de exámenes y descargá certificados de alumno regular.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-3xl">👨‍🏫</div>
              <h3 className="font-bold text-slate-900 text-base">Tabla del Docente</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Carga ágil de calificaciones, control de ausentismo/licencias con asignación automática de colores, libros de temas y avisos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-3xl">⚙️</div>
              <h3 className="font-bold text-slate-900 text-base">Administración</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gestión de matriculación, altas/bajas de usuarios y roles, reportes institucionales globales y parámetros de la landing page.
              </p>
            </div>
          </div>
        </section>

        {/* Reseña Histórica */}
        <section id="historia" className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-700 pl-3">
            Reseña Histórica
          </h2>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-sm text-slate-700 leading-relaxed space-y-3">
            <p>{config.resena}</p>
          </div>
        </section>

        {/* Noticias */}
        <section id="noticias" className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-700 pl-3">
            Últimas Noticias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase">
                Académico
              </span>
              <h4 className="font-bold text-slate-900 text-sm">
                Apertura de Mesas de Exámenes
              </h4>
              <p className="text-xs text-slate-600">
                Inscripciones abiertas a partir del próximo lunes a través del portal de alumnos.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase">
                Institucional
              </span>
              <h4 className="font-bold text-slate-900 text-sm">
                Nuevos Talleres de Capacitación
              </h4>
              <p className="text-xs text-slate-600">
                Consultá en la secretaría académica las fechas e inscripciones disponibles.
              </p>
            </div>
          </div>
        </section>

        {/* Contacto & Ubicación */}
        <section id="contacto" className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-blue-700 pl-3">
            Contacto y Ubicación
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Consulta enviada correctamente.");
              }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formContacto.nombre}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, nombre: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formContacto.email}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, email: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  DNI (Opcional)
                </label>
                <input
                  type="text"
                  value={formContacto.dni}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, dni: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mensaje / Consulta
                </label>
                <textarea
                  rows={4}
                  required
                  value={formContacto.mensaje}
                  onChange={(e) =>
                    setFormContacto({ ...formContacto, mensaje: e.target.value })
                  }
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Escribí tu consulta acá..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-sm"
              >
                Enviar Consulta
              </button>
            </form>

            {/* Ubicación / Mapa */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">📍 Sede Central</h3>
                <p className="text-xs text-slate-600">{config.direccion}</p>
              </div>

              <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${config.coordenadas.lat},${config.coordenadas.lng}&z=15&output=embed`}
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 text-center space-y-1">
        <p>© {new Date().getFullYear()} {config.nombreEscuela}. Todos los derechos reservados.</p>
        <p className="text-slate-500">Sistema Institucional de Gestión Escolar</p>
      </footer>
    </div>
  );
}