"use client";

import { useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FormularioPortalFamilia() {
  const [paso, setPaso] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [alumnoEncontrado, setAlumnoEncontrado] = useState(false);
  const [docIdAlumno, setDocIdAlumno] = useState(null);

  // Estado unificado del formulario
  const [formData, setFormData] = useState({
    // 1. Datos Personales
    dni: "",
    apellido: "",
    nombre: "",
    cuil: "",
    fechaNacimiento: "",
    sexo: "Masculino",
    paisNacimiento: "Argentina",
    provinciaNacimiento: "La Rioja",
    localidadNacimiento: "La Rioja",
    telefonoEstudiante: "3804202030",
    tipoTelefono: "Celular",

    // 2. Domicilio
    domicilioTipo: "Urbano",
    domicilioProvincia: "La Rioja",
    domicilioLocalidad: "La Rioja",
    domicilioBarrio: "",
    domicilioCP: "5300",
    domicilioCalleNumero: "",
    domicilioReferencias: "",

    // 3. Salud
    obraSocialPosee: "No Posee",
    obraSocialNombre: "NO",
    obraSocialAfiliado: "NO",
    obraSocialVigencia: "NO",
    telefonoEmergencia: "3804202030",
    presionMaxima: "",
    presionMinima: "",
    presionFecha: "",
    peso: "",
    altura: "",
    antropometriaFecha: "",

    // 4. Tutor / Grupo Familiar
    tutorCuil: "",
    tutorParentesco: "Madre",
    tutorApellido: "",
    tutorNombre: "",
    tutorNivelEducativo: "Secundario completo",
    tutorOcupacion: "",
    tutorPuedeRetirar: "SI",
    tutorTelefono: "3804202030",
    tutorWhatsapp: "SI",
    tutorPaisNacimiento: "Argentina",
    tutorProvinciaResidencia: "La Rioja",
    tutorCalleNumero: "",
    tutorEmail: "",
    tutorAccesoPortal: "Si",

    // 5. Inclusión / SINIDE
    discapacidad: "No",
    discapacidadTipo: "",
    docenteIntegrador: "NO",
    puebloIndigena: "NO",
    puebloIndigenaNombre: "",
    contextoEncierro: "No",
    beneficioBeca: "No",
    beneficioBecaDetalle: "",
    aceptaTerminos: false,
  });

  // Buscar alumno por DNI
  const handleBuscarAlumno = async (e) => {
    e.preventDefault();
    const dniLimpio = formData.dni.trim().replace(/\D/g, "");

    if (!dniLimpio) {
      alert("Por favor ingresá el DNI del estudiante.");
      return;
    }

    setProcesando(true);
    try {
      const q = query(collection(db, "usuarios"), where("dni", "==", dniLimpio));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const dataDoc = docSnap.data();

        setDocIdAlumno(docSnap.id);
        setAlumnoEncontrado(true);

        setFormData((prev) => ({
          ...prev,
          nombre: dataDoc.nombre || prev.nombre,
          apellido: dataDoc.apellido || prev.apellido,
          fechaNacimiento: dataDoc.fechaNacimiento || prev.fechaNacimiento,
          domicilioCalleNumero: dataDoc.domicilio || prev.domicilioCalleNumero,
          telefonoEstudiante: dataDoc.telefonoContacto || prev.telefonoEstudiante,
        }));

        alert(`✅ Alumno/a encontrado: ${dataDoc.apellido}, ${dataDoc.nombre}. Completá los datos faltantes.`);
      } else {
        setAlumnoEncontrado(false);
        setDocIdAlumno(null);
        alert("ℹ️ El DNI ingresado no se encuentra registrado en el sistema. Podés completar el formulario para solicitar su alta.");
      }
      setPaso(2);
    } catch (error) {
      console.error("Error al buscar estudiante:", error);
      alert("⚠️ Ocurrió un error al consultar el DNI.");
    } finally {
      setProcesando(false);
    }
  };

  // Enviar Formulario Completo
  const handleSubmitFinal = async (e) => {
    e.preventDefault();

    if (!formData.aceptaTerminos) {
      alert("Debés aceptar la Declaración Jurada para enviar el formulario.");
      return;
    }

    setProcesando(true);
    try {
      const dniLimpio = formData.dni.trim().replace(/\D/g, "");
      const paqueteDatos = {
        dni: dniLimpio,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        cuil: formData.cuil.trim(),
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        paisNacimiento: formData.paisNacimiento,
        provinciaNacimiento: formData.provinciaNacimiento,
        localidadNacimiento: formData.localidadNacimiento,
        telefonoEstudiante: formData.telefonoEstudiante,
        tipoTelefono: formData.tipoTelefono,
        rol: "alumno",

        domicilio: {
          tipo: formData.domicilioTipo,
          provincia: formData.domicilioProvincia,
          localidad: formData.domicilioLocalidad,
          barrio: formData.domicilioBarrio,
          codigoPostal: formData.domicilioCP,
          calleNumero: formData.domicilioCalleNumero,
          referencias: formData.domicilioReferencias,
        },

        salud: {
          obraSocial: formData.obraSocialPosee,
          nombreObraSocial: formData.obraSocialNombre,
          numeroAfiliado: formData.obraSocialAfiliado,
          vigencia: formData.obraSocialVigencia,
          telefonoEmergencia: formData.telefonoEmergencia,
          presionArterial: {
            maxima: formData.presionMaxima,
            minima: formData.presionMinima,
            fechaControl: formData.presionFecha,
          },
          antropometria: {
            peso: formData.peso,
            altura: formData.altura,
            fechaControl: formData.antropometriaFecha,
          },
        },

        tutor: {
          cuil: formData.tutorCuil,
          parentesco: formData.tutorParentesco,
          apellido: formData.tutorApellido,
          nombre: formData.tutorNombre,
          nivelEducativo: formData.tutorNivelEducativo,
          ocupacion: formData.tutorOcupacion,
          puedeRetirar: formData.tutorPuedeRetirar,
          telefono: formData.tutorTelefono,
          tieneWhatsapp: formData.tutorWhatsapp,
          paisNacimiento: formData.tutorPaisNacimiento,
          provinciaResidencia: formData.tutorProvinciaResidencia,
          calleNumero: formData.tutorCalleNumero,
          email: formData.tutorEmail,
          accesoPortal: formData.tutorAccesoPortal,
        },

        sinide: {
          discapacidad: formData.discapacidad,
          discapacidadTipo: formData.discapacidadTipo,
          docenteIntegrador: formData.docenteIntegrador,
          puebloIndigena: formData.puebloIndigena,
          puebloIndigenaNombre: formData.puebloIndigenaNombre,
          contextoEncierro: formData.contextoEncierro,
          beneficioBeca: formData.beneficioBeca,
          beneficioBecaDetalle: formData.beneficioBecaDetalle,
        },

        ddjjAceptada: true,
        actualizadoEn: new Date().toISOString(),
      };

      if (alumnoEncontrado && docIdAlumno) {
        // Actualizar legajo existente
        await updateDoc(doc(db, "usuarios", docIdAlumno), paqueteDatos);
        alert("✅ Legajo actualizado con éxito en el sistema SINIDE.");
      } else {
        // Alta de nuevo legajo
        await addDoc(collection(db, "usuarios"), {
          ...paqueteDatos,
          password: dniLimpio,
          primerIngreso: true,
          creadoEn: new Date().toISOString(),
        });
        alert("✅ Registro completado exitosamente en el sistema SINIDE.");
      }

      // Reiniciar
      setPaso(1);
      setAlumnoEncontrado(false);
      setDocIdAlumno(null);
    } catch (error) {
      console.error("Error al guardar formulario:", error);
      alert("⚠️ Hubo un error al guardar los datos. Intentá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
      {/* Encabezado */}
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-xl font-black text-slate-900">Portal de la Familia</h1>
        <p className="text-xs text-slate-500">
          Relevamiento de Datos del Alumno y Grupo Familiar - Declaración Jurada SINIDE (La Rioja)
        </p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl">
        <span className={paso === 1 ? "text-blue-600 font-extrabold" : ""}>1. DNI</span>
        <span className={paso === 2 ? "text-blue-600 font-extrabold" : ""}>2. Estudiante</span>
        <span className={paso === 3 ? "text-blue-600 font-extrabold" : ""}>3. Domicilio y Salud</span>
        <span className={paso === 4 ? "text-blue-600 font-extrabold" : ""}>4. Tutor / Familia</span>
        <span className={paso === 5 ? "text-blue-600 font-extrabold" : ""}>5. SINIDE y DDJJ</span>
      </div>

      {/* PASO 1: BÚSQUEDA POR DNI */}
      {paso === 1 && (
        <form onSubmit={handleBuscarAlumno} className="space-y-4 max-w-md mx-auto py-6">
          <label className="block text-xs font-bold text-slate-700">
            Número de Documento del Estudiante (DNI sin puntos)
          </label>
          <input
            type="text"
            value={formData.dni}
            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
            placeholder="Ej: 52513201"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
          />
          <button
            type="submit"
            disabled={procesando}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {procesando ? "Consultando..." : "🔍 Continuar y Consultar Legajo"}
          </button>
        </form>
      )}

      {/* PASO 2: DATOS DEL ESTUDIANTE */}
      {paso === 2 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase">📌 Datos Personales del Estudiante</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CUIL del Estudiante</label>
              <input
                type="text"
                value={formData.cuil}
                onChange={(e) => setFormData({ ...formData, cuil: e.target.value })}
                placeholder="Ej: 20-52513201-3"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sexo *</label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">País de Nacimiento</label>
              <input
                type="text"
                value={formData.paisNacimiento}
                onChange={(e) => setFormData({ ...formData, paisNacimiento: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Provincia de Nacimiento</label>
              <input
                type="text"
                value={formData.provinciaNacimiento}
                onChange={(e) => setFormData({ ...formData, provinciaNacimiento: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Localidad de Nacimiento</label>
              <input
                type="text"
                value={formData.localidadNacimiento}
                onChange={(e) => setFormData({ ...formData, localidadNacimiento: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono del Estudiante</label>
              <input
                type="text"
                value={formData.telefonoEstudiante}
                onChange={(e) => setFormData({ ...formData, telefonoEstudiante: e.target.value })}
                placeholder="3804202030"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Teléfono</label>
              <select
                value={formData.tipoTelefono}
                onChange={(e) => setFormData({ ...formData, tipoTelefono: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="Celular">Celular</option>
                <option value="Fijo">Fijo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setPaso(1)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Atrás
            </button>
            <button
              onClick={() => setPaso(3)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              Siguiente: Domicilio y Salud ➔
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: DOMICILIO Y SALUD */}
      {paso === 3 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase">🏠 Domicilio del Estudiante</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Domicilio</label>
              <select
                value={formData.domicilioTipo}
                onChange={(e) => setFormData({ ...formData, domicilioTipo: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="Urbano">Urbano</option>
                <option value="Rural">Rural</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Provincia</label>
              <input
                type="text"
                value={formData.domicilioProvincia}
                onChange={(e) => setFormData({ ...formData, domicilioProvincia: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Localidad</label>
              <input
                type="text"
                value={formData.domicilioLocalidad}
                onChange={(e) => setFormData({ ...formData, domicilioLocalidad: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Barrio</label>
              <input
                type="text"
                value={formData.domicilioBarrio}
                onChange={(e) => setFormData({ ...formData, domicilioBarrio: e.target.value })}
                placeholder="Ej: Barrio Centro"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código Postal</label>
              <input
                type="text"
                value={formData.domicilioCP}
                onChange={(e) => setFormData({ ...formData, domicilioCP: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Calle y Número</label>
              <input
                type="text"
                value={formData.domicilioCalleNumero}
                onChange={(e) => setFormData({ ...formData, domicilioCalleNumero: e.target.value })}
                placeholder="Ej: Av. Rivadavia 450"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <h2 className="text-sm font-black text-slate-800 uppercase pt-4 border-t">🏥 Cobertura de Salud y Emergencia</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Obra Social / Prepaga</label>
              <select
                value={formData.obraSocialPosee}
                onChange={(e) => setFormData({ ...formData, obraSocialPosee: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="Posee">Posee</option>
                <option value="No Posee">No Posee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Obra Social</label>
              <input
                type="text"
                value={formData.obraSocialNombre}
                onChange={(e) => setFormData({ ...formData, obraSocialNombre: e.target.value })}
                placeholder="En caso de no tener responder NO"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Emergencia</label>
              <input
                type="text"
                value={formData.telefonoEmergencia}
                onChange={(e) => setFormData({ ...formData, telefonoEmergencia: e.target.value })}
                placeholder="3804202030"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setPaso(2)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Atrás
            </button>
            <button
              onClick={() => setPaso(4)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              Siguiente: Datos del Tutor ➔
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: DATOS DEL TUTOR */}
      {paso === 4 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase">👨‍👩‍👧 Datos del Tutor / Responsable Legal</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CUIL Tutor/a *</label>
              <input
                type="text"
                value={formData.tutorCuil}
                onChange={(e) => setFormData({ ...formData, tutorCuil: e.target.value })}
                placeholder="Ej: 27-30123456-8"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco *</label>
              <select
                value={formData.tutorParentesco}
                onChange={(e) => setFormData({ ...formData, tutorParentesco: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Tutor Legal">Tutor Legal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">¿Puede retirar al estudiante?</label>
              <select
                value={formData.tutorPuedeRetirar}
                onChange={(e) => setFormData({ ...formData, tutorPuedeRetirar: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos Tutor *</label>
              <input
                type="text"
                value={formData.tutorApellido}
                onChange={(e) => setFormData({ ...formData, tutorApellido: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombres Tutor *</label>
              <input
                type="text"
                value={formData.tutorNombre}
                onChange={(e) => setFormData({ ...formData, tutorNombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Máximo Nivel Educativo</label>
              <select
                value={formData.tutorNivelEducativo}
                onChange={(e) => setFormData({ ...formData, tutorNivelEducativo: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Ocupación</label>
              <input
                type="text"
                value={formData.tutorOcupacion}
                onChange={(e) => setFormData({ ...formData, tutorOcupacion: e.target.value })}
                placeholder="Ej: Empleado público"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={formData.tutorTelefono}
                onChange={(e) => setFormData({ ...formData, tutorTelefono: e.target.value })}
                placeholder="3804202030"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.tutorEmail}
                onChange={(e) => setFormData({ ...formData, tutorEmail: e.target.value })}
                placeholder="tutor@gmail.com"
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">¿Recibe mensajes por WhatsApp?</label>
              <select
                value={formData.tutorWhatsapp}
                onChange={(e) => setFormData({ ...formData, tutorWhatsapp: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setPaso(3)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Atrás
            </button>
            <button
              onClick={() => setPaso(5)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              Siguiente: SINIDE y DDJJ ➔
            </button>
          </div>
        </div>
      )}

      {/* PASO 5: INCLUSIÓN Y DDJJ */}
      {paso === 5 && (
        <form onSubmit={handleSubmitFinal} className="space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase">📋 Datos Complementarios e Inclusión (SINIDE)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">¿Cuenta con Discapacidad?</label>
              <select
                value={formData.discapacidad}
                onChange={(e) => setFormData({ ...formData, discapacidad: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">¿Posee Docente Integrador?</label>
              <select
                value={formData.docenteIntegrador}
                onChange={(e) => setFormData({ ...formData, docenteIntegrador: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">¿Pertenencia a Pueblo Indígena?</label>
              <select
                value={formData.puebloIndigena}
                onChange={(e) => setFormData({ ...formData, puebloIndigena: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 pt-4">
            <h3 className="text-xs font-black text-amber-900 uppercase"> Declaración Jurada</h3>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Al marcar esta casilla, declaro bajo juramento que soy el tutor/a legal o responsable registrado del estudiante.
              Confirmo que todos los datos consignados en este formulario son exactos, veraces y actualizados para ser ingresados al Sistema Nacional de Información Digital Educativa (SINIDE).
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.aceptaTerminos}
                onChange={(e) => setFormData({ ...formData, aceptaTerminos: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-amber-950">ACEPTO Y DECLARO BAJO JURAMENTO</span>
            </label>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setPaso(4)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={procesando || !formData.aceptaTerminos}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {procesando ? "Guardando..." : "✅ Finalizar y Enviar Declaración Jurada"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}