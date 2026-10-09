import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const cargarDatosIniciales = async () => {
  // 1. Colección de Docentes
  const profesoresEjemplo = [
    { id: "prof_1", nombre: "Tello Nancy", especialidad: "Lengua y Literatura" },
    { id: "prof_2", nombre: "Cabrera Florencia", especialidad: "Matemática" },
    { id: "prof_3", nombre: "Teruel", especialidad: "Música" },
    { id: "prof_4", nombre: "Gómez", especialidad: "Historia" },
    { id: "prof_5", nombre: "Martínez", especialidad: "Física" },
    { id: "prof_6", nombre: "López", especialidad: "Geografía" },
  ];

  // 2. Horarios
  const horariosEjemplo = [
    { id: "lunes_1_1primera", dia: "Lunes", modulo: 1, curso: "1er Año Primera", materia: "Lengua y Literatura", docente: "Tello Nancy", estado: "normal" },
    { id: "lunes_2_1primera", dia: "Lunes", modulo: 2, curso: "1er Año Primera", materia: "Matemática", docente: "Cabrera Florencia", estado: "normal" },
    { id: "lunes_4_1primera", dia: "Lunes", modulo: 4, curso: "1er Año Primera", materia: "Música", docente: "Teruel", estado: "desplazado" },
    { id: "lunes_1_1segunda", dia: "Lunes", modulo: 1, curso: "1er Año Segunda", materia: "Matemática", docente: "Cabrera Florencia", estado: "ausente" },
  ];

  try {
    for (const prof of profesoresEjemplo) {
      const { id, ...data } = prof;
      await setDoc(doc(db, "profesores", id), data);
    }

    for (const item of horariosEjemplo) {
      const { id, ...data } = item;
      await setDoc(doc(db, "horarios", id), data);
    }
    console.log("¡Profesores y horarios cargados con éxito!");
  } catch (error) {
    console.error("Error al cargar seed:", error);
    throw error;
  }
};