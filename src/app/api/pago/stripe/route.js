import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
  try {
    const { amount } = req.body; // monto en centavos

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // en centavos
      currency: 'mxn', // o 'usd', según tu moneda
      payment_method_types: ['card'],
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
