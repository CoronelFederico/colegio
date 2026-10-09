// src/app/api/notificaciones/route.js
import { NextResponse } from "next/server";
// Importa aquí tu firebase-admin ya configurado en el servidor

export async function POST(request) {
  try {
    const { nombreAlumno, curso } = await request.json();

    // Lógica para enviar la notificación mediante Firebase Admin
    const mensaje = {
      notification: {
        title: "🚨 Alerta de Ausencia",
        body: `El alumno ${nombreAlumno} del curso ${curso} está ausente.`,
      },
      topic: "general", // o el token/topic que uses
    };

    // await admin.messaging().send(mensaje);

    return NextResponse.json({ success: true, message: "Alerta enviada" });
  } catch (error) {
    console.error("Error al enviar alerta:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}