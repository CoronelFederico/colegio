"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import InscripcionSecretaria from "@/components/secretaria/InscripcionSecretaria";
import LibroEntradaSalida from "@/components/secretaria/LibroEntradaSalida";
import GestionCorreos from "@/components/secretaria/GestionCorreos";
import ControlDocenteYNovedades from "@/components/secretaria/ControlDocenteYNovedades";
import { generarFichaPDF } from "@/lib/generarFichaPDF";

export default function SecretariaPage() {
    const [pestana, setPestana] = useState("inscripciones");
    const [autorizado, setAutorizado] = useState(false);
    const router = useRouter();

    useEffect(() => {
        try {
            const sesionRaw = localStorage.getItem("usuario_sesion");
            if (!sesionRaw) {
                console.warn("No hay sesión guardada, reorientando al login...");
                router.push("/");
                return;
            }

            const sesion = JSON.parse(sesionRaw);
            // Permite el ingreso tanto a la cuenta de Secretaría como al Administrador
            if (sesion.rol === "admin" || sesion.rol === "secretaria") {
                setAutorizado(true);
            } else {
                alert("No tenés permisos para acceder al módulo de Secretaría.");
                router.push("/");
            }
        } catch (e) {
            console.error("Error al leer sesión local:", e);
            router.push("/");
        }
    }, [router]);

    if (!autorizado) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-500">
                Verificando permisos de acceso...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Encabezado Institucional */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
                    <div>
                        <span className="text-xs font-extrabold uppercase text-blue-400 tracking-wider">Módulo Administrativo</span>
                        <h1 className="text-xl sm:text-2xl font-black">Secretaría Escolar</h1>

                    </div>
                    {/*<div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Contacto Institucional</p>
                         <p className="text-xs font-black text-amber-400">📞 3804202030</p>
                </div>**/}
                </div>

                {/* Pestañas de Trabajo */}
                <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
                    <button
                        onClick={() => setPestana("inscripciones")}
                        className={`px-4 py-2.5 rounded-xl transition-all ${pestana === "inscripciones"
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        📝 Inscripciones & Legajo
                    </button>
                    <button
                        onClick={() => setPestana("libro")}
                        className={`px-4 py-2.5 rounded-xl transition-all ${pestana === "libro"
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        📖 Libro Entrada / Salida
                    </button>
                    <button
                        onClick={() => setPestana("correos")}
                        className={`px-4 py-2.5 rounded-xl transition-all ${pestana === "correos"
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        📧 Correos & Mails
                    </button>
                    <button
                        onClick={() => setPestana("control")}
                        className={`px-4 py-2.5 rounded-xl transition-all ${pestana === "control"
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        📊 Control Docente & Novedades
                    </button>
                </div>

                {/* Contenido según la pestaña seleccionada */}
                {pestana === "inscripciones" && <InscripcionSecretaria />}
                {pestana === "libro" && <LibroEntradaSalida />}
                {pestana === "correos" && <GestionCorreos />}
                {pestana === "control" && <ControlDocenteYNovedades />}

            </div>
        </div >
    );
}