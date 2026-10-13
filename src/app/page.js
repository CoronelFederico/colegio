"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

// Componente auxiliar para el efecto de tipeado fluido
function TextoTipeado({ texto, className = "", delay = 0 }) {
  const letras = Array.from(texto);

  const contenedorAnimacion = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: delay * i },
    }),
  };

  const letraAnimacion = {
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: -3,
      y: 6,
    },
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={contenedorAnimacion}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      {letras.map((letra, index) => (
        <motion.span key={index} variants={letraAnimacion}>
          {letra === " " ? "\u00A0" : letra}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function HomePage() {
  const [dniInput, setDniInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [noSoyRobot, setNoSoyRobot] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  // Estado para la reseña histórica dinâmica
  const [historiaContenido, setHistoriaContenido] = useState("");

  useEffect(() => {
    const consultarHistoria = async () => {
      try {
        const snap = await getDoc(doc(db, "configuracion", "historia"));
        if (snap.exists()) {
          setHistoriaContenido(snap.data().contenido || "");
        }
      } catch (e) {
        console.error("Error al consultar la historia:", e);
      }
    };
    consultarHistoria();
  }, []);

  // Estados de la Radio (Sincronizados correctamente adentro del componente)
  const [radioEnVivo, setRadioEnVivo] = useState(false);
  const [urlStreamRadio, setUrlStreamRadio] = useState("");

  // Cargar estado de la radio desde Firebase al iniciar
  useEffect(() => {
    const consultarEstadoRadio = async () => {
      try {
        const configRef = doc(db, "configuracion", "radio");
        const snap = await getDoc(configRef);
        if (snap.exists()) {
          const data = snap.data();
          setRadioEnVivo(data.enVivo || false);
          setUrlStreamRadio(data.urlStream || "");
        }
      } catch (e) {
        console.error("Error al consultar estado de la radio:", e);
      }
    };
    consultarEstadoRadio();
  }, []);

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
              <li><a href="#">Inicio</a></li>
                  
              <li><a>Tutorial</a></li>
              <li>
                <button 
                  onClick={() => document.getElementById('historia_modal').showModal()}
                  className="hover:text-blue-900 hover:bg-blue-50 rounded-lg text-left w-full cursor-pointer py-2 px-3"
                >
                  Reseña Histórica
                </button>
              </li>
              <li><a href="#contacto">Contacto</a></li>
               <li id="radioescolar">
                <button 
                  onClick={() => document.getElementById('radio_modal').showModal()}
                  className="flex items-center gap-2 hover:text-blue-900 hover:bg-blue-50 rounded-lg py-2 px-3 text-left w-full cursor-pointer"
                >
                  <span>Radio Escolar</span>
                  {radioEnVivo && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                    </span>
                  )}
                </button>
              </li>
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
            <li><a href="#" className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Inicio</a></li>
           
            <li><a className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Tutorial</a></li>
            <li>
              <button 
                onClick={() => document.getElementById('historia_modal').showModal()}
                className="hover:text-blue-900 hover:bg-blue-50 rounded-lg text-left w-full cursor-pointer py-2 px-3"
              >
                Reseña Histórica
              </button>
            </li>
            <li><a href="#contacto" className="hover:text-blue-900 hover:bg-blue-50 rounded-lg">Contacto</a></li>
             <li>
              <button 
                onClick={() => document.getElementById('radio_modal').showModal()}
                className="flex items-center gap-2 hover:text-blue-900 hover:bg-blue-50 rounded-lg py-2 px-3 text-left w-full cursor-pointer" 
                id="radioescolar"
              >
                <span>Radio Escolar</span>
                {radioEnVivo && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                )}
              </button>
            </li>
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

      {/* Contenido Principal con Animación de Tipeado */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-6 bg-gradient-to-b from-white to-slate-100 min-h-[calc(100vh-120px)]">
        <div className="max-w-3xl w-full space-y-4 my-auto flex flex-col items-center">
          
          <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-snug w-full px-2 break-words text-center flex flex-col items-center">
            <TextoTipeado texto="Portal Escolar de Gestión Educativa" />
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-lg mx-auto font-normal px-4 break-words text-center flex flex-col items-center">
            <TextoTipeado 
              texto="Sistema integrado para el seguimiento académico, control de asistencias, boletines y legajos escolares en tiempo real." 
              delay={0.8} 
            />
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3 w-full px-4"
          >
            <button 
              onClick={() => document.getElementById('login_modal').showModal()}
              className="btn bg-[#23b3e8] hover:bg-[#1da2d3] border-none text-white font-bold text-xs uppercase tracking-wider w-full sm:w-auto px-6 h-11 rounded-full shadow-lg shadow-cyan-500/20"
            >
              Iniciar Sesión en el Portal
            </button>
            <a 
              href="#destinado" 
              className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider w-full sm:w-auto px-6 h-11 rounded-full flex items-center justify-center"
            >
              Saber Más
            </a>
          </motion.div>

        </div>
      </main>

      {/* SECCIÓN: ¿A quién está destinado el portal? */}
      <section id="destinado" className="py-20 px-6 bg-slate-900 text-slate-100 border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-950/80 px-4 py-1.5 rounded-full border border-blue-800/50">
              Comunidad Educativa Integrada
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              ¿A quién está destinado el sistema?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
              Un espacio de gestión unificado para cada actor clave del establecimiento en Anillaco.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                rol: "Familias / Tutores",
                icon: "👨‍👩‍👧‍👦",
                desc: "Seguimiento académico de sus hijos, visualización de asistencia y contacto directo con la institución.",
                color: "border-blue-500/30 hover:border-blue-500"
              },
              {
                rol: "Alumnos",
                icon: "🎒",
                desc: "Acceso a su legajo digital, constancias de alumno regular, calificaciones y novedades escolares.",
                color: "border-cyan-500/30 hover:border-cyan-500"
              },
              {
                rol: "Personal Administrativo",
                icon: "🏢",
                desc: "Gestión de inscripciones, libro de entrada/salida, control de legajos oficiales y blanqueo de claves.",
                color: "border-indigo-500/30 hover:border-indigo-500"
              },
              {
                rol: "Preceptores",
                icon: "📋",
                desc: "Control diario de asistencia, registro de novedades y seguimiento de trayectorias de los cursos.",
                color: "border-emerald-500/30 hover:border-emerald-500"
              },
              {
                rol: "Docentes",
                icon: "📚",
                desc: "Carga de calificaciones, reportes pedagógicos y comunicación institucional centralizada.",
                color: "border-amber-500/30 hover:border-amber-500"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`bg-slate-950/60 p-6 rounded-3xl border ${item.color} transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="text-3xl w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 shadow-inner">
                    {item.icon}
                  </div>
                  <h3 className="font-black text-lg text-white tracking-wide">
                    {item.rol}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* SECCIÓN: Características y Gráficos Interactivos */}
      <section className="py-24 px-6 bg-white text-slate-900 border-t border-slate-200">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
              Tecnología y Gestión Documental
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Análisis Visual y Carga de Archivos
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
              Sube legajos en PDF o imágenes de manera segura y visualiza métricas institucionales al instante.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Métricas de Actividad Institucional</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Flujo de Asistencia y Participación</span>
                <div className="h-36 flex items-end gap-3 justify-between pt-4 px-2 bg-white rounded-2xl border border-slate-200 shadow-inner">
                  {[40, 75, 55, 90, 65, 85, 95].map((altura, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${altura}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                      className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg relative group cursor-pointer"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Activo
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Tendencia de Rendimiento Académico</span>
                  <span className="text-emerald-600 font-extrabold">● Sincronizado</span>
                </div>
                <div className="h-16 bg-white rounded-2xl border border-slate-200 p-2 flex items-center overflow-hidden relative shadow-inner">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent w-full"
                  />
                  <div className="w-full flex items-center justify-around">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">Gestión Documental Segura</span>
                <h3 className="text-xl sm:text-3xl font-black text-slate-900">
                  Sube tus archivos PDF e Imágenes en segundos
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  El sistema permite adjuntar constancias, certificados médicos, autorizaciones y legajos institucionales con almacenamiento centralizado y validación de formato automática.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-2xl">📄</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Soporte Integral PDF y Fotos</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Compatible con documentos escaneados, fotos de DNI y constancias firmadas digitalmente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Privacidad y Accesos por Rol</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Solo el personal autorizado y administración tienen permisos de visualización y validación de archivos.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-blue-50 text-blue-800 rounded-2xl border border-blue-200 text-xs font-bold shadow-sm">
                  <span>📎 Formatos admitidos: .PDF, .JPG, .PNG</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECCIÓN: Ubicación y Formulario de Contacto */}
      <section id="contacto" className="py-24 px-6 bg-white text-slate-900 border-t border-slate-200">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
              Canal de Comunicación Oficial
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ubicación y Contacto Institucional
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
              Encontranos en Anillaco y comunicate con la secretaría escolar ante cualquier duda o inquietud.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-xl space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">📍 Colegio Provincial Pbro. Virgilio Carlos Ferreyra</span>
                  <span className="text-[11px] text-slate-500">Anillaco, La Rioja</span>
                </div>
                
                <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                  <iframe
                    title="Ubicación Colegio Anillaco"
                    src="https://maps.google.com/maps?q=-28.808986,-66.940017&z=15&output=embed"
                    className="w-full h-full border-0"
                    allowFullScreen=""
                    loading="lazy"
                  ></iframe>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 font-medium text-center">
                  Departamento Castro Barros • Provincia de La Rioja
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Escribinos</h3>
                <p className="text-xs text-slate-600">
                  Comentanos tus dudas e inquietudes y te responderemos a la brevedad.
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const nombre = form.nombre.value.trim();
                const email = form.email.value.trim();
                const telefono = form.telefono.value.trim();
                const mensaje = form.mensaje.value.trim();

                if (!nombre || !email || !mensaje) {
                  alert("Por favor completá los campos obligatorios (Nombre, Email y Mensaje).");
                  return;
                }

                try {
                  await addDoc(collection(db, "mensajes_contacto"), {
                    nombre,
                    email,
                    telefono,
                    mensaje,
                    estado: "pendiente",
                    fechaEnvio: new Date().toISOString()
                  });
                  alert("¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.");
                  form.reset();
                } catch (error) {
                  console.error("Error al enviar mensaje de contacto:", error);
                  alert("Ocurrió un error al enviar el mensaje. Intentá de nuevo.");
                }
              }} className="space-y-4 text-left">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="tucorreo@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número telefónico
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Ej: 3804202030"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    name="mensaje"
                    required
                    rows="4"
                    placeholder="Escribí tu consulta aquí..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Enviar
                </button>
              </form>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 relative flex items-center justify-center bg-white rounded-full p-1 shadow-sm">
                  <Image 
                    src="/logo.png" 
                    alt="Logo Colegio" 
                    fill 
                    unoptimized
                    className="object-contain" 
                  />
                </div>
                <div>
                  <p className="font-extrabold text-white text-sm">Colegio Provincial</p>
                  <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Pbro. Virgilio Carlos Ferreyra</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Formación técnica y pedagógica al servicio de la juventud y la comunidad de Anillaco, La Rioja.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                Navegación
              </p>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li><a href="#" className="hover:text-blue-400 transition-colors">• Inicio</a></li>
                <li><a href="#radioescolar" className="hover:text-blue-400 transition-colors">• Radio Escolar</a></li>
                <li><a href="#contacto" className="hover:text-blue-400 transition-colors">• Tutorial de Uso</a></li>
                <li><a href="#contacto" className="hover:text-blue-400 transition-colors">• Reseña Histórica</a></li>
                <li><a href="#contacto" className="hover:text-blue-400 transition-colors">• Contacto e Informes</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                Ubicación & Domicilio
              </p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span>Anillaco, Dpto. Castro Barros, La Rioja, Argentina</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <span>(0380) 420-2030</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <span className="break-all">colegioanillaco2021@gmail.com</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                Redes Sociales
              </p>
              <p className="text-slate-400 text-xs">
                Seguí las novedades pedagógicas, eventos e institucionales en nuestros canales oficiales:
              </p>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.instagram.com/colpvcf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:border-transparent transition-all shadow-md hover:scale-105"
                  title="Instagram Oficial"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/cspvcf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-transparent transition-all shadow-md hover:scale-105"
                  title="Facebook Oficial"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
                  </svg>
                </a>
                <a
                  //href="https://wa.me/5493827401840"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-transparent transition-all shadow-md hover:scale-105"
                  title="WhatsApp Secretaría"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.285-.143-1.689-.834-1.95-.929-.262-.095-.453-.143-.644.143-.191.286-.74 0-.91.095-.171.096-.341.048-.627-.095-1.282-.642-2.141-1.39-2.996-2.855-.226-.388-.023-.598.12-.74.128-.128.285-.333.428-.5.143-.166.19-.285.285-.476.095-.19.048-.357-.024-.5-.071-.143-.644-1.552-.882-2.123-.232-.556-.468-.481-.644-.49-.166-.008-.357-.01-.548-.01s-.5.072-.762.357c-.262.286-1 0-1 2.43 0 2.428 1.763 4.77 2.001 5.085.238.315 3.47 5.298 8.406 7.428 1.173.507 2.089.81 2.803 1.036 1.18.375 2.253.322 3.101.195.946-.142 2.91-1.189 3.32-2.336.41-1.147.41-2.13.286-2.336-.124-.207-.315-.302-.6-.445z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-slate-200">
                Colegio Provincial Presbítero Virgilio Carlos Ferreyra
              </p>
              <p className="text-[11px] text-slate-400">
                Sala de Informática • Anillaco, La Rioja, Argentina
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-medium">
              <button 
                onClick={() => {
                  const modal = document.getElementById('terms_modal');
                  if (modal) modal.showModal();
                }}
                className="hover:text-blue-400 underline transition-colors"
              >
                Términos y Privacidad
              </button>
              <span>•</span>
              <span className="font-mono text-slate-400">v1.0.0</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-mono">
            © 2026 — Plataforma Digital de Gestión Educativa. Todos los derechos reservados.
          </p>

        </div>
      </footer>

      {/* MODAL DE LOGIN */}
      <dialog id="login_modal" className="modal modal-bottom sm:modal-middle z-50">
        <div className="modal-box bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-md">
          
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-16 h-16 relative flex items-center justify-center">
              <Image src="/logo.png" alt="Logo Colegio" fill unoptimized className="object-contain" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h3>
              <p className="text-xs text-slate-500 mt-1">En tu primer ingreso, tu contraseña es tu DNI</p>
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
              <h3 className="text-lg font-black text-slate-900">Recuperación de Contraseña</h3>
              <p className="text-xs text-slate-500">Si olvidaste tu clave, el administrador institucional restablecerá tu cuenta a tu DNI inicial.</p>
            </div>

            <form onSubmit={handleSolicitarBlanqueo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tu DNI</label>
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
                  <p className="text-[11px] text-slate-600 font-normal">📍 Contacto: Secretaría Escolar / Administración</p>
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
              <h3 className="text-lg font-black text-slate-900">Cambio de Contraseña Obligatorio</h3>
              <p className="text-xs text-slate-500">Es tu primer inicio de sesión. Por seguridad, definí una nueva clave personal.</p>
            </div>

            <form onSubmit={handleGuardarNuevaPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
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
            <p><strong>1. Marco Institucional:</strong> El Portal Escolar Digital es de uso exclusivo para la comunidad educativa del <em>Colegio Provincial Presbítero Virgilio Carlos Ferreyra</em>.</p>
            <p><strong>2. Protección de Datos (Ley N° 25.326):</strong> Los datos académicos, personales y de asistencia registrados son confidenciales.</p>
            <p><strong>3. Responsabilidad de Credenciales:</strong> Cada usuario es responsable de mantener la confidencialidad de su contraseña.</p>
            <p><strong>4. Auditoría:</strong> Las interacciones dentro de la plataforma son registradas con fines de seguridad.</p>
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

      {/* MODAL RADIO ESCOLAR */}
      <dialog id="radio_modal" className="modal modal-bottom sm:modal-middle z-[65]">
        <div className="modal-box bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-md">
          
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 shadow-inner">
              📻
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-black text-slate-900">Radio Escolar VCF</h3>
                
                {radioEnVivo && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                    En Vivo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Colegio Provincial Presbítero Virgilio Carlos Ferreyra</p>
            </div>
          </div>

          {radioEnVivo ? (
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">Transmisión en directo desde Anillaco</p>
                <p className="text-[11px] text-slate-500">Señal Institucional</p>
              </div>

              <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 flex items-center justify-center">
                <iframe
                  src={urlStreamRadio}
                  className="w-full h-full border-0"
                  allow="autoplay"
                  title="Radio Escolar en Vivo"
                ></iframe>
              </div>
            </div>



          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <span className="text-2xl">🎙️</span>
              <p className="text-xs font-bold text-slate-700">Sin transmisión en directo</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                En este momento la radio no se encuentra transmitiendo en vivo. Consultá la programación semanal en la secretaría del colegio.
              </p>
            </div>
          )}

          <div className="modal-action mt-6">
            <form method="dialog" className="w-full">
              <button className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider w-full rounded-full border-none">
                Cerrar
              </button>
            </form>
          </div>

        </div>
      </dialog>

      {/* MODAL RESEÑA HISTÓRICA */}
      <dialog id="historia_modal" className="modal modal-bottom sm:modal-middle z-[65]">
        <div className="modal-box bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-2xl max-h-[85vh] overflow-y-auto">
          
          <div className="flex flex-col items-center text-center space-y-3 mb-6 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 shadow-inner">
              🏛️
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Nuestros Orígenes
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Reseña Histórica Institucional
              </h3>
              <p className="text-xs text-slate-500">Colegio Provincial Pbro. Virgilio Carlos Ferreyra • Anillaco, La Rioja</p>
            </div>
          </div>

          {/* Texto dinámico que viene de Firestore */}
          <div className="space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed text-left whitespace-pre-line">
            {historiaContenido || "Cargando reseña histórica institucional..."}
          </div>

          <div className="modal-action mt-8 border-t border-slate-100 pt-4">
            <form method="dialog" className="w-full">
              <button className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider w-full rounded-full border-none">
                Cerrar Historia
              </button>
            </form>
          </div>

        </div>
      </dialog>

    </div>
  );
}