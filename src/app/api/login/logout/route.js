import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // 1. Invalidar la sesión de Stripe si existe (opcional)
    const sessionId = request.cookies.get("stripe_session")?.value;
    if (sessionId) {
      await stripe.checkout.sessions.expire(sessionId);
    }

    // 2. Crear respuesta y eliminar cookies
    const response = NextResponse.json(
      { success: true, message: "Sesión cerrada" },
      { status: 200 }
    );

    // 3. Eliminar todas las cookies relevantes
    response.cookies.delete("authToken"); // Cookie de autenticación
    response.cookies.delete("stripe_session"); // Cookie de Stripe (si usas)
    response.cookies.delete("cart"); // Cookie del carrito (opcional)

    return response;

  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}