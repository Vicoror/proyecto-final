// app/api/pago/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // siempre define versión
});

export async function POST(req) {
  try {
    const { amount } = await req.json(); // 💰 Monto en centavos

    // Validación del monto
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido. Debe ser un número mayor a 0.' },
        { status: 400 }
      );
    }

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "mxn",
        payment_method_types: ["card", "oxxo"], // 🔹 OXXO incluido
    });

    // Respuesta clara para el frontend
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago. ' + error.message },
      { status: 500 }
    );
  }
}
