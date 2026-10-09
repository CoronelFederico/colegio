"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const [dniInput, setDniInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  // Estado para el modal de primer ingreso (cambio obligatorio)
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
    // 💾 Persistencia de Sesión
    const sesionData = {
      id: userData.id || dni,
      dni: dni,
      rol: userData.rol,
      nombre: userData.nombre || "",
      apellido: userData.apellido || "",
    };
    localStorage.setItem("usuario_sesion", JSON.stringify(sesionData));

    // 🔀 Redirección por Rol
    switch (userData.rol) {
      case "alumno":
      case "familia":
        router.push(`/portal-familias?dni=${dni}`);
        break;
      case "docente":
        router.push(`/portal-docentes?docente=${encodeURIComponent(userData.nombre || "")}`);
        break;
      case "secretaria":
        router.push("/secretaria");
        break;
      case "preceptor":
        router.push("/preceptor");
        break;
      case "biblioteca":
        router.push("/biblioteca");
        break;
      case "admin":
        router.push("/admin");
        break;
      default:
        setErrorLogin("Rol de usuario no reconocido.");
        break;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin("");

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
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-wide">
              PORTAL ESCOLAR
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold">
              VIRGILIO CARLOS FERREYRA
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-6">
          <div className="text-center space-y-1">
            <span className="text-3xl">🔐</span>
            <h2 className="text-xl font-black text-slate-900">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-slate-500">
              En tu primer ingreso, tu contraseña es tu número de DNI
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Usuario (DNI)
              </label>
              <input
                type="text"
                value={dniInput}
                onChange={(e) => setDniInput(e.target.value)}
                placeholder="Ej: 38123456"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDniOlvido(dniInput);
                    setMensajeOlvido("");
                    setMostrarOlvideClave(true);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            {errorLogin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                ⚠️ {errorLogin}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {cargando ? "Verificando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </main>

      {/* Modal Olvidé mi Contraseña */}
      {mostrarOlvideClave && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="text-center space-y-1">
              <span className="text-3xl">🛠️</span>
              <h3 className="text-lg font-black text-slate-900">
                Recuperación de Contraseña
              </h3>
              <p className="text-xs text-slate-500">
                Si olvidaste tu clave, el administrador institucional debe restablecerla a tu DNI inicial.
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  Solicitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Obligatorio de Cambio de Contraseña */}
      {requiereCambioClave && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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

      <footer className="bg-slate-900 text-slate-400 text-center py-4 text-xs">
        <p>© Colegio Provincial Presbítero Virgilio Carlos Ferreyra — Sistema de Gestión Educativa</p>
        <p>© SALA DE INFORMATICA</p>
      </footer>
    </div>
  );
}