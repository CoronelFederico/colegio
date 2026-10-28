// src/services/rifasService.js
import { collection, doc, getDocs, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLECCION = "rifas";

// Obtener todos los números registrados (del 000 al 999)
export async function obtenerEstadoRifas() {
  try {
    const querySnapshot = await getDocs(collection(db, COLECCION));
    const rifasMap = {};
    querySnapshot.forEach((docSnap) => {
      rifasMap[docSnap.id] = docSnap.data();
    });
    return rifasMap;
  } catch (error) {
    console.error("Error al obtener rifas:", error);
    return {};
  }
}

// Registrar o vender un número
export async function registrarVentaRifa(numeroStr, datosVenta) {
  try {
    const docRef = doc(db, COLECCION, numeroStr);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().estado === "vendido") {
      return { success: false, error: "¡Ese número ya fue vendido!" };
    }

    await setDoc(docRef, {
      numero: numeroStr,
      estado: "vendido",
      vendedorId: datosVenta.vendedorId,
      vendedorNombre: datosVenta.vendedorNombre,
      compradorNombre: datosVenta.compradorNombre,
      fechaVenta: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error al registrar venta:", error);
    return { success: false, error: "Error de conexión" };
  }
}