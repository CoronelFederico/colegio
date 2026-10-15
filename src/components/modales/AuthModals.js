"use client";

import Image from "next/image";

export default function AuthModals({
  // Estados de Login
  dniInput,
  setDniInput,
  passwordInput,
  setPasswordInput,
  mostrarPassword,
  setMostrarPassword,
  aceptaTerminos,
  setAceptaTerminos,
  noSoyRobot,
  setNoSoyRobot,
  cargando,
  errorLogin,
  handleLogin,
  abrirTerminos,
  abrirOlvideClave,

  // Estados de Olvidé Clave
  mostrarOlvideClave,
  setMostrarOlvideClave,
  dniOlvido,
  setDniOlvido,
  mensajeOlvido,
  handleSolicitarBlanqueo,

  // Estados de Cambio Obligatorio de Clave
  requiereCambioClave,
  nuevaPassword,
  setNuevaPassword,
  confirmarPassword,
  setConfirmarPassword,
  errorCambioClave,
  handleGuardarNuevaPassword,
}) {
  return (
    <>
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
                  onClick={abrirOlvideClave}
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
                      abrirTerminos();
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
    </>
  );
}