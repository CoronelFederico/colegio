"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const [dniInput, setDniInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [noSoyRobot, setNoSoyRobot] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  // Estado para el modal de primer ingreso (cambio obligatorio de clave)
  const [requiereCambioClave, setRequiereCambioClave] = useState(false);
  const [usuarioTemporal, setUsuarioTemporal] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [errorCambioClave, setErrorCambioClave] = useState("");

  // Estado para el modal "Olvidé mi contraseña"
  const [mostrarOlvideClave, setMostrarOlvideClave] = useState(false);
  const [dniOlvido, setDniOlvido] = useState("");
  const [mensajeOlvido, setMensajeOlvido] = useState("");

  const router = useRouter();

  // Función para guardar sesión y redirigir según el rol
  const redirigirPorRol = (userData, dni) => {
    const sesionData = {
      id: userData.id || dni,
      dni: dni,
      rol: userData.rol,
      nombre: userData.nombre || "",
      apellido: userData.apellido || "",
    };
    localStorage.setItem("usuario_sesion", JSON.stringify(sesionData));

    // Redirigimos a todos al Dashboard Único
    router.push("/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin("");

    if (!aceptaTerminos) {
      setErrorLogin("Debes aceptar los Términos y Condiciones para ingresar.");
      return;
    }
    if (!noSoyRobot) {
      setErrorLogin("Por favor, confirma que no eres un robot.");
      return;
    }

    const dniLimpio = dniInput.trim().replace(/\./g, "");
    const passLimpia = passwordInput.trim();

    if (!dniLimpio || !passLimpia) {
      setErrorLogin("Ingresá tu DNI y contraseña.");
      return;
    }

    setCargando(true);

    try {
      let userDocRef = doc(db, "usuarios", dniLimpio);
      let userSnap = await getDoc(userDocRef);
      let userData = null;
      let userDocId = dniLimpio;

      if (userSnap.exists()) {
        userData = userSnap.data();
      } else {
        const q = query(collection(db, "usuarios"), where("dni", "==", dniLimpio));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          userSnap = querySnap.docs[0];
          userDocId = userSnap.id;
          userData = userSnap.data();
          userDocRef = doc(db, "usuarios", userDocId);
        }
      }

      if (!userData) {
        setErrorLogin("DNI no registrado.");
        setCargando(false);
        return;
      }

      const passwordGuardada = userData.password || dniLimpio;
      const esPrimerIngreso = userData.primerIngreso !== false;

      if (passLimpia !== passwordGuardada) {
        setErrorLogin("Contraseña incorrecta.");
        setCargando(false);
        return;
      }

      if (esPrimerIngreso) {
        document.getElementById("login_modal")?.close();
        setUsuarioTemporal({ id: userDocId, data: userData, docRef: userDocRef });
        setRequiereCambioClave(true);
        setCargando(false);
        return;
      }

      redirigirPorRol({ ...userData, id: userDocId }, dniLimpio);
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      setErrorLogin("Error de conexión al verificar credenciales.");
      setCargando(false);
    }
  };

  const handleGuardarNuevaPassword = async (e) => {
    e.preventDefault();
    setErrorCambioClave("");

    if (nuevaPassword.length < 6) {
      setErrorCambioClave("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorCambioClave("Las contraseñas no coinciden.");
      return;
    }

    if (nuevaPassword === usuarioTemporal.data.dni) {
      setErrorCambioClave("La nueva contraseña no puede ser tu DNI.");
      return;
    }

    setCargando(true);

    try {
      await updateDoc(usuarioTemporal.docRef, {
        password: nuevaPassword,
        primerIngreso: false,
        claveActualizadaEn: new Date().toISOString(),
      });

      const dataActualizada = { ...usuarioTemporal.data, primerIngreso: false };
      redirigirPorRol(dataActualizada, usuarioTemporal.data.dni || usuarioTemporal.id);
    } catch (error) {
      console.error("Error al guardar la nueva contraseña:", error);
      setErrorCambioClave("No se pudo actualizar la contraseña. Intentá de nuevo.");
      setCargando(false);
    }
  };

  const handleSolicitarBlanqueo = async (e) => {
    e.preventDefault();
    const dniLimpio = dniOlvido.trim().replace(/\./g, "");

    if (!dniLimpio) {
      setMensajeOlvido("Ingresá tu DNI para procesar la solicitud.");
      return;
    }

    setCargando(true);
    try {
      let nombreUsuario = "Usuario no registrado";
      let rolUsuario = "Desconocido";

      const q = query(collection(db, "usuarios"), where("dni", "==", dniLimpio));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const data = querySnap.docs[0].data();
        nombreUsuario = data.nombre || data.apellido ? `${data.nombre || ""} ${data.apellido || ""}`.trim() : "Sin nombre";
        rolUsuario = data.rol || "Sin rol";
      }

      await addDoc(collection(db, "solicitudes_blanqueo"), {
        dni: dniLimpio,
        nombre: nombreUsuario,
        rol: rolUsuario,
        estado: "pendiente",
        fechaSolicitud: new Date().toISOString(),
      });

      setMensajeOlvido("Solicitud enviada a la administración. En breve restablecerán tu clave a tu DNI.");
    } catch (error) {
      console.error("Error al registrar solicitud:", error);
      setMensajeOlvido("Ocurrió un error al enviar la solicitud. Intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div data-theme="light" className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 font-sans">
      
      {/* Navbar Superior Institucional */}
      <header className="navbar bg-white border-b border-slate-200 px-4 lg:px-12 sticky top-0 z-40 shadow-xs">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-white border border-slate-100 rounded-box w-52 font-semibold text-slate-700">
              <li><a>Inicio</a></li>
              <li><a>Radio Escolar</a></li>
              <li><a>Tutorial</a></li>
              <li><a>Reseña Histórica</a></li>
              <li><a>Contacto</a></li>
            </ul>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo Colegio" 
                fill 
                unoptimized
                className="object-contain" 
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-xs text-blue-900 tracking-wide">COLEGIO PROVINCIAL</span>
              <span className="text-[10px] text-slate-500 font-semibold">Virgilio Carlos Ferreyra • Anillaco</span>
            </div>
          </div>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 font-semibold text-xs text-slate-600 gap-1">
            <li><a className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Inicio</a></li>
            <li><a className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Radio Escolar</a></li>
            <li><a className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Tutorial</a></li>
            <li><a className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Reseña Histórica</a></li>
            <li><a className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Contacto</a></li>
          </ul>
        </div>

        <div className="navbar-end">
          <button 
            onClick={() => document.getElementById('login_modal').showModal()}
            className="btn bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider px-6 rounded-full shadow-sm"
          >
            Ingresar
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 my-auto bg-gradient-to-b from-white to-slate-100">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold tracking-wider uppercase border border-blue-100 shadow-2xs">
            ✨ Plataforma Digital Institucional
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Portal Escolar de Gestión Educativa
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
            Sistema integrado para el seguimiento académico, control de asistencias, boletines y legajos escolares en tiempo real.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => document.getElementById('login_modal').showModal()}
              className="btn bg-[#23b3e8] hover:bg-[#1da2d3] border-none text-white font-bold text-sm uppercase tracking-wider px-8 h-12 rounded-full shadow-lg shadow-cyan-500/20"
            >
              Iniciar Sesión en el Portal
            </button>
            <a 
              href="#contacto" 
              className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm uppercase tracking-wider px-8 h-12 rounded-full"
            >
              Saber Más
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-6 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">Colegio Provincial Presbítero Virgilio Carlos Ferreyra</p>
          <p className="text-slate-400">Sala de Informática • Anillaco, La Rioja</p>
          <p className="text-[10px] text-slate-400 font-mono pt-2">© 2026 — Todos los derechos reservados • v1.0.0</p>
        </div>
      </footer>

      {/* MODAL DE LOGIN */}
      <dialog id="login_modal" className="modal modal-bottom sm:modal-middle z-50">
        <div className="modal-box bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-md">
          
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-16 h-16 relative flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo Colegio" 
                fill 
                unoptimized
                className="object-contain" 
              />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h3>
              <p className="text-xs text-slate-500 mt-1">
                En tu primer ingreso, tu contraseña es tu DNI
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            
            <div className="form-control w-full space-y-1">
              <label className="label p-0">
                <span className="label-text text-xs font-bold text-blue-900 uppercase tracking-wider">DNI / CUIL *</span>
              </label>
              <input
                type="text"
                placeholder="Ingrese su DNI o CUIL"
                value={dniInput}
                onChange={(e) => setDniInput(e.target.value)}
                required
                className="input input-bordered w-full h-11 bg-white text-slate-900 font-medium placeholder:text-slate-400 border-cyan-400 focus:border-blue-900 focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div className="form-control w-full space-y-1">
              <div className="flex justify-between items-center">
                <label className="label p-0">
                  <span className="label-text text-xs font-bold text-slate-700 uppercase tracking-wider">Contraseña *</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => {
                    document.getElementById('login_modal')?.close();
                    setDniOlvido(dniInput);
                    setMensajeOlvido("");
                    setMostrarOlvideClave(true);
                  }}
                  className="text-xs font-semibold text-blue-900 hover:underline"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="input input-bordered w-full h-11 bg-white text-slate-900 font-medium placeholder:text-slate-400 border-slate-300 focus:border-blue-900 focus:outline-none rounded-lg text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none text-xs font-bold"
                >
                  {mostrarPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                <input 
                  type="checkbox" 
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary mt-0.5 rounded-xs" 
                />
                <span>
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const modal = document.getElementById('terms_modal');
                      if (modal) modal.showModal();
                    }}
                    className="text-blue-900 font-bold underline hover:text-blue-700 inline"
                  >
                    Términos, Condiciones y Uso de Datos
                  </button>{" "}
                  institucionales.
                </span>
              </label>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={noSoyRobot}
                  onChange={(e) => setNoSoyRobot(e.target.checked)}
                  className="checkbox checkbox-primary rounded-sm" 
                />
                <span className="text-xs font-bold text-slate-700">No soy un robot</span>
              </label>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguridad</span>
                <span className="text-[9px] text-blue-900 font-semibold">VCF Portal</span>
              </div>
            </div>

            {errorLogin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
                ⚠️ {errorLogin}
              </div>
            )}

            <button
              type="submit"
              disabled={!dniInput || !passwordInput || !aceptaTerminos || !noSoyRobot || cargando}
              className={`w-full font-bold uppercase tracking-wider h-11 text-xs rounded-full transition-all shadow-md mt-2 btn ${
                dniInput && passwordInput && aceptaTerminos && noSoyRobot && !cargando
                  ? "bg-blue-900 hover:bg-blue-800 text-white border-none" 
                  : "bg-slate-200 text-slate-400 border-none cursor-not-allowed"
              }`}
            >
              {cargando ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="modal-action mt-4">
            <form method="dialog" className="w-full">
              <button className="btn btn-ghost btn-sm w-full text-slate-500 font-semibold rounded-full">
                Cancelar
              </button>
            </form>
          </div>

        </div>
      </dialog>

      {/* MODAL OLVIDÉ CONTRASEÑA */}
      {mostrarOlvideClave && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="text-center space-y-1">
              <span className="text-3xl">🛠️</span>
              <h3 className="text-lg font-black text-slate-900">
                Recuperación de Contraseña
              </h3>
              <p className="text-xs text-slate-500">
                Si olvidaste tu clave, el administrador institucional restablecerá tu cuenta a tu DNI inicial.
              </p>
            </div>

            <form onSubmit={handleSolicitarBlanqueo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tu DNI
                </label>
                <input
                  type="text"
                  value={dniOlvido}
                  onChange={(e) => setDniOlvido(e.target.value)}
                  placeholder="Ej: 38123456"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium text-slate-900 bg-white"
                />
              </div>

              {mensajeOlvido && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold space-y-1">
                  <p>ℹ️ {mensajeOlvido}</p>
                  <p className="text-[11px] text-slate-600 font-normal">
                    📍 Contacto: Secretaría Escolar / Administración
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarOlvideClave(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-1/2 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  {cargando ? "Enviando..." : "Solicitar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CAMBIO DE CONTRASEÑA OBLIGATORIO */}
      {requiereCambioClave && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="text-center space-y-1">
              <span className="text-3xl">🔑</span>
              <h3 className="text-lg font-black text-slate-900">
                Cambio de Contraseña Obligatorio
              </h3>
              <p className="text-xs text-slate-500">
                Es tu primer inicio de sesión. Por seguridad, definí una nueva clave personal.
              </p>
            </div>

            <form onSubmit={handleGuardarNuevaPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium text-slate-900 bg-white"
                />
              </div>

              {errorCambioClave && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                  ⚠️ {errorCambioClave}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {cargando ? "Guardando..." : "Guardar Contraseña y Continuar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TÉRMINOS Y CONDICIONES */}
      <dialog id="terms_modal" className="modal modal-bottom sm:modal-middle z-[60]">
        <div className="modal-box bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-lg">
          <h3 className="font-black text-lg text-blue-900 border-b border-slate-100 pb-3 mb-4 text-left">
            Términos de Uso y Protección de Datos Personales
          </h3>
          
          <div className="text-xs text-slate-600 space-y-3 max-h-72 overflow-y-auto pr-2 leading-relaxed text-left">
            <p>
              <strong>1. Marco Institucional:</strong> El Portal Escolar Digital es de uso exclusivo para la comunidad educativa del <em>Colegio Provincial Presbítero Virgilio Carlos Ferreyra</em>.
            </p>
            <p>
              <strong>2. Protección de Datos (Ley N° 25.326):</strong> Los datos académicos, personales y de asistencia registrados son confidenciales y están protegidos por la Ley de Protección de Datos Personales de la República Argentina.
            </p>
            <p>
              <strong>3. Responsabilidad de Credenciales:</strong> Cada usuario es responsable de mantener la confidencialidad de su contraseña institucional.
            </p>
            <p>
              <strong>4. Auditoría:</strong> Las interacciones dentro de la plataforma son registradas con fines de seguridad y control institucional.
            </p>
            <p>
              <strong>5. Uso de Cookies y Almacenamiento Local:</strong> La plataforma utiliza almacenamiento local únicamente para mantener activa la sesión iniciada del usuario y guardar sus preferencias.
            </p>
          </div>

          <div className="modal-action border-t border-slate-100 pt-3 mt-4">
            <form method="dialog" className="w-full">
              <button 
                onClick={() => setAceptaTerminos(true)}
                className="btn bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider w-full rounded-full"
              >
                Entendido y Aceptar
              </button>
            </form>
          </div>
        </div>
      </dialog>

    </div>
  );
}