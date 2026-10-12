import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { correoTutor, nombreTutor, nombreAlumno, dniAlumno, curso, linkPortal } = await request.json();

    if (!correoTutor) {
      return NextResponse.json({ error: "No hay correo de tutor" }, { status: 400 });
    }

    const urlLegajo = linkPortal || "https://sistema-1a93b.firebaseapp.com/dashboard?seccion=portal_familia";

    const { data, error } = await resend.emails.send({
      from: "Colegio Secundario Pbro. Carlos Ferreyra <onboarding@resend.dev>",
      to: [correoTutor],
      subject: `📝 Confirmación de Pre-Inscripción - ${nombreAlumno}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #1d4ed8; margin: 0; font-size: 20px; font-weight: 800;">Colegio Secundario Provincial</h2>
            <h3 style="color: #0f172a; margin: 4px 0 0 0; font-size: 16px; font-weight: 700;">Pbro. Virgilio Carlos Ferreyra</h3>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">Anillaco - Depto. Castro Barros - La Rioja</p>
          </div>
          
          <p style="font-size: 15px; color: #334155;">
            Estimado/a <strong>${nombreTutor || "Padre / Madre / Tutor Legal"}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569;">
            Le confirmamos que se ha registrado con éxito la solicitud de pre-inscripción en Mesa de Entrada.
          </p>
          
          <div style="background-color: #f8fafc; padding: 18px; border-radius: 14px; border-left: 4px solid #2563eb; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;"><strong>🎓 Alumno/a:</strong> ${nombreAlumno}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;"><strong>🪪 DNI:</strong> ${dniAlumno}</p>
            ${curso ? `<p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>📚 Curso Asignado:</strong> ${curso}</p>` : ''}
          </div>

          <div style="background-color: #eff6ff; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              📌 <strong>Siguiente Paso:</strong> Complete la ficha de datos extendidos (salud, obra social y legajo provincial) desde el siguiente botón.
            </p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${urlLegajo}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
              🌐 Completar Legajo Digital del Alumno
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            Sistema de Gestión Escolar • Colegio Provincial Pbro. Virgilio Carlos Ferreyra
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error devuelto por Resend:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("Error al enviar email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}