import { getMessaging } from "firebase-admin/messaging";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token, topic } = await req.json();

    // Vincula este celular al canal de alertas generales
    await getMessaging().subscribeToTopic(token, topic);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}