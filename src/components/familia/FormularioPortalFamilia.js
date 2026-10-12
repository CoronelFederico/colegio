"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generarPDFSinide } from "@/lib/generarFichaPDFSinide";
import { generarFichaPDF } from "@/lib/generarFichaPDF";

const CHECKLIST_INICIAL = {
  fotocopiaDniAlumno: false,
  partidaNacimiento: false,
  constanciaCuilAlumno: false,
  informePedagogico: false,
  certificadoAnalitico: false,
  aptoFisico: false,
  certificadoDomicilio: false,
  carpetaEspiral: false,
  cuadernoComunicacion: false,
  foliosOficio: false,
  fotosCarnet: false,
  fotocopiaDniTutor: false,
  constanciaCuilTutor: false,
};

// --- FUNCIONES AUXILIARES DE FORMATEO ---
const limpiarSoloNumeros = (val) => String(val || "").replace(/\D/g, "");

const formatearDNI = (val) => {
  const numeros = limpiarSoloNumeros(val).slice(0, 8);
  if (!numeros) return "";
  return new Intl.NumberFormat("es-AR").format(Number(numeros));
};

const formatearCUIL = (val) => {
  const nums = limpiarSoloNumeros(val).slice(0, 11);
  if (nums.length <= 2) return nums;
  if (nums.length <= 10) return `${nums.slice(0, 2)}-${nums.slice(2)}`;
  return `${nums.slice(0, 2)}-${nums.slice(2, 10)}-${nums.slice(10)}`;
};

export default function FormularioPortalFamilia({ usuario, dniUsuarioLogueado }) {
  const [dniFijo, setDniFijo] = useState("");
  const [procesando, setProcesando] = useState(true);
  const [docRefAlumno, setDocRefAlumno] = useState(null);
  const [alumnoEncontrado, setAlumnoEncontrado] = useState(false);
  
  const [pestanaActiva, setPestanaActiva] = useState("sinide");
  const [paso, setPaso] = useState(1);
  const [yaCompletado, setYaCompletado] = useState(false);
  const [editando, setEditando] = useState(false);

  const [formData, setFormData] = useState({
    dni: "",
    apellido: "",
    nombre: "",
    cuil: "",
    fechaNacimiento: "",
    paisNacimiento: "Argentina",
    provinciaNacimiento: "La Rioja",
    localidadNacimiento: "La Rioja",
    sexo: "Masculino",
    telefonoEstudiante: "",
    tipoTelefono: "Celular",
    tipoDomicilio: "Urbano",
    domicilioProvincia: "La Rioja",
    domicilioLocalidad: "La Rioja",
    domicilioBarrio: "",
    codigoPostal: "",
    domicilioCalleNumero: "",
    referenciasDomicilio: "",
    obraSocialPosee: "Posee",
    obraSocialNombre: "",
    numeroAfiliado: "",
    vigenciaObraSocial: "",
    telefonoEmergencia: "",
    presionArterial: "",
    datosAntropometricos: "",
    tutorCuil: "",
    tutorParentesco: "Madre",
    tutorApellido: "",
    tutorNombre: "",
    tutorNivelEducativo: "Secundario completo",
    tutorOcupacion: "",
    puedeRetirar: "SI",
    tutorTelefono: "",
    recibeWhatsapp: "SI",
    tutorEmail: "",
    discapacidad: "No",
    tipoDiscapacidadCUD: "",
    docenteIntegrador: "NO",
    puebloIndigena: "NO",
    cualPuebloIndigena: "",
    contextoEncierro: "No",
    beneficiosBecas: "No",
    aceptaTerminos: false,
  });

  const [checklist, setChecklist] = useState(CHECKLIST_INICIAL);
  const [fichaInscripcionLista, setFichaInscripcionLista] = useState(false);

  useEffect(() => {
    let dniDetectado = "";
    if (usuario && usuario.dni) {
      dniDetectado = usuario.dni;
    } else if (dniUsuarioLogueado) {
      dniDetectado = dniUsuarioLogueado;
    } else {
      dniDetectado = localStorage.getItem("dni") || "";
      if (!dniDetectado) {
        const sesionStr = localStorage.getItem("usuario_sesion");
        if (sesionStr) {
          try {
            const sesionObj = JSON.parse(sesionStr);
            dniDetectado = sesionObj.dni || "";
          } catch (e) {
            console.error("Error al parsear sesión:", e);
          }
        }
      }
    }

    if (dniDetectado) {
      setDniFijo(limpiarSoloNumeros(dniDetectado));
    } else {
      setProcesando(false);
    }
  }, [usuario, dniUsuarioLogueado]);

  useEffect(() => {
    const consultarEstudianteSesion = async () => {
      const dniLimpio = limpiarSoloNumeros(dniFijo);
      if (!dniLimpio) {
        setAlumnoEncontrado(false);
        setProcesando(false);
        return;
      }

      setProcesando(true);
      try {
        let q = query(collection(db, "usuarios"), where("dni", "==", dniLimpio));
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          q = query(collection(db, "usuarios"), where("cuil", "==", dniLimpio));
          querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const dataDoc = docSnap.data();

          setDocRefAlumno(docSnap.ref);
          setAlumnoEncontrado(true);

          const completadoPrevio = 
            dataDoc.sinideCompletado === true || 
            dataDoc.sinideCompletado === "true" || 
            dataDoc.ddjjAceptada === true;
          
          setYaCompletado(completadoPrevio);
          setEditando(false);

          const docInscripcion = dataDoc.documentacionInscripcion || {};
          const fichaLista = docInscripcion.fichaInscripcion === true || dataDoc.fichaInscripcionCompletada === true;
          setFichaInscripcionLista(fichaLista);
          setChecklist({ ...CHECKLIST_INICIAL, ...docInscripcion });

          setFormData({
            dni: dniLimpio,
            apellido: dataDoc.apellido || "",
            nombre: dataDoc.nombre || "",
            cuil: limpiarSoloNumeros(dataDoc.cuil || ""),
            fechaNacimiento: dataDoc.fechaNacimiento || "",
            paisNacimiento: dataDoc.paisNacimiento || "Argentina",
            provinciaNacimiento: dataDoc.provinciaNacimiento || "La Rioja",
            localidadNacimiento: dataDoc.localidadNacimiento || "La Rioja",
            sexo: dataDoc.sexo || "Masculino",
            telefonoEstudiante: limpiarSoloNumeros(dataDoc.telefonoEstudiante || ""),
            tipoTelefono: dataDoc.tipoTelefono || "Celular",
            tipoDomicilio: dataDoc.tipoDomicilio || "Urbano",
            domicilioProvincia: dataDoc.domicilio?.provincia || "La Rioja",
            domicilioLocalidad: dataDoc.domicilio?.localidad || "La Rioja",
            domicilioBarrio: dataDoc.domicilio?.barrio || "",
            codigoPostal: dataDoc.codigoPostal || "",
            domicilioCalleNumero: typeof dataDoc.domicilio === "string" ? dataDoc.domicilio : dataDoc.domicilio?.calleNumero || "",
            referenciasDomicilio: dataDoc.referenciasDomicilio || "",
            obraSocialPosee: dataDoc.salud?.obraSocialPosee || "Posee",
            obraSocialNombre: dataDoc.salud?.nombreObraSocial || "",
            numeroAfiliado: dataDoc.salud?.numeroAfiliado || "",
            vigenciaObraSocial: dataDoc.salud?.vigencia || "",
            telefonoEmergencia: limpiarSoloNumeros(dataDoc.salud?.telefonoEmergencia || ""),
            presionArterial: dataDoc.salud?.presionArterial || "",
            datosAntropometricos: dataDoc.salud?.antropometricos || "",
            tutorCuil: limpiarSoloNumeros(dataDoc.tutor?.cuil || ""),
            tutorParentesco: dataDoc.tutor?.parentesco || "Madre",
            tutorApellido: dataDoc.tutor?.apellido || "",
            tutorNombre: dataDoc.tutor?.nombre || "",
            tutorNivelEducativo: dataDoc.tutor?.nivelEducativo || "Secundario completo",
            tutorOcupacion: dataDoc.tutor?.ocupacion || "",
            puedeRetirar: dataDoc.tutor?.puedeRetirar || "SI",
            tutorTelefono: limpiarSoloNumeros(dataDoc.tutor?.telefono || ""),
            recibeWhatsapp: dataDoc.tutor?.recibeWhatsapp || "SI",
            tutorEmail: (dataDoc.tutor?.email || "").toLowerCase().trim(),
            discapacidad: dataDoc.inclusion?.discapacidad || "No",
            tipoDiscapacidadCUD: dataDoc.inclusion?.tipoDiscapacidadCUD || "",
            docenteIntegrador: dataDoc.inclusion?.docenteIntegrador || "NO",
            puebloIndigena: dataDoc.inclusion?.puebloIndigena || "NO",
            cualPuebloIndigena: dataDoc.inclusion?.cualPuebloIndigena || "",
            contextoEncierro: dataDoc.inclusion?.contextoEncierro || "No",
            beneficiosBecas: dataDoc.inclusion?.beneficiosBecas || "No",
            aceptaTerminos: completadoPrevio,
          });

          setPaso(1);
        } else {
          setAlumnoEncontrado(false);
          setDocRefAlumno(null);
        }
      } catch (error) {
        console.error("Error al consultar legajo:", error);
      } finally {
        setProcesando(false);
      }
    };

    consultarEstudianteSesion();
  }, [dniFijo]);

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    if (!formData.aceptaTerminos) {
      alert("⚠️ Debés aceptar la Declaración Jurada para guardar el formulario.");
      return;
    }

    setProcesando(true);
    try {
      const paqueteDatosActualizados = {
        sinideCompletado: true,
        ddjjAceptada: true,
        actualizadoEn: new Date().toISOString(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: limpiarSoloNumeros(formData.dni),
        cuil: limpiarSoloNumeros(formData.cuil),
        fechaNacimiento: formData.fechaNacimiento,
        paisNacimiento: formData.paisNacimiento,
        provinciaNacimiento: formData.provinciaNacimiento,
        localidadNacimiento: formData.localidadNacimiento,
        sexo: formData.sexo,
        telefonoEstudiante: limpiarSoloNumeros(formData.telefonoEstudiante),
        tipoTelefono: formData.tipoTelefono,
        tipoDomicilio: formData.tipoDomicilio,
        codigoPostal: formData.codigoPostal,
        referenciasDomicilio: formData.referenciasDomicilio,
        domicilio: {
          calleNumero: formData.domicilioCalleNumero.trim(),
          barrio: formData.domicilioBarrio.trim(),
          localidad: formData.domicilioLocalidad,
          provincia: formData.domicilioProvincia,
        },
        salud: {
          obraSocialPosee: formData.obraSocialPosee,
          nombreObraSocial: formData.obraSocialNombre,
          numeroAfiliado: formData.numeroAfiliado,
          vigencia: formData.vigenciaObraSocial,
          telefonoEmergencia: limpiarSoloNumeros(formData.telefonoEmergencia),
          presionArterial: formData.presionArterial,
          antropometricos: formData.datosAntropometricos,
        },
        tutor: {
          cuil: limpiarSoloNumeros(formData.tutorCuil),
          parentesco: formData.tutorParentesco,
          apellido: formData.tutorApellido.trim(),
          nombre: formData.tutorNombre.trim(),
          nivelEducativo: formData.tutorNivelEducativo,
          ocupacion: formData.tutorOcupacion,
          puedeRetirar: formData.puedeRetirar,
          telefono: limpiarSoloNumeros(formData.tutorTelefono),
          recibeWhatsapp: formData.recibeWhatsapp,
          email: formData.tutorEmail.toLowerCase().trim(),
        },
        inclusion: {
          discapacidad: formData.discapacidad,
          tipoDiscapacidadCUD: formData.tipoDiscapacidadCUD,
          docenteIntegrador: formData.docenteIntegrador,
          puebloIndigena: formData.puebloIndigena,
          cualPuebloIndigena: formData.cualPuebloIndigena,
          contextoEncierro: formData.contextoEncierro,
          beneficiosBecas: formData.beneficiosBecas,
        },
      };

      if (docRefAlumno) {
        await updateDoc(docRefAlumno, paqueteDatosActualizados);
      }

      setYaCompletado(true);
      setEditando(false);
      setPaso(1);
      alert("✅ Legajo SInIDE guardado y actualizado con éxito.");
    } catch (error) {
      console.error("Error al guardar SInIDE:", error);
      alert("⚠️ Hubo un error al guardar los datos en Firestore.");
    } finally {
      setProcesando(false);
    }
  };

  // 📄 Descarga PDF SInIDE (Comprobante Validado)
  const handleDescargarPDFSinide = async () => {
    try {
      const datosAlumnoParaPDF = {
        ...formData,
        dni: formatearDNI(formData.dni || dniFijo),
        cuil: formatearCUIL(formData.cuil),
        tutorCuil: formatearCUIL(formData.tutorCuil),
      };
      await generarPDFSinide(datosAlumnoParaPDF);
    } catch (err) {
      console.error("❌ Error al generar PDF SInIDE:", err);
      alert(`⚠️ Hubo un error al generar la ficha SInIDE: ${err.message || err}`);
    }
  };

  // 📁 Descarga Ficha de Inscripción (Checklist y Solicitud)
  const handleDescargarFichaInscripcion = async () => {
    try {
      const datosAlumnoParaFicha = {
        ...formData,
        dni: formatearDNI(formData.dni || dniFijo),
        dniTutor: formatearCUIL(formData.tutorCUIL || formData.tutorCuil),
        nombreTutor: `${formData.tutorApellido}, ${formData.tutorNombre}`,
        domicilio: `${formData.domicilioCalleNumero}, ${formData.domicilioBarrio}`,
        telefono: formData.tutorTelefono,
        correoTutor: formData.tutorEmail,
      };
      await generarFichaPDF(datosAlumnoParaFicha, checklist);
    } catch (err) {
      console.error("❌ Error al generar Ficha de Inscripción:", err);
      alert(`⚠️ Hubo un error al generar la ficha de inscripción: ${err.message || err}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs text-slate-800">
      
      {/* Encabezado */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1e295d]">Portal de la Familia</h1>
          <p className="text-xs text-slate-500">
            Relevamiento SInIDE & Ficha de Inscripción • Colegio Provincial Pbro. Virgilio Carlos Ferreyra
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-500 text-[10px] uppercase">DNI Vinculado:</span>
          <span className="font-black text-slate-800 text-xs">{formatearDNI(dniFijo) || "---"}</span>
        </div>
      </div>

      {procesando && (
        <div className="py-12 text-center font-bold text-slate-500">Cargando información del estudiante...</div>
      )}

      {!procesando && !alumnoEncontrado && (
        <div className="p-8 bg-slate-50 rounded-3xl text-center space-y-2">
          <h3 className="font-extrabold text-slate-700 text-sm">Sesión no vinculada</h3>
          <p className="text-slate-500 text-xs">
            No se encontró un legajo asociado al DNI ({formatearDNI(dniFijo) || "Sin DNI"}). Verifique que la cuenta tenga su documento registrado en Firestore.
          </p>
        </div>
      )}

      {alumnoEncontrado && !procesando && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl font-bold">
            <button
              type="button"
              onClick={() => setPestanaActiva("sinide")}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                pestanaActiva === "sinide" ? "bg-white text-[#1e295d] shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 Legajo SInIDE (Digital) {yaCompletado ? "✅ Completo" : "⚠️ Pendiente"}
            </button>
            <button
              type="button"
              onClick={() => setPestanaActiva("inscripcion")}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                pestanaActiva === "inscripcion" ? "bg-white text-[#1e295d] shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📁 Ficha de Inscripción & Papeles {fichaInscripcionLista ? "✅ Completa" : "⚠️ Pendiente"}
            </button>
          </div>

          {pestanaActiva === "sinide" && (
            <div className="space-y-6">
              
              {yaCompletado && !editando ? (
                <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-3xl space-y-5 text-center">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-black">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-emerald-900">¡SInIDE Completado Exitosamente!</h2>
                    <p className="text-emerald-700 text-xs">
                      Los datos digitales de <strong>{formData.apellido}, {formData.nombre}</strong> (DNI: {formatearDNI(formData.dni)}) se encuentran registrados y validados.
                    </p>
                  </div>

                  <div className="bg-white/90 p-4 rounded-2xl border border-emerald-200 text-left space-y-1 max-w-lg mx-auto">
                    <p><strong>CUIL:</strong> {formatearCUIL(formData.cuil) || "---"}</p>
                    <p><strong>Domicilio:</strong> {formData.domicilioCalleNumero}, {formData.domicilioBarrio}</p>
                    <p><strong>Tutor Responsable:</strong> {formData.tutorApellido}, {formData.tutorNombre} ({formData.tutorTelefono})</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                      type="button"
                      onClick={handleDescargarPDFSinide}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      📄 Descargar Comprobante SInIDE (PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditando(true)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      ✏️ Modificar / Editar Datos SInIDE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl overflow-x-auto gap-2">
                    <span className={paso === 1 ? "text-blue-600 font-extrabold" : ""}>1. Estudiante</span>
                    <span className={paso === 2 ? "text-blue-600 font-extrabold" : ""}>2. Domicilio</span>
                    <span className={paso === 3 ? "text-blue-600 font-extrabold" : ""}>3. Salud</span>
                    <span className={paso === 4 ? "text-blue-600 font-extrabold" : ""}>4. Tutor</span>
                    <span className={paso === 5 ? "text-blue-600 font-extrabold" : ""}>5. Extras & DDJJ</span>
                  </div>

                  {/* PASO 1: ESTUDIANTE */}
                  {paso === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black text-slate-800 uppercase">📌 1. Datos Personales del Estudiante</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
                          <input type="text" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
                          <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Número de CUIL *</label>
                          <input type="text" placeholder="20-40123456-8" value={formatearCUIL(formData.cuil)} onChange={(e) => setFormData({ ...formData, cuil: limpiarSoloNumeros(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                          <input type="date" value={formData.fechaNacimiento} onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">País de Nacimiento *</label>
                          <input type="text" value={formData.paisNacimiento} onChange={(e) => setFormData({ ...formData, paisNacimiento: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Provincia de Nacimiento *</label>
                          <input type="text" value={formData.provinciaNacimiento} onChange={(e) => setFormData({ ...formData, provinciaNacimiento: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Localidad de Nacimiento *</label>
                          <input type="text" value={formData.localidadNacimiento} onChange={(e) => setFormData({ ...formData, localidadNacimiento: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Sexo *</label>
                          <select value={formData.sexo} onChange={(e) => setFormData({ ...formData, sexo: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Teléfono del Estudiante *</label>
                          <input type="text" placeholder="3804123456" value={formData.telefonoEstudiante} onChange={(e) => setFormData({ ...formData, telefonoEstudiante: limpiarSoloNumeros(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tipo de Teléfono *</label>
                          <select value={formData.tipoTelefono} onChange={(e) => setFormData({ ...formData, tipoTelefono: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="Celular">Celular</option>
                            <option value="Fijo">Fijo</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setPaso(2)} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Siguiente: Domicilio ➔</button>
                      </div>
                    </div>
                  )}

                  {/* PASO 2: DOMICILIO */}
                  {paso === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black text-slate-800 uppercase">🏠 2. Domicilio del Estudiante</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tipo de Domicilio *</label>
                          <select value={formData.tipoDomicilio} onChange={(e) => setFormData({ ...formData, tipoDomicilio: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="Urbano">Urbano</option>
                            <option value="Rural">Rural</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Provincia *</label>
                          <input type="text" value={formData.domicilioProvincia} onChange={(e) => setFormData({ ...formData, domicilioProvincia: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Localidad *</label>
                          <input type="text" value={formData.domicilioLocalidad} onChange={(e) => setFormData({ ...formData, domicilioLocalidad: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Barrio *</label>
                          <input type="text" value={formData.domicilioBarrio} onChange={(e) => setFormData({ ...formData, domicilioBarrio: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Código Postal *</label>
                          <input type="text" value={formData.codigoPostal} onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Calle y Número *</label>
                          <input type="text" value={formData.domicilioCalleNumero} onChange={(e) => setFormData({ ...formData, domicilioCalleNumero: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Referencias (Entre Calles) *</label>
                          <input type="text" value={formData.referenciasDomicilio} onChange={(e) => setFormData({ ...formData, referenciasDomicilio: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setPaso(1)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold cursor-pointer">Atrás</button>
                        <button type="button" onClick={() => setPaso(3)} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Siguiente: Salud ➔</button>
                      </div>
                    </div>
                  )}

                  {/* PASO 3: SALUD */}
                  {paso === 3 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black text-slate-800 uppercase">🏥 3. Salud y Datos Antropométricos</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Obra Social / Prepaga *</label>
                          <select value={formData.obraSocialPosee} onChange={(e) => setFormData({ ...formData, obraSocialPosee: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="Posee">Posee</option>
                            <option value="No Posee">No Posee</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nombre Obra Social / Prepaga *</label>
                          <input type="text" placeholder="Ej: OSDE / APOS / NO" value={formData.obraSocialNombre} onChange={(e) => setFormData({ ...formData, obraSocialNombre: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Número de Afiliado *</label>
                          <input type="text" placeholder="Número o NO" value={formData.numeroAfiliado} onChange={(e) => setFormData({ ...formData, numeroAfiliado: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Vigencia Obra Social *</label>
                          <input type="text" placeholder="Desde - Hasta o NO" value={formData.vigenciaObraSocial} onChange={(e) => setFormData({ ...formData, vigenciaObraSocial: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Teléfono de Emergencia *</label>
                          <input type="text" placeholder="3804123456" value={formData.telefonoEmergencia} onChange={(e) => setFormData({ ...formData, telefonoEmergencia: limpiarSoloNumeros(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Presión Arterial (Máx / Mín / Fecha) *</label>
                          <input type="text" placeholder="Ej: 120/80 - 10/10/2026" value={formData.presionArterial} onChange={(e) => setFormData({ ...formData, presionArterial: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Datos Antropométricos (Peso / Altura / Fecha) *</label>
                          <input type="text" placeholder="Ej: 55kg - 1.65m - 10/10/2026" value={formData.datosAntropometricos} onChange={(e) => setFormData({ ...formData, datosAntropometricos: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setPaso(2)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold cursor-pointer">Atrás</button>
                        <button type="button" onClick={() => setPaso(4)} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Siguiente: Tutor ➔</button>
                      </div>
                    </div>
                  )}

                  {/* PASO 4: TUTOR */}
                  {paso === 4 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black text-slate-800 uppercase">👨‍👩‍👧 4. Datos del Tutor / Responsable Legal</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">CUIL Tutor/a *</label>
                          <input type="text" placeholder="20-30123456-7" value={formatearCUIL(formData.tutorCuil)} onChange={(e) => setFormData({ ...formData, tutorCuil: limpiarSoloNumeros(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Parentesco *</label>
                          <select value={formData.tutorParentesco} onChange={(e) => setFormData({ ...formData, tutorParentesco: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="Padre">Padre</option>
                            <option value="Madre">Madre</option>
                            <option value="Tutor Legal">Tutor Legal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
                          <input type="text" value={formData.tutorApellido} onChange={(e) => setFormData({ ...formData, tutorApellido: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
                          <input type="text" value={formData.tutorNombre} onChange={(e) => setFormData({ ...formData, tutorNombre: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Máximo Nivel Educativo *</label>
                          <select value={formData.tutorNivelEducativo} onChange={(e) => setFormData({ ...formData, tutorNivelEducativo: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="Primario Incompleto">Primario Incompleto</option>
                            <option value="Primario Completo">Primario Completo</option>
                            <option value="Secundario Incompleto">Secundario Incompleto</option>
                            <option value="Secundario completo">Secundario completo</option>
                            <option value="Terciario Incompleto">Terciario Incompleto</option>
                            <option value="Terciario Completo">Terciario Completo</option>
                            <option value="Universitario Incompleto">Universitario Incompleto</option>
                            <option value="Universitario Completo">Universitario Completo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Ocupación *</label>
                          <input type="text" value={formData.tutorOcupacion} onChange={(e) => setFormData({ ...formData, tutorOcupacion: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">¿Puede retirar al estudiante? *</label>
                          <select value={formData.puedeRetirar} onChange={(e) => setFormData({ ...formData, puedeRetirar: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="SI">SI</option>
                            <option value="NO">NO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Teléfono de Contacto *</label>
                          <input type="text" placeholder="3804123456" value={formData.tutorTelefono} onChange={(e) => setFormData({ ...formData, tutorTelefono: limpiarSoloNumeros(e.target.value) })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">¿Recibe mensajes por WhatsApp? *</label>
                          <select value={formData.recibeWhatsapp} onChange={(e) => setFormData({ ...formData, recibeWhatsapp: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="SI">SI</option>
                            <option value="NO">NO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                          <input type="email" placeholder="ejemplo@correo.com" value={formData.tutorEmail} onChange={(e) => setFormData({ ...formData, tutorEmail: e.target.value.toLowerCase().trim() })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setPaso(3)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold cursor-pointer">Atrás</button>
                        <button type="button" onClick={() => setPaso(5)} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Siguiente: Inclusión & DDJJ ➔</button>
                      </div>
                    </div>
                  )}

                  {/* PASO 5: EXTRAS, INCLUSIÓN Y DDJJ */}
                  {paso === 5 && (
                    <form onSubmit={handleSubmitFinal} className="space-y-4">
                      <h2 className="text-sm font-black text-slate-800 uppercase">📋 5. Datos Complementarios, Inclusión y DDJJ</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Discapacidad (CUD) *</label>
                          <select value={formData.discapacidad} onChange={(e) => setFormData({ ...formData, discapacidad: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="No">No</option>
                            <option value="Sí">Sí</option>
                          </select>
                        </div>
                        {formData.discapacidad === "Sí" && (
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Tipo de Discapacidad / CUD *</label>
                            <input type="text" value={formData.tipoDiscapacidadCUD} onChange={(e) => setFormData({ ...formData, tipoDiscapacidadCUD: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                          </div>
                        )}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Docente Integrador *</label>
                          <select value={formData.docenteIntegrador} onChange={(e) => setFormData({ ...formData, docenteIntegrador: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">¿Pertenece a Pueblo Indígena? *</label>
                          <select value={formData.puebloIndigena} onChange={(e) => setFormData({ ...formData, puebloIndigena: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                          </select>
                        </div>
                        {formData.puebloIndigena === "SI" && (
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">¿A cuál pertenece? *</label>
                            <input type="text" value={formData.cualPuebloIndigena} onChange={(e) => setFormData({ ...formData, cualPuebloIndigena: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium" />
                          </div>
                        )}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Contexto de Encierro *</label>
                          <select value={formData.contextoEncierro} onChange={(e) => setFormData({ ...formData, contextoEncierro: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Beneficios / Becas *</label>
                          <select value={formData.beneficiosBecas} onChange={(e) => setFormData({ ...formData, beneficiosBecas: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white">
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Al marcar esta casilla, declaro bajo juramento que soy el tutor/a legal o responsable registrado del estudiante. Confirmo que todos los datos consignados en este formulario son exactos, veraces y actualizados[cite: 15].
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.aceptaTerminos} onChange={(e) => setFormData({ ...formData, aceptaTerminos: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-xs font-bold text-amber-950">ACEPTO Y DECLARO BAJO JURAMENTO LOS DATOS (SInIDE)[cite: 15]</span>
                        </label>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={() => setPaso(4)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold cursor-pointer">Atrás</button>
                        <button type="submit" disabled={procesando || !formData.aceptaTerminos} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                          {procesando ? "Guardando..." : "💾 Guardar Legajo SInIDE"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {pestanaActiva === "inscripcion" && (
            <div className="space-y-4 py-2">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-[#1e295d] uppercase tracking-wider text-sm">
                  📁 Estado de la Ficha de Inscripción & Documentación Física
                </h3>
                <p className="text-slate-600">Verifique el estado actual de la recepción de documentación y matrícula escolar en la institución.</p>

                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Estado en Secretaría:</span>
                  <span className={`px-3 py-1 rounded-xl font-bold text-xs ${fichaInscripcionLista ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {fichaInscripcionLista ? "✅ Ficha y Documentación Completa" : "⚠️ Pendiente de validación escolar"}
                  </span>
                </div>

                <div className="pt-2">
                  <button type="button" onClick={handleDescargarFichaInscripcion} className="w-full py-3 bg-[#1e295d] hover:bg-[#151e42] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2">
                    📄 Descargar Solicitud de Matrícula y Checklist (PDF Oficial)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}