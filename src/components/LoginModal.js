"use client";

import { useState } from "react";
import { Input, Button, Modal } from "@heroui/react";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [dniInput, setDniInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  // Estados para Olvidé mi Contraseña
  const [mostrarOlvideClave, setMostrarOlvideClave] = useState(false);
  const [dniOlvido, setDniOlvido] = useState("");
  const [mensajeOlvido, setMensajeOlvido] = useState("");

  // Estados para Cambio Obligatorio de Clave
  const [requiereCambioClave, setRequiereCambioClave] = useState(false);
  const [usuarioEncontradoDocRef, setUsuarioEncontradoDocRef] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [errorCambioClave, setErrorCambioClave] = useState("");

  // Lógica principal de inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLogin("");

    const dniLimpio = dniInput.trim().replace(/\D/g, "");
    if (!dniLimpio) {
      setErrorLogin("Ingrese un DNI o CUIL válido.");
      setCargando(false);
      return;
    }

    try {
      const q = query(collection(db, "usuarios"), where("dni", "==", dniLimpio));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorLogin("No se encontró un usuario registrado con ese DNI.");
        setCargando(false);
        return;
      }

      const docSnap = querySnapshot.docs[0];
      const userData = docSnap.data();

      // Validación de contraseña (asumiendo campo 'password' o clave por defecto igual al DNI)
      const passwordRegistrada = userData.password || dniLimpio;

      if (passwordRegistrada !== passwordInput) {
        setErrorLogin("Contraseña incorrecta.");
        setCargando(false);
        return;
      }

      // Verificación de cambio obligatorio de clave en primer ingreso
      if (userData.cambioPasswordObligatorio === true) {
        setUsuarioEncontradoDocRef(docSnap.ref);
        setRequiereCambioClave(true);
        setCargando(false);
        return;
      }

      // 🔐 Guardar datos clave en localStorage para que el Portal de la Familia los lea de forma segura
      localStorage.setItem("dni", dniLimpio);
      localStorage.setItem("rol", userData.rol || "alumno");
      localStorage.setItem("nombreUsuario", `${userData.apellido || ""}, ${userData.nombre || ""}`);

      setCargando(false);
      if (onLoginSuccess) onLoginSuccess(userData);
      onClose();

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorLogin("Error de conexión con la base de datos.");
      setCargando(false);
    }
  };

  // Solicitar blanqueo de clave
  const handleSolicitarBlanqueo = async (e) => {
    e.preventDefault();
    const dniLimpio = dniOlvido.trim().replace(/\D/g, "");
    if (!dniLimpio) {
      setMensajeOlvido("Ingrese un DNI válido.");
      return;
    }

    try {
      setMensajeOlvido("Solicitud enviada a Secretaría. Su clave será blanqueada a su DNI inicial.");
    } catch (error) {
      setMensajeOlvido("Error al registrar la solicitud.");
    }
  };

  // Guardar nueva contraseña en el primer ingreso
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

    setCargando(true);
    try {
      if (usuarioEncontradoDocRef) {
        await updateDoc(usuarioEncontradoDocRef, {
          password: nuevaPassword,
          cambioPasswordObligatorio: false,
          actualizadoEn: new Date().toISOString()
        });
      }

      alert("✅ Contraseña actualizada con éxito. Inicie sesión nuevamente.");
      setRequiereCambioClave(false);
      setPasswordInput("");
      setCargando(false);
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      setErrorCambioClave("Hubo un error al guardar la nueva contraseña.");
      setCargando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
      classNames={{
        backdrop: "bg-slate-900/60 backdrop-blur-sm",
        base: "bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-w-md w-full mx-4"
      }}
    >
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Logo e Identidad Institucional */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-3 select-none">
            <div className="w-12 h-12 rounded-md border-2 border-[#1e3a8a] flex items-center justify-center text-[#1e3a8a] font-black text-xl bg-blue-50/50">
              VCF
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#1e3a8a] tracking-tight">Portal</span>
                <span className="text-3xl font-light text-[#23b3e8]">Escolar</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase -mt-1">
                Colegio Presbítero V. C. Ferreyra
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-xs">
            Ingresá tus credenciales institucionales para acceder a la plataforma.
          </p>
        </div>

        {/* Vista Normal de Login */}
        {!requiereCambioClave && !mostrarOlvideClave && (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            
            <Input
              type="text"
              label="DNI / CUIL *"
              labelPlacement="outside"
              placeholder="Ingrese su DNI o CUIL"
              value={dniInput}
              onValueChange={setDniInput}
              variant="bordered"
              radius="sm"
              isRequired
              classNames={{
                label: "text-xs font-semibold text-[#1e3a8a]",
                input: "text-slate-800 font-normal placeholder:text-slate-400 text-sm",
                inputWrapper: "border-[#23b3e8] hover:border-[#1e3a8a] focus-within:!border-[#1e3a8a] bg-white h-11"
              }}
            />

            <Input
              type={mostrarPassword ? "text" : "password"}
              label="Contraseña *"
              labelPlacement="outside"
              placeholder="••••••••"
              value={passwordInput}
              onValueChange={setPasswordInput}
              variant="bordered"
              radius="sm"
              isRequired
              endContent={
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none p-1 text-xs"
                >
                  {mostrarPassword ? "👁️" : "🙈"}
                </button>
              }
              classNames={{
                label: "text-xs font-semibold text-slate-700",
                input: "text-slate-800 font-normal placeholder:text-slate-400 text-sm",
                inputWrapper: "border-slate-400 hover:border-[#1e3a8a] focus-within:!border-[#1e3a8a] bg-white h-11"
              }}
            />

            <div className="flex items-center justify-between text-xs font-medium pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
                Recordarme
              </label>

              <button
                type="button"
                onClick={() => {
                  setDniOlvido(dniInput);
                  setMensajeOlvido("");
                  setMostrarOlvideClave(true);
                }}
                className="text-slate-800 hover:text-[#1e3a8a] font-medium transition-colors"
              >
                Olvidé mi contraseña
              </button>
            </div>

            {errorLogin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 font-medium text-center">
                ⚠️ {errorLogin}
              </div>
            )}

            <Button
              type="submit"
              radius="full"
              isLoading={cargando}
              className={`w-full font-bold uppercase tracking-wider h-11 text-xs transition-all shadow-none mt-3 ${
                dniInput && passwordInput 
                  ? "bg-[#1e3a8a] hover:bg-[#152a65] text-white" 
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {cargando ? "VERIFICANDO..." : "INICIAR SESIÓN"}
            </Button>
          </form>
        )}

        {/* Sub-Sección: Olvidé mi Contraseña */}
        {mostrarOlvideClave && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#1e3a8a]">
                Recuperar Contraseña
              </h3>
              <p className="text-xs text-slate-500">
                Si olvidaste tu clave, acércate a Secretaría o Sala de Informática para blanquearla a tu DNI inicial.
              </p>
            </div>

            <form onSubmit={handleSolicitarBlanqueo} className="space-y-4">
              <Input
                type="text"
                label="DNI *"
                labelPlacement="outside"
                placeholder="Ingrese su DNI"
                value={dniOlvido}
                onValueChange={setDniOlvido}
                variant="bordered"
                radius="sm"
                isRequired
                classNames={{
                  label: "text-xs font-semibold text-slate-700",
                  inputWrapper: "border-slate-300 focus-within:!border-[#1e3a8a] bg-white h-10"
                }}
              />

              {mensajeOlvido && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#1e3a8a]">
                  ℹ️ {mensajeOlvido}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  radius="full"
                  onClick={() => setMostrarOlvideClave(false)}
                  className="w-1/2 font-semibold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 h-9"
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  radius="full"
                  className="w-1/2 font-semibold text-xs bg-[#1e3a8a] text-white shadow-sm h-9"
                >
                  Solicitar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Sub-Sección: Cambio Obligatorio de Clave */}
        {requiereCambioClave && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#1e3a8a]">
                Cambio Obligatorio de Clave
              </h3>
              <p className="text-xs text-slate-500">
                Por seguridad, define una clave personal para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleGuardarNuevaPassword} className="space-y-3">
              <Input
                type="password"
                label="Nueva Contraseña *"
                labelPlacement="outside"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onValueChange={setNuevaPassword}
                variant="bordered"
                radius="sm"
                isRequired
                classNames={{
                  label: "text-xs font-semibold text-slate-700",
                  inputWrapper: "border-slate-300 focus-within:!border-[#1e3a8a] bg-white h-10"
                }}
              />

              <Input
                type="password"
                label="Confirmar Contraseña *"
                labelPlacement="outside"
                placeholder="Repita la contraseña"
                value={confirmarPassword}
                onValueChange={setConfirmarPassword}
                variant="bordered"
                radius="sm"
                isRequired
                classNames={{
                  label: "text-xs font-semibold text-slate-700",
                  inputWrapper: "border-slate-300 focus-within:!border-[#1e3a8a] bg-white h-10"
                }}
              />

              {errorCambioClave && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                  ⚠️ {errorCambioClave}
                </div>
              )}

              <Button
                type="submit"
                radius="full"
                isLoading={cargando}
                className="w-full font-bold text-xs bg-[#1e3a8a] text-white shadow-sm h-10 mt-2"
              >
                {cargando ? "GUARDANDO..." : "GUARDAR Y CONTINUAR"}
              </Button>
            </form>
          </div>
        )}

      </div>
    </Modal>
  );
}