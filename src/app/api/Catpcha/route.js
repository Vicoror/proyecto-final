import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export async function POST(req) {
  try {
    const { email, mensaje, recaptchaToken } = await req.json();

    if (!recaptchaToken) {
      return NextResponse.json({ error: 'Falta el token de reCAPTCHA' }, { status: 400 });
    }

    const respuesta = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${SECRET_KEY}&response=${recaptchaToken}`,
    });

    const datos = await respuesta.json();

    if (!datos.success) {
      return NextResponse.json({ error: 'Verificación reCAPTCHA fallida' }, { status: 403 });
    }

    // Aquí puedes guardar en BD o enviar correo
    console.log('Mensaje recibido:', { email, mensaje });

    return NextResponse.json({ success: true, message: 'Formulario enviado con éxito' });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
