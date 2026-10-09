import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { correoTutor, nombreTutor, nombreAlumno, dniAlumno, curso, linkPortal } = await request.json();

    if (!correoTutor) {
      return NextResponse.json({ error: "No hay correo de tutor" }, { status: 400 });
    }

    const urlLegajo = linkPortal || "https://tu-dominio-colegio.com/portal-familias";

    const data = await resend.emails.send({
      from: "Colegio Secundario Pbro. Carlos Ferreyra <onboarding@resend.dev>",
      to: [correoTutor],
      subject: `📝 Confirmación de Pre-Inscripción - ${nombreAlumno}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Encabezado Institucional -->
          <div style="text-align: center; border-b: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #1d4ed8; margin: 0; font-size: 20px; font-weight: 800;">Colegio Secundario Provincial</h2>
            <h3 style="color: #0f172a; margin: 4px 0 0 0; font-size: 16px; font-weight: 700;">Pbro. Virgilio Carlos Ferreyra</h3>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0; font-weight: 500;">Anillaco - Depto. Castro Barros - La Rioja</p>
          </div>
          
          <!-- Saludo y Mensaje -->
          <p style="font-size: 15px; line-height: 1.5; color: #334155;">
            Estimado/a <strong>${nombreTutor || "Padre / Madre / Tutor Legal"}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            Le confirmamos que se ha registrado con éxito la solicitud de pre-inscripción en Mesa de Entrada para el ciclo lectivo.
          </p>
          
          <!-- Ficha Resumen -->
          <div style="background-color: #f8fafc; padding: 18px; border-radius: 14px; border-left: 4px solid #2563eb; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;">
              <strong>🎓 Alumno/a:</strong> ${nombreAlumno}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;">
              <strong>🪪 DNI:</strong> ${dniAlumno}
            </p>
            ${curso ? `<p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>📚 Curso Asignado:</strong> ${curso}</p>` : ''}
          </div>

          <!-- Indicaciones para el Tutor -->
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
              📌 <strong>Siguiente Paso:</strong> Para no demorar en la escuela, le solicitamos ingresar al portal digital desde su celular o computadora para completar la ficha de datos extendidos (salud, obra social y legajo provincial).
            </p>
          </div>

          <!-- Botón de Acción -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${urlLegajo}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🌐 Completar Legajo Digital del Alumno
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

          <!-- Pie de página -->
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
            Este es un correo automático emitido por el Sistema de Gestión Escolar.<br />
            Por consultas o entregas de documentación física, diríjase a la secretaría del establecimiento.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("Error al enviar email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}